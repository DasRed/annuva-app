import type EntityDefinition from '@/entity/EntityDefinition';

const offers: EntityDefinition = {
    customerField: 'customerId',
    defaultSort:   {direction: 'desc', field: 'date'},
    fields:        [
        {list: true, name: 'customerId', relation: 'customers', required: true, type: 'relation'},
        {list: true, max: 64, name: 'number', required: true, type: 'string'},
        {list: true, name: 'date', required: true, type: 'date'},
        {list: true, name: 'validUntil', type: 'date'},
        {list: true, name: 'amount', required: true, type: 'money'},
        {default: 'open', list: true, name: 'status', options: ['open', 'accepted', 'rejected'], required: true, type: 'enum'},
        {name: 'description', type: 'text'},
        {name: 'fileId', type: 'file'},
    ],
    name:          'offers',
    singular:      'offer',
    table:         'offers',
    titleField:    'number',
};

export default offers;
