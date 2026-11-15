import type EntityDefinition from '@/entity/EntityDefinition';

const partners: EntityDefinition = {
    defaultSort: {direction: 'asc', field: 'name'},
    fields:      [
        {list: true, max: 255, name: 'name', required: true, type: 'string'},
        {list: true, max: 255, name: 'email', type: 'email'},
        {name: 'billingAddress', type: 'text'},
        {name: 'notes', type: 'text'},
    ],
    name:        'partners',
    singular:    'partner',
    table:       'partners',
    titleField:  'name',
};

export default partners;
