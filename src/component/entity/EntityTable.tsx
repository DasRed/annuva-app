'use client';

import {IconArrowDown, IconArrowUp, IconPencil} from '@tabler/icons-react';
import FieldValue from '@/component/entity/FieldValue';
import entities from '@/entity/entities';
import type EntityName from '@/entity/EntityName';
import type EntityRecord from '@/entity/EntityRecord';
import humanize from '@/entity/humanize';
import useI18n from '@/i18n/useI18n';

const numeric = ['money', 'percent', 'integer', 'year'];

/**
 * List of records: a sortable table from the md breakpoint, compact cards on phones.
 */
export default function EntityTable({entity, hidden = [], items, onOpen, onSort, order, sort}: {
    entity: EntityName;
    hidden?: readonly string[];
    items: EntityRecord[];
    onOpen: (record: EntityRecord) => void;
    onSort: (field: string) => void;
    order: 'asc' | 'desc';
    sort: string;
}) {
    const {t, td} = useI18n();
    const definition = entities[entity];
    const columns = definition.fields.filter((field) => field.list === true && !hidden.includes(field.name));
    const label = (name: string) => td(`field.${entity}.${name}`, humanize(name));

    return (
        <>
            <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-line text-left text-xs tracking-wide text-text-muted uppercase">
                            {columns.map((field) => (
                                <th key={field.name} className={`px-3 py-2 font-semibold ${numeric.includes(field.type) ? 'text-right' : ''}`}>
                                    <button type="button" onClick={() => onSort(field.name)} className="inline-flex items-center gap-1 uppercase hover:text-text">
                                        {label(field.name)}
                                        {sort === field.name ? (order === 'asc' ? <IconArrowUp size={14}/> : <IconArrowDown size={14}/>) : null}
                                    </button>
                                </th>
                            ))}
                            <th className="w-10"><span className="sr-only">{t('common.edit')}</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr
                                key={item.id}
                                onClick={() => onOpen(item)}
                                style={{animationDelay: `${Math.min(index, 12) * 25}ms`}}
                                className={`animate-fade cursor-pointer border-b border-line/70 transition hover:bg-surface-2/60 ${item.archivedAt ? 'opacity-60' : ''}`}
                            >
                                {columns.map((field) => (
                                    <td key={field.name} className={`px-3 py-2.5 ${numeric.includes(field.type) ? 'text-right tabular' : ''}`}>
                                        <FieldValue entity={entity} field={field} value={item[field.name]}/>
                                    </td>
                                ))}
                                <td className="px-2 text-text-muted"><IconPencil size={16} stroke={1.75}/></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <ul className="flex flex-col gap-2 md:hidden">
                {items.map((item) => (
                    <li key={item.id}>
                        <button type="button" onClick={() => onOpen(item)} className="animate-fade w-full rounded-lg border border-line bg-surface p-3 text-left transition active:scale-[0.99]">
                            <div className="mb-1 font-semibold">
                                <FieldValue entity={entity} field={columns[0]} value={item[columns[0].name]}/>
                            </div>
                            <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                                {columns.slice(1).map((field) => (
                                    <div key={field.name} className="min-w-0">
                                        <dt className="text-xs text-text-muted">{label(field.name)}</dt>
                                        <dd className="truncate"><FieldValue entity={entity} field={field} value={item[field.name]}/></dd>
                                    </div>
                                ))}
                            </dl>
                        </button>
                    </li>
                ))}
            </ul>
        </>
    );
}
