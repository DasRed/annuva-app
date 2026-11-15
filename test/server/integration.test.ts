import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {afterAll, beforeAll, describe, expect, it} from 'vitest';

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'annuva-test-'));
process.env.DATA_DIR = dataDir;
process.env.SETUP_TOKEN = 'test-setup-token';
process.env.LOG_LEVEL = 'error';

/**
 * End-to-end through the services against a real SQLite database: setup, entities, invoices,
 * billing run and dashboard.
 */
describe('services with SQLite', () => {
    let context: import('@/server/auth/AuthContext').default;

    beforeAll(async () => {
        const {default: bootstrap} = await import('@/server/app/bootstrap');
        await bootstrap();
        const {default: SetupService} = await import('@/server/setup/SetupService');
        const user = await new SetupService().complete({
            admin:    {email: 'admin@example.com', name: 'Admin', password: 'very-secret-password'},
            settings: {companyName: 'Example GmbH', name: 'Example', vatMode: 'small_business'},
            template: {name: 'Standard', paymentTermDays: 10},
            token:    'test-setup-token',
        });
        context = {locale: 'de', role: 'admin', scope: 'read_write', tenantId: user.tenantId, userId: user.id, via: 'api'};
    });

    afterAll(() => {
        fs.rmSync(dataDir, {force: true, recursive: true});
    });

    it('rejects a second setup', async () => {
        const {default: SetupService} = await import('@/server/setup/SetupService');
        await expect(new SetupService().verifyToken('test-setup-token')).rejects.toThrow(/already/);
    });

    it('runs the full invoicing flow', async () => {
        const {default: EntityService} = await import('@/server/entity/EntityService');
        const {default: InvoiceService} = await import('@/server/invoice/InvoiceService');
        const {default: BillingService} = await import('@/server/billing/BillingService');
        const {default: DashboardService} = await import('@/server/dashboard/DashboardService');
        const {default: setCustomerArchived} = await import('@/server/customer/setCustomerArchived');

        const customers = new EntityService('customers');
        const customer = await customers.create(context, {email: 'kunde@example.com', name: 'Kunde A'});
        expect(customer.channel).toBe('direct');

        const charges = new EntityService('recurringCharges');
        const charge = await charges.create(context, {amountPerYear: 60, customerId: customer.id, nextInvoiceDate: '2026-01-01', service: 'hosting'});
        await expect(setCustomerArchived(context, customer.id, true)).rejects.toThrow(/recurring charges/);

        const run = await new BillingService().run(context, {until: '2026-01-31'});
        expect(run.invoices).toHaveLength(1);
        expect((await charges.get(context, charge.id)).nextInvoiceDate).toBe('2027-01-01');

        const invoices = new InvoiceService();
        const draft = await invoices.get(context, run.invoices[0].id);
        expect(draft.status).toBe('to_issue');
        expect(draft.grossAmount).toBe(60);

        const issued = await invoices.issue(context, draft.id, {date: '2026-01-05'});
        expect(issued.number).toBe('RE-2026-001');
        expect(issued.dueDate).toBe('2026-01-15');
        expect(issued.fileId).not.toBeNull();
        const pdf = await invoices.pdf(context, draft.id);
        expect(pdf.content.subarray(0, 4).toString()).toBe('%PDF');
        await expect(invoices.update(context, draft.id, {description: 'changed'})).rejects.toThrow(/cannot be changed/);

        const second = await invoices.create(context, {customerId: customer.id, description: 'Extra', lines: [{description: 'Work', quantity: 1.5, unitPrice: 80}]});
        expect(second.grossAmount).toBe(120);
        expect((await invoices.issue(context, second.id, {date: '2026-02-01'})).number).toBe('RE-2026-002');

        const cancellation = await invoices.cancel(context, second.id);
        expect(cancellation.grossAmount).toBe(-120);
        expect((await invoices.get(context, second.id)).status).toBe('cancelled');

        await invoices.markPaid(context, draft.id, {paidAt: '2026-01-20'});

        const dashboard = await new DashboardService().get(context, {year: 2026});
        expect(dashboard.kpis.revenue).toBe(6_000);
        expect(dashboard.customers[0].rating).toBe('worth_it');

        await charges.remove(context, charge.id);
        const archived = await setCustomerArchived(context, customer.id, true);
        expect(archived.archivedAt).not.toBeNull();
        expect((await customers.list(context)).items).toHaveLength(0);
        expect((await customers.list(context, {includeArchived: true})).items).toHaveLength(1);
        await expect(customers.remove(context, customer.id)).rejects.toThrow(/linked records/);
    });

    it('enforces read-only tokens and tenant isolation', async () => {
        const {default: EntityService} = await import('@/server/entity/EntityService');
        const service = new EntityService('partners');
        await expect(service.create({...context, scope: 'read'}, {name: 'X'})).rejects.toThrow(/read access/);
        const partner = await service.create(context, {name: 'Agentur'});
        await expect(service.get({...context, tenantId: 'other-tenant'}, partner.id)).rejects.toThrow(/not found/);
    });

    it('returns plain objects that can be passed to client components', async () => {
        const {default: EntityService} = await import('@/server/entity/EntityService');
        const {items} = await new EntityService('partners').list(context);
        expect(items.length).toBeGreaterThan(0);
        expect(Object.getPrototypeOf(items[0])).toBe(Object.prototype);
        const {default: getDb} = await import('@/server/db/getDb');
        const row = await (await getDb()).selectFrom('users').select(['id']).executeTakeFirstOrThrow();
        expect(Object.getPrototypeOf(row)).toBe(Object.prototype);
    });

    it('authenticates API tokens', async () => {
        const {default: TokenService} = await import('@/server/token/TokenService');
        const {default: getRequestContext} = await import('@/server/auth/getRequestContext');
        const token = await new TokenService().create(context, {name: 'Test', scope: 'read'});
        const resolved = await getRequestContext(new Request('http://localhost/api/v1/customers', {headers: {Authorization: `Bearer ${token.token}`}}));
        expect(resolved).toMatchObject({scope: 'read', userId: context.userId});
        await expect(getRequestContext(new Request('http://localhost/', {headers: {Authorization: 'Bearer an_wrong'}}))).rejects.toThrow(/Invalid/);
    });

    it('offers write tools only to read_write tokens via MCP', async () => {
        const {default: buildMcpTools} = await import('@/server/mcp/buildMcpTools');
        const tools = buildMcpTools();
        expect(tools.some((tool) => tool.name === 'create_customer' && !tool.readOnly)).toBe(true);
        expect(tools.some((tool) => tool.name === 'get_dashboard_summary' && tool.readOnly)).toBe(true);
        expect(new Set(tools.map((tool) => tool.name)).size).toBe(tools.length);
    });
});
