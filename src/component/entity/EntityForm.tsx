'use client';

import {type FormEvent, useState} from 'react';
import ApiClientError from '@/client/ApiClientError';
import FieldInput from '@/component/entity/FieldInput';
import FormField from '@/component/ui/FormField';
import Notice from '@/component/ui/Notice';
import type EntityName from '@/entity/EntityName';
import type FieldDefinition from '@/entity/FieldDefinition';
import fromFormValue from '@/entity/fromFormValue';
import humanize from '@/entity/humanize';
import toFormValue from '@/entity/toFormValue';
import useI18n from '@/i18n/useI18n';

/**
 * Generic form generated from field definitions. Hidden fields keep their value (e.g. the customer
 * when the form is opened on a customer page). Submit happens through the form id, so the button
 * can live in a dialog footer.
 */
export default function EntityForm({columns = 2, defaults = {}, entity, fields, formId, hidden = [], initial, onSubmit, sections}: {
    columns?: 2 | 3;
    defaults?: Record<string, unknown>;
    entity: EntityName | 'settings';
    fields: readonly FieldDefinition[];
    formId: string;
    hidden?: readonly string[];
    initial?: Record<string, unknown> | null;
    onSubmit: (data: Record<string, unknown>) => Promise<void>;
    /** Optional grouping of the fields into titled sections (rendered as cards in a grid). */
    sections?: { fields: readonly string[]; title: string }[];
}) {
    const {t, td} = useI18n();
    const editable = fields.filter((field) => field.readOnly !== true);
    const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(editable.map((field) => {
        const source = initial?.[field.name] !== undefined ? initial[field.name] : (defaults[field.name] !== undefined ? defaults[field.name] : field.default);
        return [field.name, toFormValue(field, source)];
    })));
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);

    const visible = (field: FieldDefinition) => !hidden.includes(field.name)
                                                 && (field.visibleWhen === undefined || field.visibleWhen.values.includes(values[field.visibleWhen.field]));

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        setErrors({});
        setError(null);
        const data: Record<string, unknown> = {};
        for (const field of editable) {
            if (field.visibleWhen !== undefined && !field.visibleWhen.values.includes(values[field.visibleWhen.field])) {
                data[field.name] = null;
                continue;
            }
            const value = fromFormValue(field, values[field.name] ?? '');
            if (value === null && field.required === true && initial === undefined) {
                continue;
            }
            data[field.name] = value;
        }
        try {
            await onSubmit(data);
        }
        catch (exception) {
            if (exception instanceof ApiClientError) {
                setErrors(exception.fieldErrors);
                setError(exception.message);
            }
            else {
                setError(t('common.error'));
            }
        }
    };

    const renderFields = (list: FieldDefinition[]) => (
        <div className={`grid gap-4 sm:grid-cols-2 ${columns === 3 ? 'xl:grid-cols-3' : ''}`}>
            {list.map((field) => {
                const id = `${formId}-${field.name}`;
                return (
                    <FormField
                        key={field.name}
                        htmlFor={id}
                        label={td(`field.${entity}.${field.name}`, humanize(field.name))}
                        required={field.required === true && field.type !== 'boolean'}
                        error={errors[field.name]}
                        hint={td(`hint.${entity}.${field.name}`, '') || undefined}
                        className={field.type === 'text' ? 'sm:col-span-full' : ''}
                    >
                        <FieldInput
                            entity={entity}
                            field={field}
                            id={id}
                            invalid={errors[field.name] !== undefined}
                            value={values[field.name] ?? ''}
                            onChange={(value) => setValues((current) => ({...current, [field.name]: value}))}
                        />
                    </FormField>
                );
            })}
        </div>
    );

    return (
        <form id={formId} onSubmit={submit} noValidate className="flex flex-col gap-4">
            {error !== null ? <Notice tone="error">{error}</Notice> : null}
            {sections === undefined ? renderFields(editable.filter(visible)) : (
                <div className="grid gap-6 xl:grid-cols-2">
                    {sections.map((section) => (
                        <fieldset key={section.title} className="animate-rise rounded-xl border border-line bg-surface p-4 shadow-card sm:p-5">
                            <legend className="sr-only">{section.title}</legend>
                            <h2 className="mb-4 text-xl font-semibold">{section.title}</h2>
                            {renderFields(editable.filter((field) => section.fields.includes(field.name)).filter(visible))}
                        </fieldset>
                    ))}
                </div>
            )}
        </form>
    );
}
