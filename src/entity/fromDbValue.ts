import type FieldDefinition from '@/entity/FieldDefinition';

/**
 * Converts a stored value into its API representation: money and percent as decimals, booleans as
 * real booleans.
 */
export default function fromDbValue(field: FieldDefinition, value: unknown): unknown {
    if (value === null || value === undefined) {
        return field.type === 'boolean' ? false : null;
    }
    switch (field.type) {
        case 'boolean':
            return value === 1 || value === true || value === '1';
        case 'money':
        case 'percent':
            return Number(value) / 100;
        case 'integer':
        case 'month':
        case 'year':
            return Number(value);
        default:
            return value;
    }
}
