import {z} from 'zod';
import countryCodes from '@/address/countryCodes';
import type FieldDefinition from '@/entity/FieldDefinition';

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

function fieldSchema(field: FieldDefinition): z.ZodType {
    switch (field.type) {
        case 'boolean':
            return z.boolean();
        case 'color':
            return z.string().regex(/^#[\da-f]{6}$/i, 'Expected a colour like #0f6b5c');
        case 'country':
            return z.enum(countryCodes);
        case 'date':
            return z.string().regex(isoDate, 'Expected a date in the format YYYY-MM-DD');
        case 'datetime':
            return z.iso.datetime();
        case 'email':
            return z.email().max(field.max ?? 255);
        case 'enum':
            return z.enum(field.options as [string, ...string[]]);
        case 'file':
        case 'relation':
            return z.uuid();
        case 'integer': {
            let schema = z.number().int();
            if (field.min !== undefined) {
                schema = schema.min(field.min);
            }
            if (field.max !== undefined) {
                schema = schema.max(field.max);
            }
            return schema;
        }
        case 'month':
            return z.number().int().min(1).max(12);
        case 'money':
            return z.number().multipleOf(0.01).min(-100_000_000).max(100_000_000);
        case 'percent':
            return z.number().multipleOf(0.01).min(0).max(100);
        case 'year':
            return z.number().int().min(1900).max(2999);
        case 'string':
            return z.string().trim().max(field.max ?? 255);
        case 'text':
            return z.string().max(65_535);
    }
}

/**
 * Builds the validation schema for writes. On create, required fields without default must be
 * present; on update every field is optional. Optional fields accept null to clear a value.
 */
export default function buildSchema(fields: readonly FieldDefinition[], mode: 'create' | 'update'): z.ZodObject {
    const shape: Record<string, z.ZodType> = {};
    for (const field of fields) {
        if (field.readOnly === true) {
            continue;
        }
        let schema = fieldSchema(field);
        if (field.type === 'string' && field.required === true) {
            schema = (schema as z.ZodString).min(1);
        }
        if (field.required !== true) {
            schema = schema.nullable();
        }
        if (mode === 'update' || field.required !== true || field.default !== undefined) {
            schema = schema.optional();
        }
        shape[field.name] = schema.describe(field.name);
    }
    return z.object(shape).strict();
}
