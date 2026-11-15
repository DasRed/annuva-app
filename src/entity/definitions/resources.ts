import type EntityDefinition from '@/entity/EntityDefinition';

const resources: EntityDefinition = {
    customerField: 'customerId',
    defaultSort:   {direction: 'asc', field: 'name'},
    fields:        [
        {list: true, name: 'customerId', relation: 'customers', required: true, type: 'relation'},
        {list: true, name: 'kind', options: ['domain', 'container', 'proxy_host', 'package', 'server', 'other'], required: true, type: 'enum'},
        {list: true, max: 255, name: 'name', required: true, type: 'string'},
        {list: true, max: 255, name: 'location', type: 'string'},
        {name: 'details', type: 'text'},
        {max: 255, name: 'externalRef', type: 'string'},
    ],
    name:          'resources',
    singular:      'resource',
    table:         'resources',
    titleField:    'name',
};

export default resources;
