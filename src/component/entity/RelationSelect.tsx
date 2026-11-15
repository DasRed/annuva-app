'use client';

import inputClass from '@/component/ui/inputClass';
import useLookup from '@/client/useLookup';
import type EntityName from '@/entity/EntityName';
import useI18n from '@/i18n/useI18n';

export default function RelationSelect({disabled, id, invalid, onChange, relation, required, value}: {
    disabled?: boolean;
    id: string;
    invalid?: boolean;
    onChange: (value: string) => void;
    relation: EntityName;
    required?: boolean;
    value: string;
}) {
    const {t} = useI18n();
    const options = useLookup(relation);
    return (
        <select id={id} className={inputClass} value={value} disabled={disabled || options === null} aria-invalid={invalid} onChange={(event) => onChange(event.target.value)}>
            <option value="">{options === null ? t('common.loading') : (required ? t('common.pleaseSelect') : '—')}</option>
            {(options ?? []).map((option) => <option key={option.id} value={option.id}>{option.title}</option>)}
        </select>
    );
}
