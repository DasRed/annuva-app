import type EntityDefinition from '@/entity/EntityDefinition';

const invoices: EntityDefinition = {
    customerField: 'customerId',
    customWrite:   true,
    defaultSort:   {direction: 'desc', field: 'createdAt'},
    fields:        [
        {list: true, name: 'number', readOnly: true, type: 'string'},
        {list: true, name: 'customerId', relation: 'customers', required: true, type: 'relation'},
        {default: 'customer', name: 'recipientType', options: ['customer', 'partner'], required: true, type: 'enum'},
        {name: 'partnerId', relation: 'partners', type: 'relation'},
        {name: 'templateId', relation: 'invoiceTemplates', type: 'relation'},
        {list: true, name: 'date', readOnly: true, type: 'date'},
        {list: true, name: 'dueDate', type: 'date'},
        {name: 'serviceDateFrom', type: 'date'},
        {name: 'serviceDateTo', type: 'date'},
        {list: true, max: 255, name: 'description', required: true, type: 'string'},
        {default: 'to_issue', list: true, name: 'status', options: ['to_issue', 'open', 'paid', 'cancelled'], readOnly: true, type: 'enum'},
        {name: 'netAmount', readOnly: true, type: 'money'},
        {name: 'taxAmount', readOnly: true, type: 'money'},
        {list: true, name: 'grossAmount', readOnly: true, type: 'money'},
        {name: 'paidAt', readOnly: true, type: 'date'},
        {default: 'de', name: 'language', options: ['de', 'en'], required: true, type: 'enum'},
        {name: 'notes', type: 'text'},
        {name: 'reminderLevel', readOnly: true, type: 'integer'},
        {name: 'cancelsInvoiceId', readOnly: true, relation: 'invoices', type: 'relation'},
        {name: 'fileId', readOnly: true, type: 'file'},
    ],
    name:          'invoices',
    singular:      'invoice',
    table:         'invoices',
    titleField:    'description',
};

export default invoices;
