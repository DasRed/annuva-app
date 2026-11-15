import {z} from 'zod';
import buildSchema from '@/entity/buildSchema';
import entities from '@/entity/entities';
import entityPath from '@/entity/entityPath';
import type EntityName from '@/entity/EntityName';
import type FieldDefinition from '@/entity/FieldDefinition';
import settingsFields from '@/entity/settingsFields';
import getAppVersion from '@/server/app/getAppVersion';
import getConfig from '@/server/config/getConfig';
import invoiceInputSchema from '@/server/invoice/invoiceInputSchema';

type Json = Record<string, unknown>;

function jsonSchema(schema: z.ZodType): Json {
    const result = z.toJSONSchema(schema, {io: 'input', unrepresentable: 'any'}) as Json;
    delete result.$schema;
    return result;
}

function recordSchema(fields: readonly FieldDefinition[]): Json {
    const types: Record<string, Json> = {
        boolean:  {type: 'boolean'},
        date:     {format: 'date', type: 'string'},
        datetime: {format: 'date-time', type: 'string'},
        color:    {pattern: '^#[0-9a-fA-F]{6}$', type: 'string'},
        email:    {format: 'email', type: 'string'},
        file:     {format: 'uuid', type: 'string'},
        integer:  {type: 'integer'},
        money:    {description: 'Decimal amount in the tenant currency', type: 'number'},
        percent:  {type: 'number'},
        relation: {format: 'uuid', type: 'string'},
        string:   {type: 'string'},
        text:     {type: 'string'},
        year:     {type: 'integer'},
    };
    const properties: Record<string, Json> = {
        createdAt: {format: 'date-time', type: 'string'},
        id:        {format: 'uuid', type: 'string'},
        updatedAt: {format: 'date-time', type: 'string'},
    };
    for (const field of fields) {
        const base = field.type === 'enum' ? {enum: field.options, type: 'string'} : types[field.type];
        properties[field.name] = field.required === true ? base : {...base, nullable: true};
    }
    return {properties, type: 'object'};
}

const ref = (name: string) => ({$ref: `#/components/schemas/${name}`});
const json = (schema: Json) => ({content: {'application/json': {schema}}});
const ok = (schema: Json, description = 'OK') => ({200: {description, ...json(schema)}});
const errors = {
    400: {description: 'Validation error', ...json(ref('Error'))},
    401: {description: 'Missing or invalid token', ...json(ref('Error'))},
    403: {description: 'Not allowed (role or token scope)', ...json(ref('Error'))},
    404: {description: 'Not found', ...json(ref('Error'))},
};
const idParam = {in: 'path', name: 'id', required: true, schema: {format: 'uuid', type: 'string'}};

/**
 * OpenAPI 3.1 document, generated from the entity definitions and the input schemas.
 */
