import {z} from 'zod';
import buildSchema from '@/entity/buildSchema';
import entities from '@/entity/entities';
import type EntityName from '@/entity/EntityName';
import BillingService from '@/server/billing/BillingService';
import setCustomerArchived from '@/server/customer/setCustomerArchived';
import DashboardService from '@/server/dashboard/DashboardService';
import EntityService from '@/server/entity/EntityService';
import invoiceInputSchema from '@/server/invoice/invoiceInputSchema';
import InvoiceService from '@/server/invoice/InvoiceService';
import type McpTool from '@/server/mcp/McpTool';
import TenantService from '@/server/tenant/TenantService';
import UserService from '@/server/user/UserService';

const listInput = z.object({
    customerId:      z.uuid().optional().describe('Only records of this customer'),
    filters:         z.record(z.string(), z.string()).optional().describe('Equality filters, e.g. {"status": "open"}'),
    includeArchived: z.boolean().optional().describe('Customers only: include archived customers'),
    limit:           z.number().int().min(1).max(1000).optional(),
    offset:          z.number().int().min(0).optional(),
    order:           z.enum(['asc', 'desc']).optional(),
    q:               z.string().optional().describe('Full text search'),
    sort:            z.string().optional(),
});
const idInput = z.object({id: z.uuid()});
const dashboardInput = z.object({
    customerId: z.uuid().optional().describe('Restrict to one customer'),
    year:       z.number().int().optional().describe('Restrict to one year (incl. plan year)'),
});

function entityTools(name: EntityName): McpTool[] {
    const definition = entities[name];
    const service = new EntityService(name);
    const singular = definition.singular;
    const tools: McpTool[] = [
        {
            description: `List ${name} (paginated). Money values are decimals in the tenant currency.`,
            handler:     (context, args) => service.list(context, args),
            inputSchema: listInput,
            name:        `list_${name.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)}`,
            readOnly:    true,
        },
        {
            description: `Get one ${singular.replace(/_/g, ' ')} by id.`,
            handler:     (context, args) => (name === 'invoices' ? new InvoiceService().get(context, args.id) : service.get(context, args.id)),
            inputSchema: idInput,
            name:        `get_${singular}`,
            readOnly:    true,
        },
    ];
    if (definition.customWrite !== true) {
        tools.push(
            {
                adminOnly:   definition.adminOnly,
                description: `Create a ${singular.replace(/_/g, ' ')}.`,
                handler:     (context, args) => service.create(context, args),
                inputSchema: buildSchema(definition.fields, 'create'),
                name:        `create_${singular}`,
                readOnly:    false,
            },
            {
                adminOnly:   definition.adminOnly,
                description: `Update a ${singular.replace(/_/g, ' ')}. Only the given fields change.`,
                handler:     (context, args) => service.update(context, args.id, args.data),
                inputSchema: z.object({data: buildSchema(definition.fields, 'update'), id: z.uuid()}),
                name:        `update_${singular}`,
                readOnly:    false,
            },
            {
                adminOnly:   definition.adminOnly,
                description: `Delete a ${singular.replace(/_/g, ' ')}.`,
                destructive: true,
                handler:     async (context, args) => {
                    await service.remove(context, args.id);
                    return {deleted: args.id};
                },
                inputSchema: idInput,
                name:        `delete_${singular}`,
                readOnly:    false,
            },
        );
    }
    return tools;
}

/**
 * All MCP tools. The MCP server exposes everything the REST API can do.
 */
