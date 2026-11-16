import type EntityDefinition from '@/entity/EntityDefinition';

const partners: EntityDefinition = {
    defaultSort: {direction: 'asc', field: 'name'},
    fields:      [
        {list: true, max: 255, name: 'name', required: true, type: 'string'},
        {list: true, max: 255, name: 'email', type: 'email'},
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
    ],
    name:        'partners',
    singular:    'partner',
    table:       'partners',
    titleField:  'name',
};

export default partners;
