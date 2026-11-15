import entities from '@/entity/entities';

const PREVIEW_FIELDS = entities.invoiceTemplates.fields.map((field) => field.name).filter((name) => name !== 'name' && name !== 'isDefault');

/**
 * The template values that influence the printed invoice – the input for the preview.
 */
export default function templatePreviewValues(record: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(PREVIEW_FIELDS.map((name) => [name, record[name] ?? null]));
}
