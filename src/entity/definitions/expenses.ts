import type EntityDefinition from '@/entity/EntityDefinition';

const expenses: EntityDefinition = {
    customerField: 'assignedTo',
    defaultSort:   {direction: 'desc', field: 'date'},
    fields:        [
        {list: true, name: 'date', required: true, type: 'date'},
        {list: true, max: 255, name: 'vendor', required: true, type: 'string'},
        {list: true, max: 255, name: 'item', required: true, type: 'string'},
        {
            list:     true,
            name:     'category',
            options:  ['server', 'domain', 'package', 'license', 'hardware', 'software', 'service', 'travel', 'office', 'other'],
            required: true,
            type:     'enum',
        },
        {list: true, name: 'assignedTo', relation: 'customers', required: true, type: 'relation'},
        {list: true, name: 'grossAmount', required: true, type: 'money'},
        {name: 'originalAmount', type: 'money'},
        {max: 3, name: 'originalCurrency', type: 'string'},
        {default: 'receipt', list: true, name: 'status', options: ['receipt', 'expected', 'planned'], required: true, type: 'enum'},
        {name: 'receiptFileId', type: 'file'},
    ],
    name:          'expenses',
    singular:      'expense',
    table:         'expenses',
    titleField:    'item',
};

export default expenses;
