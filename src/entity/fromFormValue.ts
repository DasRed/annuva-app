import type FieldDefinition from '@/entity/FieldDefinition';

/**
 * Converts a form string into the API value. Empty optional fields become null.
 */
export default function fromFormValue(field: FieldDefinition, value: string): unknown {
    switch (field.type) {
        case 'boolean':
            return value === 'true';
        case 'integer':
        case 'money':
        case 'month':
        case 'percent':
        case 'year':
            return value.trim() === '' ? null : Number(value.replace(',', '.'));
        default:
            return value.trim() === '' ? null : value;
    }
}
