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
            admin:    {email: 'admin@example.com', name: 'Admin', password: 'Very-secret-passw0rd'},
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

    it('addresses invoices to the billing recipient', async () => {
        const {default: EntityService} = await import('@/server/entity/EntityService');
        const {default: InvoiceService} = await import('@/server/invoice/InvoiceService');
        const {default: TenantService} = await import('@/server/tenant/TenantService');
        const {default: getDb} = await import('@/server/db/getDb');
        const customers = new EntityService('customers');
        await expect(customers.create(context, {billingCity: 'Wien', name: 'Unvollständig'})).rejects.toThrow(/billing address/);

        const customer = await customers.create(context, {
            billingCity:        'Wien',
            billingCountry:     'AT',
            billingEmail:       'rechnung@example.com',
            billingHouseNumber: '1',
            billingName:        'Holding AG',
            billingPostalCode:  '1010',
            billingStreet:      'Graben',
            contactName:        'Hans Meier',
            email:              'kunde@example.com',
            name:               'Kunde B',
        });
        await expect(customers.update(context, customer.id, {billingStreet: null})).rejects.toThrow(/billing address/);
        await new TenantService().updateSettings(context, {city: 'Musterstadt', houseNumber: '2', postalCode: '12345', street: 'Musterweg'});

        const invoices = new InvoiceService();
        const invoice = await invoices.create(context, {customerId: customer.id, description: 'Beratung', lines: [{description: 'Work', quantity: 1, unitPrice: 80}]});
        await invoices.issue(context, invoice.id, {date: '2026-03-01'});
        const row = await (await getDb()).selectFrom('invoices').select('snapshot').where('id', '=', invoice.id).executeTakeFirstOrThrow();
        const snapshot = JSON.parse(String(row.snapshot)) as import('@/server/invoice/InvoiceSnapshot').default;
        expect(snapshot.recipient).toEqual({address: 'Graben 1\n1010 Wien\nÖSTERREICH', email: 'rechnung@example.com', name: 'Holding AG'});
        expect(snapshot.tenant.address).toBe('Musterweg 2\n12345 Musterstadt\nDEUTSCHLAND');
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

    it('renders a template preview from unsaved values', async () => {
        const {default: buildTemplatePreviewSnapshot} = await import('@/server/invoice/buildTemplatePreviewSnapshot');
        const {default: renderInvoicePdf} = await import('@/server/pdf/renderInvoicePdf');
        const snapshot = await buildTemplatePreviewSnapshot(context, {accentColor: '#12', introText: 'Hallo', paymentTermDays: 30});
        expect(snapshot.template.accentColor).toBe('#0f6b5c');
        expect(snapshot.template.introText).toBe('Hallo');
        expect(snapshot.dueDate! > snapshot.date!).toBe(true);
        expect(snapshot.recipient.name).toBe('Muster GmbH');
        expect((await renderInvoicePdf(snapshot, false)).subarray(0, 4).toString()).toBe('%PDF');
    });

    it('signs in with two-factor authentication', async () => {
        const {default: TwoFactorService} = await import('@/server/auth/TwoFactorService');
        const {default: AuthService} = await import('@/server/auth/AuthService');
        const {default: base32Decode} = await import('@/server/totp/base32Decode');
        const {default: totpCode} = await import('@/server/totp/totpCode');
        const {default: totpStep} = await import('@/server/totp/totpStep');
        const service = new TwoFactorService();
        const ui = {...context, via: 'ui' as const};
        const meta = {ip: '127.0.0.1', userAgent: 'test'};
        const credentials = {email: 'admin@example.com', password: 'Very-secret-passw0rd'};

        await expect(service.setup(context)).rejects.toThrow(/only be changed in the app/);
        const setup = await service.setup(ui);
        expect(setup.uri).toMatch(/^otpauth:\/\/totp\/Annuva%3Aadmin%40example\.com\?secret=/);
        expect(setup.qrCode).toContain('<svg');
        const secret = base32Decode(setup.secret);
        const step = totpStep(Date.now());
        await expect(service.enable(ui, {code: '000000'})).rejects.toThrow(/not valid/);
        const {recoveryCodes} = await service.enable(ui, {code: totpCode(secret, step)});
        expect(recoveryCodes).toHaveLength(10);
        expect(await service.status(ui)).toEqual({enabled: true, recoveryCodesLeft: 10});

        const auth = new AuthService();
        const first = await auth.login(credentials, meta);
        expect(first.twoFactorRequired).toBe(true);
        const challenge = (first as { challenge: string }).challenge;
        // the code used for enabling cannot be replayed
        await expect(auth.loginTwoFactor({challenge, code: totpCode(secret, step)}, meta)).rejects.toThrow(/not valid/);
        await expect(auth.loginTwoFactor({challenge: `${challenge}x`, code: totpCode(secret, step + 1)}, meta)).rejects.toThrow(/expired/);
        expect((await auth.loginTwoFactor({challenge, code: totpCode(secret, step + 1)}, meta)).token).toBeTruthy();

        expect((await auth.loginTwoFactor({challenge, code: recoveryCodes[0].toUpperCase()}, meta)).token).toBeTruthy();
        await expect(auth.loginTwoFactor({challenge, code: recoveryCodes[0]}, meta)).rejects.toThrow(/not valid/);
        expect((await service.status(ui)).recoveryCodesLeft).toBe(9);

        await expect(service.disable(ui, {code: recoveryCodes[1], password: 'wrong'})).rejects.toThrow(/password/);
        await service.disable(ui, {code: recoveryCodes[1], password: credentials.password});
        expect((await auth.login(credentials, meta)).twoFactorRequired).toBe(false);
    });

    it('authenticates API tokens', async () => {
        const {default: TokenService} = await import('@/server/token/TokenService');
        const {default: getRequestContext} = await import('@/server/auth/getRequestContext');
        const token = await new TokenService().create(context, {name: 'Test', scope: 'read'});
        const resolved = await getRequestContext(new Request('http://localhost/api/v1/customers', {headers: {Authorization: `Bearer ${token.token}`}}));
        expect(resolved).toMatchObject({scope: 'read', userId: context.userId});
        await expect(getRequestContext(new Request('http://localhost/', {headers: {Authorization: 'Bearer an_wrong'}}))).rejects.toThrow(/Invalid/);
    });

    it('uploads receipts as base64 and attaches them to records', async () => {
        const {default: EntityService} = await import('@/server/entity/EntityService');
        const {default: FileService} = await import('@/server/file/FileService');
        const {default: readStoredFile} = await import('@/server/file/readStoredFile');

        const customer = await new EntityService('customers').create(context, {email: 'receipt@example.com', name: 'Receipt GmbH'});
        const expenses = new EntityService('expenses');
        const expense = await expenses.create(context, {assignedTo: customer.id, category: 'domain', date: '2026-11-16', grossAmount: 9, item: 'annuva.de', status: 'expected', vendor: 'IONOS'});
        const pdf = Buffer.from('%PDF-1.4\n% receipt\n%%EOF\n');
        const files = new FileService();

        const attached = await files.uploadBase64(context, {
            attachTo: {entity: 'expenses', id: expense.id},
            content:  pdf.toString('base64'),
            fileName: 'Rechnung.pdf',
        });
        expect(attached).toMatchObject({mimeType: 'application/pdf', originalName: 'Rechnung.pdf', size: pdf.length, url: `/api/v1/files/${attached.id}`});
        expect(attached.record?.receiptFileId).toBe(attached.id);
        expect((await expenses.get(context, expense.id)).receiptFileId).toBe(attached.id);
        expect((await readStoredFile(context, attached.id)).content.equals(pdf)).toBe(true);

        const loose = await files.uploadBase64(context, {content: `data:application/pdf;base64,${pdf.toString('base64')}`, fileName: 'scan'});
        expect(loose.mimeType).toBe('application/pdf');
        expect(loose.record).toBeUndefined();

        await expect(files.uploadBase64(context, {content: 'not base64!', fileName: 'x.pdf'})).rejects.toThrow(/base64/);
        await expect(files.uploadBase64(context, {attachTo: {entity: 'invoices', id: expense.id}, content: pdf.toString('base64'), fileName: 'x.pdf'})).rejects.toThrow(/invalid/);
        await expect(files.uploadBase64(context, {attachTo: {entity: 'expenses', id: customer.id}, content: pdf.toString('base64'), fileName: 'x.pdf'})).rejects.toThrow(/not found/i);

        const template = (await new EntityService('invoiceTemplates').list(context, {})).items[0];
        await expect(files.uploadBase64(context, {attachTo: {entity: 'invoice-templates', id: template.id}, content: pdf.toString('base64'), fileName: 'x.pdf'})).rejects.toThrow(/logoFileId, signatureFileId/);
        await expect(files.uploadBase64(context, {attachTo: {entity: 'invoice-templates', field: 'logoFileId', id: template.id}, content: pdf.toString('base64'), fileName: 'x.pdf'}))
            .rejects.toThrow(/only accepts image/);
        await expect(files.uploadBase64({...context, scope: 'read'}, {content: pdf.toString('base64'), fileName: 'x.pdf'})).rejects.toThrow(/read access/);
    });

    it('accepts file uploads via the REST API as multipart and JSON', async () => {
        const {POST} = await import('@/app/api/v1/files/route');
        const {default: EntityService} = await import('@/server/entity/EntityService');
        const {default: TokenService} = await import('@/server/token/TokenService');
        const token = await new TokenService().create(context, {name: 'Upload', scope: 'read_write'});
        const headers = {Authorization: `Bearer ${token.token}`};
        const params = {params: Promise.resolve({})};
        const customer = await new EntityService('customers').create(context, {email: 'rest@example.com', name: 'REST GmbH'});
        const offer = await new EntityService('offers').create(context, {amount: 100, customerId: customer.id, date: '2026-11-17', number: 'AN-1'});
        const pdf = Buffer.from('%PDF-1.7\n%%EOF\n');

        const form = new FormData();
        form.append('file', new File([pdf], 'Angebot.pdf', {type: 'application/pdf'}));
        form.append('entity', 'offers');
        form.append('id', offer.id);
        const multipart = await POST(new Request('http://localhost/api/v1/files', {body: form, headers, method: 'POST'}), params);
        expect(multipart.status).toBe(201);
        const stored = await multipart.json();
        expect(stored.record.fileId).toBe(stored.id);

        const json = await POST(new Request('http://localhost/api/v1/files', {
            body:    JSON.stringify({content: pdf.toString('base64'), fileName: 'Beleg.pdf'}),
            headers: {...headers, 'Content-Type': 'application/json'},
            method:  'POST',
        }), params);
        expect(json.status).toBe(201);
        expect(await json.json()).toMatchObject({mimeType: 'application/pdf', originalName: 'Beleg.pdf'});
    });

    it('uploads a receipt through the MCP server', async () => {
        const {Client} = await import('@modelcontextprotocol/sdk/client/index.js');
        const {InMemoryTransport} = await import('@modelcontextprotocol/sdk/inMemory.js');
        const {default: createMcpServer} = await import('@/server/mcp/createMcpServer');
        const {default: EntityService} = await import('@/server/entity/EntityService');

        const customer = await new EntityService('customers').create(context, {email: 'mcp@example.com', name: 'MCP GmbH'});
        const expense = await new EntityService('expenses').create(context, {assignedTo: customer.id, category: 'domain', date: '2026-11-16', grossAmount: 9, item: 'Domain', vendor: 'IONOS'});
        const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
        await createMcpServer({...context, via: 'mcp'}).connect(serverTransport);
        const client = new Client({name: 'test', version: '1.0.0'});
        await client.connect(clientTransport);

        const result = await client.callTool({
            arguments: {attachTo: {entity: 'expenses', id: expense.id}, content: Buffer.from('%PDF-1.4\n%%EOF\n').toString('base64'), fileName: 'Rechnung.pdf'},
            name:      'upload_file',
        });
        expect(result.isError).not.toBe(true);
        const uploaded = JSON.parse((result.content as { text: string }[])[0].text);
        expect(uploaded.record.receiptFileId).toBe(uploaded.id);
        await client.close();
    });

    it('offers write tools only to read_write tokens via MCP', async () => {
        const {default: buildMcpTools} = await import('@/server/mcp/buildMcpTools');
        const tools = buildMcpTools();
        expect(tools.some((tool) => tool.name === 'create_customer' && !tool.readOnly)).toBe(true);
        expect(tools.some((tool) => tool.name === 'get_dashboard_summary' && tool.readOnly)).toBe(true);
        expect(tools.some((tool) => tool.name === 'upload_file' && !tool.readOnly)).toBe(true);
        expect(new Set(tools.map((tool) => tool.name)).size).toBe(tools.length);
    });
});
