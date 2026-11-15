import type EntityDefinition from '@/entity/EntityDefinition';

const recurringCharges: EntityDefinition = {
    customerField: 'customerId',
    defaultSort:   {direction: 'asc', field: 'nextInvoiceDate'},
    fields:        [
        {list: true, name: 'customerId', relation: 'customers', required: true, type: 'relation'},
        {list: true, name: 'service', options: ['hosting', 'domain', 'package', 'maintenance', 'other'], required: true, type: 'enum'},
        {list: true, max: 255, name: 'description', type: 'string'},
        {list: true, name: 'amountPerYear', required: true, type: 'money'},
        {default: 'yearly', list: true, name: 'interval', options: ['yearly', 'quarterly', 'monthly'], required: true, type: 'enum'},
        {list: true, name: 'nextInvoiceDate', required: true, type: 'date'},
        {default: false, name: 'startsAfterSetup', type: 'boolean'},
    ],
    name:          'recurringCharges',
    singular:      'recurring_charge',
    table:         'recurringCharges',
    titleField:    'description',
};

export default recurringCharges;
