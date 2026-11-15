import type EntityDefinition from '@/entity/EntityDefinition';

const recurringCosts: EntityDefinition = {
    customerField: 'assignedTo',
    defaultSort:   {direction: 'asc', field: 'name'},
    fields:        [
        {list: true, max: 255, name: 'name', required: true, type: 'string'},
        {list: true, name: 'type', options: ['domain', 'package', 'server', 'other'], required: true, type: 'enum'},
        {list: true, max: 255, name: 'provider', required: true, type: 'string'},
        {list: true, name: 'assignedTo', relation: 'customers', required: true, type: 'relation'},
        {list: true, name: 'costPerYear', required: true, type: 'money'},
        {default: 0, list: true, name: 'rebilledPerYear', required: true, type: 'money'},
        {list: true, name: 'nextRenewal', type: 'date'},
        {default: true, name: 'autoRenew', type: 'boolean'},
        {name: 'endsAt', type: 'date'},
    ],
    name:          'recurringCosts',
    singular:      'recurring_cost',
    table:         'recurringCosts',
    titleField:    'name',
};

export default recurringCosts;
