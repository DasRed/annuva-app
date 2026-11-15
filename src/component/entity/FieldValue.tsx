'use client';

import {IconPaperclip} from '@tabler/icons-react';
import Link from 'next/link';
import useLookup from '@/client/useLookup';
import type EntityName from '@/entity/EntityName';
import type FieldDefinition from '@/entity/FieldDefinition';
import useI18n from '@/i18n/useI18n';

/**
 * Read-only display of a field value, formatted for the user's locale.
 */
export default function FieldValue({entity, field, value}: { entity: EntityName; field: FieldDefinition; value: unknown }) {
    const {date, money, month, number, td} = useI18n();
    const lookup = useLookup(field.type === 'relation' ? field.relation : undefined);

    if (value === null || value === undefined || value === '') {
        return <span className="text-text-muted">–</span>;
    }
    switch (field.type) {
        case 'boolean':
            return <>{value === true ? td('common.yes') : td('common.no')}</>;
        case 'color':
            return (
                <span className="inline-flex items-center gap-2">
                    <span className="size-4 rounded border border-line" style={{backgroundColor: String(value)}}/>
                    <code className="text-xs">{String(value)}</code>
                </span>
            );
        case 'date':
            return <span className="tabular">{date(String(value))}</span>;
        case 'datetime':
            return <span className="tabular">{date(String(value), true)}</span>;
        case 'enum':
            return <>{td(`enum.${entity}.${field.name}.${String(value)}`, String(value))}</>;
        case 'file':
            return (
                <a href={`/api/v1/files/${String(value)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-accent hover:underline" onClick={(event) => event.stopPropagation()}>
                    <IconPaperclip size={16} stroke={1.75}/>{td('common.openFile')}
                </a>
            );
        case 'month':
            return <>{month(Number(value))}</>;
        case 'money':
            return <span className="tabular">{money(Math.round(Number(value) * 100))}</span>;
        case 'percent':
            return <span className="tabular">{number(Number(value))} %</span>;
        case 'relation': {
            const title = lookup?.find((option) => option.id === value)?.title ?? '…';
            if (field.relation === 'customers') {
                return <Link href={`/customers/${String(value)}`} className="text-accent hover:underline" onClick={(event) => event.stopPropagation()}>{title}</Link>;
            }
            return <>{title}</>;
        }
        case 'year':
        case 'integer':
            return <span className="tabular">{String(value)}</span>;
        default:
            return <>{String(value)}</>;
    }
}
