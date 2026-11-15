import type FieldDefinition from '@/entity/FieldDefinition';

export default function toFormValue(field: FieldDefinition, value: unknown): string {
    if (field.type === 'boolean') {
        return value === true ? 'true' : 'false';
    }
    if (value === null || value === undefined) {
        return '';
    }
    return String(value);
}
