'use client';

import countryCodes from '@/address/countryCodes';
import countryName from '@/address/countryName';
import FileField from '@/component/entity/FileField';
import RelationSelect from '@/component/entity/RelationSelect';
import inputClass from '@/component/ui/inputClass';
import type EntityName from '@/entity/EntityName';
import type FieldDefinition from '@/entity/FieldDefinition';
import useI18n from '@/i18n/useI18n';

/**
 * Input control for one entity field. Values are kept as strings (booleans as "true"/"false") and
 * converted on submit.
 */
export default function FieldInput({entity, field, id, invalid, onChange, value}: {
    entity: EntityName | 'settings';
    field: FieldDefinition;
    id: string;
    invalid?: boolean;
    onChange: (value: string) => void;
    value: string;
}) {
    const {currency, locale, month, td} = useI18n();
    const placeholder = td(`placeholder.${entity}.${field.name}`, '') || undefined;
    const common = {'aria-invalid': invalid, className: inputClass, id, onChange: (event: { target: { value: string } }) => onChange(event.target.value), placeholder, value};

    switch (field.type) {
        case 'boolean':
            return (
                <label className="inline-flex cursor-pointer items-center gap-3 py-1.5">
                    <input
                        id={id}
                        type="checkbox"
                        className="peer sr-only"
                        checked={value === 'true'}
                        onChange={(event) => onChange(event.target.checked ? 'true' : 'false')}
                    />
                    <span className="relative h-6 w-11 rounded-full bg-line transition peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent/40 after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5"/>
                    <span className="text-sm text-text-soft">{value === 'true' ? td('common.yes') : td('common.no')}</span>
                </label>
            );
        case 'color':
            return (
                <div className="flex items-center gap-2">
                    <input
                        type="color"
                        aria-label={td(`field.${entity}.${field.name}`, field.name)}
                        className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-line bg-surface p-1"
                        value={/^#[\da-f]{6}$/i.test(value) ? value : '#000000'}
                        onChange={(event) => onChange(event.target.value)}
                    />
                    <input type="text" maxLength={7} spellCheck={false} {...common} className={`${inputClass} font-mono`}/>
                </div>
            );
        case 'country':
            return (
                <select {...common}>
                    {field.required !== true ? <option value="">—</option> : null}
                    {countryCodes.map((code) => ({code, name: countryName(code, locale)}))
                                 .toSorted((first, second) => first.name.localeCompare(second.name, locale))
                                 .map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}
                </select>
            );
        case 'date':
            return <input type="date" {...common}/>;
        case 'email':
            return <input type="email" autoComplete="off" {...common}/>;
        case 'enum':
            return (
                <select {...common}>
                    {field.required !== true ? <option value="">—</option> : null}
                    {(field.options ?? []).map((option) => <option key={option} value={option}>{td(`enum.${entity}.${field.name}.${option}`, option)}</option>)}
                </select>
            );
        case 'file':
            return <FileField id={id} value={value} onChange={onChange} accept={field.accept}/>;
        case 'integer':
        case 'year':
            return <input type="number" inputMode="numeric" step={1} min={field.min} max={field.type === 'integer' ? field.max : undefined} {...common}/>;
        case 'month':
            return (
                <select {...common}>
                    {field.required !== true ? <option value="">—</option> : null}
                    {Array.from({length: 12}, (_, index) => index + 1).map((number) => <option key={number} value={String(number)}>{month(number)}</option>)}
                </select>
            );
        case 'money':
            return (
                <div className="relative">
                    <input type="number" inputMode="decimal" step="0.01" {...common} className={`${inputClass} pr-12 text-right tabular`}/>
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-text-muted">{currency}</span>
                </div>
            );
        case 'percent':
            return (
                <div className="relative">
                    <input type="number" inputMode="decimal" step="0.01" min={0} max={100} {...common} className={`${inputClass} pr-8 text-right tabular`}/>
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-text-muted">%</span>
                </div>
            );
        case 'relation':
            return <RelationSelect id={id} relation={field.relation!} value={value} onChange={onChange} invalid={invalid} required={field.required}/>;
        case 'text':
            return <textarea rows={3} {...common}/>;
        case 'datetime':
            return <input type="text" disabled {...common}/>;
        default:
            return <input type="text" maxLength={field.max} {...common}/>;
    }
}