export default function buildOpenApi(baseUrl: string): Json {
    const schemas: Record<string, Json> = {
        Error:    {properties: {error: {properties: {code: {type: 'string'}, details: {}, message: {type: 'string'}}, type: 'object'}}, type: 'object'},
        Settings: recordSchema(settingsFields),
    };
    const paths: Record<string, Json> = {};

    for (const name of Object.keys(entities) as EntityName[]) {
        const definition = entities[name];
        const schemaName = definition.singular.split('_').map((part) => part[0].toUpperCase() + part.slice(1)).join('');
        schemas[schemaName] = recordSchema(definition.fields);
        const tag = name;
        const path = `/api/v1/${entityPath(name)}`;
        const list = {
            items: {items: ref(schemaName), type: 'array'},
            limit: {type: 'integer'},
            offset: {type: 'integer'},
            total: {type: 'integer'},
        };
        paths[path] = {
            get: {
                parameters: [
                    {in: 'query', name: 'limit', schema: {maximum: 1000, type: 'integer'}},
                    {in: 'query', name: 'offset', schema: {type: 'integer'}},
                    {in: 'query', name: 'sort', schema: {type: 'string'}},
                    {in: 'query', name: 'order', schema: {enum: ['asc', 'desc'], type: 'string'}},
                    {in: 'query', name: 'q', schema: {type: 'string'}},
                    {in: 'query', name: 'customerId', schema: {format: 'uuid', type: 'string'}},
                    {description: 'Equality filter, e.g. filter[status]=open', in: 'query', name: 'filter[field]', schema: {type: 'string'}},
                ],
                responses:  {...ok({properties: list, type: 'object'}), ...errors},
                summary:    `List ${name}`,
                tags:       [tag],
            },
            ...(definition.customWrite === true ? {} : {
                post: {
                    requestBody: {required: true, ...json(jsonSchema(buildSchema(definition.fields, 'create')))},
                    responses:   {201: {description: 'Created', ...json(ref(schemaName))}, ...errors},
                    summary:     `Create ${definition.singular.replace(/_/g, ' ')}`,
                    tags:        [tag],
                },
            }),
        };
        paths[`${path}/{id}`] = {
            get: {parameters: [idParam], responses: {...ok(ref(schemaName)), ...errors}, summary: `Get ${definition.singular.replace(/_/g, ' ')}`, tags: [tag]},
            ...(definition.customWrite === true ? {} : {
                delete: {parameters: [idParam], responses: {204: {description: 'Deleted'}, ...errors}, summary: `Delete ${definition.singular.replace(/_/g, ' ')}`, tags: [tag]},
                patch:  {
                    parameters:  [idParam],
                    requestBody: {required: true, ...json(jsonSchema(buildSchema(definition.fields, 'update')))},
                    responses:   {...ok(ref(schemaName)), ...errors},
                    summary:     `Update ${definition.singular.replace(/_/g, ' ')}`,
                    tags:        [tag],
                },
            }),
        };
    }

    paths['/api/v1/invoices'] = {
        ...(paths['/api/v1/invoices'] as Json),
        post: {requestBody: {required: true, ...json(jsonSchema(invoiceInputSchema))}, responses: {201: {description: 'Draft created', ...json(ref('Invoice'))}, ...errors}, summary: 'Create draft invoice', tags: ['invoices']},
    };
    paths['/api/v1/invoices/{id}'] = {
        ...(paths['/api/v1/invoices/{id}'] as Json),
        delete: {parameters: [idParam], responses: {204: {description: 'Deleted'}, ...errors}, summary: 'Delete draft invoice', tags: ['invoices']},
        patch:  {parameters: [idParam], requestBody: {required: true, ...json(jsonSchema(invoiceInputSchema.partial()))}, responses: {...ok(ref('Invoice')), ...errors}, summary: 'Update draft invoice', tags: ['invoices']},
    };
    for (const [action, summary, body] of [
        ['issue', 'Issue invoice (number, PDF)', {properties: {date: {format: 'date', type: 'string'}}, type: 'object'}],
        ['pay', 'Mark as paid', {properties: {paidAt: {format: 'date', type: 'string'}}, type: 'object'}],
        ['reopen', 'Paid → open', {type: 'object'}],
        ['cancel', 'Cancel via cancellation invoice', {type: 'object'}],
        ['send', 'Send by e-mail', {properties: {message: {type: 'string'}, to: {format: 'email', type: 'string'}}, type: 'object'}],
        ['remind', 'Send payment reminder', {properties: {message: {type: 'string'}, to: {format: 'email', type: 'string'}}, type: 'object'}],
    ] as [string, string, Json][]) {
        paths[`/api/v1/invoices/{id}/${action}`] = {post: {parameters: [idParam], requestBody: json(body), responses: {...ok(ref('Invoice')), ...errors}, summary, tags: ['invoices']}};
    }
    paths['/api/v1/invoices/{id}/pdf'] = {get: {parameters: [idParam], responses: {200: {content: {'application/pdf': {}}, description: 'PDF'}, ...errors}, summary: 'Invoice PDF (draft preview or stored PDF)', tags: ['invoices']}};
    paths['/api/v1/customers/{id}/archive'] = {
        delete: {parameters: [idParam], responses: {...ok(ref('Customer')), ...errors}, summary: 'Restore archived customer', tags: ['customers']},
        post:   {parameters: [idParam], responses: {...ok(ref('Customer')), 409: {description: 'Customer still has recurring charges', ...json(ref('Error'))}}, summary: 'Archive customer', tags: ['customers']},
    };
    paths['/api/v1/billing/run'] = {
        post: {
            requestBody: json({properties: {dryRun: {type: 'boolean'}, until: {format: 'date', type: 'string'}}, type: 'object'}),
            responses:   {...ok({type: 'object'}), ...errors},
            summary:     'Recurring billing run (draft invoices from due recurring charges)',
            tags:        ['billing'],
        },
    };
    paths['/api/v1/dashboard'] = {
        get: {
            parameters: [{in: 'query', name: 'year', schema: {type: 'integer'}}, {in: 'query', name: 'customer', schema: {format: 'uuid', type: 'string'}}],
            responses:  {...ok({description: 'KPIs, years, cash flow, customer ratings, costs, tax, upcoming, tasks, resources (amounts in cents)', type: 'object'}), ...errors},
            summary:    'Dashboard data',
            tags:       ['dashboard'],
        },
    };
    paths['/api/v1/settings'] = {
        get:   {responses: {...ok(ref('Settings')), ...errors}, summary: 'Business settings', tags: ['settings']},
        patch: {requestBody: json(jsonSchema(buildSchema(settingsFields, 'update'))), responses: {...ok(ref('Settings')), ...errors}, summary: 'Update settings (admin)', tags: ['settings']},
    };
    paths['/api/v1/invoice-templates/preview'] = {
        post: {
            requestBody: json(jsonSchema(buildSchema(entities.invoiceTemplates.fields, 'update'))),
            responses:   {200: {content: {'application/pdf': {}}, description: 'Sample invoice as PDF'}, ...errors},
            summary:     'Preview an invoice template – also unsaved values – as a sample invoice (admin)',
            tags:        ['invoice-templates'],
        },
    };
    paths['/api/v1/files'] = {
        post: {
            requestBody: {content: {'multipart/form-data': {schema: {properties: {file: {format: 'binary', type: 'string'}}, type: 'object'}}}},
            responses:   {201: {description: 'Stored file', ...json({type: 'object'})}, ...errors},
            summary:     'Upload a file',
            tags:        ['files'],
        },
    };
    paths['/api/v1/files/{id}'] = {get: {parameters: [idParam], responses: {200: {description: 'File content'}, ...errors}, summary: 'Download a file', tags: ['files']}};
    paths['/api/v1/users'] = {get: {responses: {...ok({type: 'object'}), ...errors}, summary: 'List users (admin)', tags: ['users']}, post: {responses: {201: {description: 'Created'}, ...errors}, summary: 'Create user (admin)', tags: ['users']}};
    paths['/api/v1/users/{id}'] = {delete: {parameters: [idParam], responses: {204: {description: 'Deleted'}, ...errors}, summary: 'Delete user (admin)', tags: ['users']}, patch: {parameters: [idParam], responses: {...ok({type: 'object'}), ...errors}, summary: 'Update user (admin)', tags: ['users']}};
    paths['/api/v1/profile'] = {get: {responses: {...ok({type: 'object'}), ...errors}, summary: 'Own profile', tags: ['profile']}, patch: {responses: {...ok({type: 'object'}), ...errors}, summary: 'Update own profile', tags: ['profile']}};
    paths['/api/v1/profile/two-factor'] = {get: {responses: {...ok({properties: {enabled: {type: 'boolean'}, recoveryCodesLeft: {type: 'integer'}}, type: 'object'}), ...errors}, summary: 'Two-factor status of the own account', tags: ['profile']}};
    paths['/api/v1/users/{id}/two-factor'] = {delete: {parameters: [idParam], responses: {204: {description: 'Two-factor authentication switched off'}, ...errors}, summary: 'Reset two-factor authentication of a user (admin)', tags: ['users']}};
    paths['/api/v1/tokens'] = {get: {responses: {...ok({type: 'object'}), ...errors}, summary: 'Own API tokens', tags: ['profile']}, post: {responses: {201: {description: 'Token (shown once)'}, ...errors}, summary: 'Create API token', tags: ['profile']}};
    paths['/api/health'] = {get: {responses: {200: {description: 'Healthy'}, 503: {description: 'Database unavailable'}}, security: [], summary: 'Health check', tags: ['system']}};
    paths['/api/mcp'] = {post: {responses: {200: {description: 'MCP response'}}, summary: 'MCP server (Streamable HTTP, JSON-RPC)', tags: ['system']}};

    return {
        components: {
            schemas,
            securitySchemes: {bearer: {description: 'Personal API token (Profile → API tokens)', scheme: 'bearer', type: 'http'}},
        },
        info:       {
            description: `REST API of ${getConfig().appName}. Authenticate with a personal API token: "Authorization: Bearer an_…". Tokens with scope "read" can only read.`,
            license:     {identifier: 'AGPL-3.0-only', name: 'AGPL-3.0'},
            title:       `${getConfig().appName} API`,
            version:     getAppVersion(),
        },
        openapi:    '3.1.0',
        paths,
        security:   [{bearer: []}],
        servers:    [{url: baseUrl}],
    };
}
