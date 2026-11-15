import type EntityDefinition from '@/entity/EntityDefinition';

const taxAdjustments: EntityDefinition = {
    defaultSort: {direction: 'desc', field: 'year'},
    fields:      [
        {list: true, name: 'year', required: true, type: 'year'},
        {list: true, max: 255, name: 'description', required: true, type: 'string'},
        {list: true, name: 'profitAdjustment', required: true, type: 'money'},
    ],
    name:        'taxAdjustments',
    singular:    'tax_adjustment',
    table:       'taxAdjustments',
    titleField:  'description',
};

export default taxAdjustments;
