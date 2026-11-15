'use client';

import {IconPlus, IconTrash} from '@tabler/icons-react';
import FieldInput from '@/component/entity/FieldInput';
import Button from '@/component/ui/Button';
import EmptyState from '@/component/ui/EmptyState';
import FormField from '@/component/ui/FormField';
import entities from '@/entity/entities';
import type EntityName from '@/entity/EntityName';
import humanize from '@/entity/humanize';
import useI18n from '@/i18n/useI18n';

/**
 * Editable list of records of one entity (as form strings), e.g. the recurring charges inside the
 * customer wizard. Saving happens elsewhere.
 */
export default function RowListEditor({addLabel, entity, errors = {}, fieldNames, newRow, onChange, rows}: {
    addLabel: string;
    entity: EntityName;
    errors?: Record<number, Record<string, string>>;
    fieldNames: string[];
    newRow: () => Record<string, string>;
    onChange: (rows: Record<string, string>[]) => void;
    rows: Record<string, string>[];
}) {
    const {t, td} = useI18n();
    const fields = fieldNames.map((name) => entities[entity].fields.find((field) => field.name === name)!).filter(Boolean);

    return (
        <div className="flex flex-col gap-3">
            {rows.length === 0 ? <EmptyState>{t('wizard.noRows')}</EmptyState> : null}
            {rows.map((row, index) => (
                <div key={index} className="animate-pop grid gap-3 rounded-lg border border-line bg-surface-2/40 p-3 sm:grid-cols-2 xl:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))_auto] xl:items-end">
                    {fields.map((field) => (
                        <FormField
                            key={field.name}
                            htmlFor={`${entity}-${index}-${field.name}`}
                            label={td(`field.${entity}.${field.name}`, humanize(field.name))}
                            required={field.required === true && field.type !== 'boolean'}
                            error={errors[index]?.[field.name]}
                        >
                            <FieldInput
                                entity={entity}
                                field={field}
                                id={`${entity}-${index}-${field.name}`}
                                value={row[field.name] ?? ''}
                                invalid={errors[index]?.[field.name] !== undefined}
                                onChange={(value) => onChange(rows.map((candidate, position) => (position === index ? {...candidate, [field.name]: value} : candidate)))}
                            />
                        </FormField>
                    ))}
                    <Button variant="ghost" size="sm" icon={<IconTrash size={16} stroke={1.75}/>} onClick={() => onChange(rows.filter((_, position) => position !== index))}>
                        {t('common.remove')}
                    </Button>
                </div>
            ))}
            <div>
                <Button size="sm" icon={<IconPlus size={16} stroke={1.75}/>} onClick={() => onChange([...rows, newRow()])}>{addLabel}</Button>
            </div>
        </div>
    );
}