export default function buildMcpTools(): McpTool[] {
    const invoices = new InvoiceService();
    const invoiceAction = (name: string, description: string, run: (context: Parameters<McpTool['handler']>[0], args: Record<string, any>) => Promise<unknown>, schema: z.ZodObject = idInput): McpTool => ({
        description,
        handler:     run,
        inputSchema: schema,
        name,
        readOnly:    false,
    });

    return [
        ...(Object.keys(entities) as EntityName[]).flatMap(entityTools),
        {
            description: 'Get the dashboard summary: key figures (KPIs), revenue/expenses per year incl. plan year, customer ratings ("is it worth it?"), tax estimate. Amounts are in cents, unlike entity tools which use decimal currency units.',
            handler:     async (context, args) => {
                const result = await new DashboardService().get(context, args);
                return {customers: result.customers, filter: result.filter, kpis: result.kpis, lastActualYear: result.lastActualYear, planYear: result.planYear, tax: result.tax, years: result.years};
            },
            inputSchema: dashboardInput,
            name:        'get_dashboard_summary',
            readOnly:    true,
        },
        {
            description: 'Monthly cash flow with cumulative balance (amounts in cents).',
            handler:     async (context, args) => (await new DashboardService().get(context, args)).cashflow,
            inputSchema: dashboardInput,
            name:        'get_cashflow',
            readOnly:    true,
        },
        {
            description: 'Upcoming items: invoices to issue, recurring invoices, planned costs, renewals (amounts in cents).',
            handler:     async (context, args) => (await new DashboardService().get(context, args)).upcoming,
            inputSchema: dashboardInput,
            name:        'list_upcoming',
            readOnly:    true,
        },
        {
            description: 'Create a draft invoice with positions. Issue it with issue_invoice.',
            handler:     (context, args) => invoices.create(context, args),
            inputSchema: invoiceInputSchema,
            name:        'create_invoice',
            readOnly:    false,
        },
        {
            description: 'Update a draft invoice (only status to_issue).',
            handler:     (context, args) => invoices.update(context, args.id, args.data),
            inputSchema: z.object({data: invoiceInputSchema.partial(), id: z.uuid()}),
            name:        'update_invoice',
            readOnly:    false,
        },
        {
            description: 'Delete a draft invoice. Issued invoices cannot be deleted; cancel them.',
            destructive: true,
            handler:     async (context, args) => {
                await invoices.remove(context, args.id);
                return {deleted: args.id};
            },
            inputSchema: idInput,
            name:        'delete_invoice',
            readOnly:    false,
        },
        invoiceAction('issue_invoice', 'Issue a draft invoice: assigns the number, freezes the data and creates the PDF.', (context, args) => invoices.issue(context, args.id, {date: args.date}),
                      z.object({date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), id: z.uuid()})),
        invoiceAction('mark_invoice_paid', 'Mark an open invoice as paid.', (context, args) => invoices.markPaid(context, args.id, {paidAt: args.paidAt}),
                      z.object({id: z.uuid(), paidAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()})),
        invoiceAction('reopen_invoice', 'Set a paid invoice back to open.', (context, args) => invoices.reopen(context, args.id)),
        invoiceAction('cancel_invoice', 'Cancel an issued invoice by creating a cancellation invoice.', (context, args) => invoices.cancel(context, args.id)),
        invoiceAction('send_invoice', 'Send an issued invoice by e-mail (PDF attached).', (context, args) => invoices.send(context, args.id, {message: args.message, to: args.to}),
                      z.object({id: z.uuid(), message: z.string().optional(), to: z.email().optional()})),
        invoiceAction('remind_invoice', 'Send a payment reminder for an open invoice.', (context, args) => invoices.remind(context, args.id, {message: args.message, to: args.to}),
                      z.object({id: z.uuid(), message: z.string().optional(), to: z.email().optional()})),
        {
            description: 'Recurring billing run: create draft invoices from due recurring charges (grouped by recipient). Use dryRun to preview.',
            handler:     (context, args) => new BillingService().run(context, args),
            inputSchema: z.object({dryRun: z.boolean().optional(), until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()}),
            name:        'run_recurring_billing',
            readOnly:    false,
        },
        {
            description: 'Archive a customer (only possible without recurring charges).',
            handler:     (context, args) => setCustomerArchived(context, args.id, true),
            inputSchema: idInput,
            name:        'archive_customer',
            readOnly:    false,
        },
        {
            description: 'Restore an archived customer.',
            handler:     (context, args) => setCustomerArchived(context, args.id, false),
            inputSchema: idInput,
            name:        'unarchive_customer',
            readOnly:    false,
        },
        {
            description: 'Get the business settings of the tenant (company data, invoicing, tax).',
            handler:     (context) => new TenantService().getSettings(context),
            inputSchema: z.object({}),
            name:        'get_settings',
            readOnly:    true,
        },
        {
            adminOnly:   true,
            description: 'Update business settings (admins only).',
            handler:     (context, args) => new TenantService().updateSettings(context, args),
            inputSchema: z.object({}).catchall(z.unknown()),
            name:        'update_settings',
            readOnly:    false,
        },
        {
            adminOnly:   true,
            description: 'List the users of the tenant (admins only).',
            handler:     (context) => new UserService().list(context),
            inputSchema: z.object({}),
            name:        'list_users',
            readOnly:    true,
        },
        {
            adminOnly:   true,
            description: 'Create a user (admins only).',
            handler:     (context, args) => new UserService().create(context, args),
            inputSchema: z.object({email: z.email(), locale: z.enum(['de', 'en']).optional(), name: z.string(), password: z.string().min(10), role: z.enum(['admin', 'user']).optional()}),
            name:        'create_user',
            readOnly:    false,
        },
        {
            adminOnly:   true,
            description: 'Update a user (admins only).',
            handler:     (context, args) => new UserService().update(context, args.id, args.data),
            inputSchema: z.object({
                data: z.object({active: z.boolean().optional(), email: z.email().optional(), name: z.string().optional(), password: z.string().min(10).optional(), role: z.enum(['admin', 'user']).optional()}),
                id:   z.uuid(),
            }),
            name:        'update_user',
            readOnly:    false,
        },
        {
            adminOnly:   true,
            description: 'Delete a user (admins only).',
            destructive: true,
            handler:     async (context, args) => {
                await new UserService().remove(context, args.id);
                return {deleted: args.id};
            },
            inputSchema: idInput,
            name:        'delete_user',
            readOnly:    false,
        },
    ];
}
