import type EntityDefinition from '@/entity/EntityDefinition';

const customers: EntityDefinition = {
    customerField: 'id',
    defaultSort:   {direction: 'asc', field: 'name'},
    fields:        [
        {list: true, max: 255, name: 'name', required: true, type: 'string'},
        {default: 'direct', list: true, name: 'channel', options: ['direct', 'partner', 'own_project', 'internal'], required: true, type: 'enum'},
        {name: 'partnerId', relation: 'partners', type: 'relation', visibleWhen: {field: 'channel', values: ['partner']}},
        {default: 'active', list: true, name: 'status', options: ['active', 'paused', 'inactive', 'in_preparation'], required: true, type: 'enum'},
        {default: 'de', name: 'language', options: ['de', 'en'], required: true, type: 'enum'},
        {max: 255, name: 'contactName', type: 'string'},
        {list: true, max: 255, name: 'email', type: 'email'},
        {max: 64, name: 'phone', type: 'string'},
        {name: 'hourlyRate', type: 'money'},
        {max: 255, name: 'hostingSummary', type: 'string'},
        {name: 'notes', type: 'text'},
        {group: 'billing', max: 255, name: 'billingName', type: 'string'},
        {group: 'billing', max: 255, name: 'billingContactName', type: 'string'},
        {group: 'billing', max: 255, name: 'billingStreet', type: 'string'},
        {group: 'billing', max: 32, name: 'billingHouseNumber', type: 'string'},
        {group: 'billing', max: 16, name: 'billingPostalCode', type: 'string'},
        {group: 'billing', max: 255, name: 'billingCity', type: 'string'},
        {group: 'billing', max: 255, name: 'billingAddressAddition', type: 'string'},
        {default: 'DE', group: 'billing', name: 'billingCountry', type: 'country'},
        {group: 'billing', max: 255, name: 'billingEmail', type: 'email'},
        {group: 'billing', max: 64, name: 'vatId', type: 'string'},
        {name: 'archivedAt', readOnly: true, type: 'datetime'},
    ],
    name:          'customers',
    singular:      'customer',
    table:         'customers',
    titleField:    'name',
};

export default customers;
