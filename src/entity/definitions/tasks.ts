import type EntityDefinition from '@/entity/EntityDefinition';

const tasks: EntityDefinition = {
    customerField: 'customerId',
    defaultSort:   {direction: 'asc', field: 'dueDate'},
    fields:        [
        {list: true, max: 255, name: 'title', required: true, type: 'string'},
        {list: true, name: 'dueDate', type: 'date'},
        {list: true, name: 'customerId', relation: 'customers', type: 'relation'},
        {default: 'open', list: true, name: 'status', options: ['open', 'waiting_for_go', 'done'], required: true, type: 'enum'},
        {name: 'note', type: 'text'},
    ],
    name:          'tasks',
    singular:      'task',
    table:         'tasks',
    titleField:    'title',
};

export default tasks;
