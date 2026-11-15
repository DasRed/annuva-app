import type FieldDefinition from '@/entity/FieldDefinition';

/**
 * Converts an API value into its storage representation: money and percent as integer hundredths,
 * booleans as 0/1.
 */
export default function toDbValue(field: FieldDefinition, value: unknown): unknown {
    if (value === null || value === undefined) {
        return null;
    }
    switch (field.type) {
        case 'boolean':
            return value === true ? 1 : 0;
        case 'money':
        case 'percent':
            return Math.round(Number(value) * 100);
        case 'string':
        case 'text':
            return typeof value === 'string' && value.trim() === '' && field.required !== true ? null : value;
        default:
            return value;
    }
}
