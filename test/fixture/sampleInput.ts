import type DashboardInput from '@/calculation/DashboardInput';

/**
 * Sample data from the dashboard specification, section 9 (amounts in cents).
 */
const sampleInput: DashboardInput = {
    customers:        [
        {archived: false, channel: 'partner', id: 'muster', name: 'Muster GmbH', partnerId: 'agency', status: 'active'},
        {archived: false, channel: 'partner', id: 'praxis', name: 'Beispiel Praxis', partnerId: 'agency', status: 'active'},
        {archived: false, channel: 'direct', id: 'erika', name: 'Erika Mustermann', partnerId: null, status: 'active'},
        {archived: false, channel: 'direct', id: 'verein', name: 'Verein Musterstadt', partnerId: null, status: 'inactive'},
        {archived: false, channel: 'own_project', id: 'alpha', name: 'Projekt Alpha', partnerId: null, status: 'active'},
        {archived: false, channel: 'internal', id: 'infra', name: 'Infrastruktur', partnerId: null, status: 'active'},
    ],
    expenses:         [
        {assignedTo: 'infra', category: 'server', date: '2025-01-15', grossAmount: 10_000, id: 'e1', item: 'Server 2025', status: 'receipt', vendor: 'Hetzner'},
        {assignedTo: 'alpha', category: 'software', date: '2025-06-01', grossAmount: 5_000, id: 'e2', item: 'License', status: 'receipt', vendor: 'Vendor'},
        {assignedTo: 'infra', category: 'server', date: '2026-01-15', grossAmount: 10_000, id: 'e3', item: 'Server 2026', status: 'planned', vendor: 'Hetzner'},
    ],
    invoices:         [
        {
            customerId:    'muster',
            date:          '2025-01-10',
            description:   'Recurring 2025',
            dueDate:       '2025-01-24',
            id:            'i1',
            lines:         [{amount: 7_500, customerId: 'muster'}, {amount: 14_000, customerId: 'praxis'}],
            number:        'RE-2025-001',
            partnerId:     'agency',
            recipientType: 'partner',
            status:        'paid',
        },
        {
            customerId:    'erika',
            date:          '2025-01-12',
            description:   'Recurring 2025',
            dueDate:       null,
            id:            'i2',
            lines:         [{amount: 7_500, customerId: 'erika'}],
            number:        'RE-2025-002',
            partnerId:     null,
            recipientType: 'customer',
            status:        'paid',
        },
        {
            customerId:    'verein',
            date:          '2025-03-01',
            description:   'Website',
            dueDate:       null,
            id:            'i3',
            lines:         [{amount: 120_000, customerId: 'verein'}],
            number:        'RE-2025-003',
            partnerId:     null,
            recipientType: 'customer',
            status:        'open',
        },
        {
            customerId:    'erika',
            date:          null,
            description:   'Extra work',
            dueDate:       '2026-02-01',
            id:            'i4',
            lines:         [{amount: 20_000, customerId: 'erika'}],
            number:        null,
            partnerId:     null,
            recipientType: 'customer',
            status:        'to_issue',
        },
    ],
    partners:         [{id: 'agency', name: 'Agentur Beispiel'}],
    recurringCharges: [
        {amountPerYear: 6_000, customerId: 'muster', description: null, id: 'c1', interval: 'yearly', nextInvoiceDate: '2026-01-01', service: 'hosting'},
        {amountPerYear: 1_500, customerId: 'muster', description: 'muster.de', id: 'c2', interval: 'yearly', nextInvoiceDate: '2026-01-01', service: 'domain'},
        {amountPerYear: 6_000, customerId: 'praxis', description: null, id: 'c3', interval: 'yearly', nextInvoiceDate: '2026-01-01', service: 'hosting'},
        {amountPerYear: 3_000, customerId: 'praxis', description: '2 domains', id: 'c4', interval: 'yearly', nextInvoiceDate: '2026-01-01', service: 'domain'},
        {amountPerYear: 5_000, customerId: 'praxis', description: 'Mail', id: 'c5', interval: 'yearly', nextInvoiceDate: '2026-01-01', service: 'package'},
        {amountPerYear: 6_000, customerId: 'erika', description: null, id: 'c6', interval: 'yearly', nextInvoiceDate: '2026-01-01', service: 'hosting'},
        {amountPerYear: 1_500, customerId: 'erika', description: 'erika.de', id: 'c7', interval: 'yearly', nextInvoiceDate: '2026-01-01', service: 'domain'},
    ],
    recurringCosts:   [
        {assignedTo: 'infra', costPerYear: 10_000, id: 'f1', name: 'Server', nextRenewal: '2026-01-15', provider: 'Hetzner', rebilledPerYear: 0, type: 'server'},
        {assignedTo: 'muster', costPerYear: 1_500, id: 'f2', name: 'muster.de', nextRenewal: '2026-03-01', provider: 'IONOS', rebilledPerYear: 1_500, type: 'domain'},
        {assignedTo: 'praxis', costPerYear: 3_000, id: 'f3', name: 'praxis domains', nextRenewal: '2026-04-01', provider: 'IONOS', rebilledPerYear: 3_000, type: 'domain'},
        {assignedTo: 'erika', costPerYear: 1_500, id: 'f4', name: 'erika.de', nextRenewal: '2026-05-01', provider: 'IONOS', rebilledPerYear: 1_500, type: 'domain'},
    ],
    resources:        [
        {customerId: 'muster', id: 'r1', kind: 'domain', location: 'IONOS', name: 'muster.de'},
        {customerId: 'muster', id: 'r2', kind: 'container', location: 'chronos', name: 'muster-web'},
        {customerId: 'erika', id: 'r3', kind: 'proxy_host', location: 'chronos', name: 'erika.de'},
    ],
    settings:         {serverCostAllocation: 'equal_among_hosting_customers', taxPaymentMonth: 4},
    tasks:            [
        {customerId: 'erika', dueDate: '2026-02-01', id: 't1', note: null, status: 'open', title: 'Update WordPress'},
        {customerId: null, dueDate: null, id: 't2', note: null, status: 'waiting_for_go', title: 'Migrate server'},
        {customerId: null, dueDate: '2025-01-01', id: 't3', note: null, status: 'done', title: 'Old task'},
    ],
    taxAdjustments:   [{description: 'Depreciation', profitAdjustment: 1_000, year: 2025}],
    taxYears:         [{marginalRatePercent: 3_000, profitPerAssessment: null, year: 2025}],
    today:            '2025-12-01',
};

export default sampleInput;
