'use client';

import {IconPlus, IconSearch, IconTrash} from '@tabler/icons-react';
import {type ReactNode, useCallback, useEffect, useState} from 'react';
import apiFetch from '@/client/apiFetch';
import ApiClientError from '@/client/ApiClientError';
import loadLookup from '@/client/loadLookup';
import EntityForm from '@/component/entity/EntityForm';
import EntityTable from '@/component/entity/EntityTable';
import Button from '@/component/ui/Button';
import ConfirmButton from '@/component/ui/ConfirmButton';
import Dialog from '@/component/ui/Dialog';
import EmptyState from '@/component/ui/EmptyState';
import inputClass from '@/component/ui/inputClass';
import Notice from '@/component/ui/Notice';
import Skeleton from '@/component/ui/Skeleton';
import entities from '@/entity/entities';
import entityPath from '@/entity/entityPath';
import type EntityName from '@/entity/EntityName';
import type EntityRecord from '@/entity/EntityRecord';
import type ListResult from '@/entity/ListResult';
import useI18n from '@/i18n/useI18n';

const PAGE_SIZE = 50;

/**
 * Complete list/create/edit/delete UI for one entity, driven by its definition. Used on the entity
 * pages and – filtered to one customer – on the customer detail page.
 */
export default function EntityManager({customerId, entity, extraActions, onChanged, onCreate, onOpen, readOnly = false}: {
    customerId?: string;
    entity: EntityName;
    extraActions?: ReactNode;
    onChanged?: () => void;
    /** Replaces the create dialog, e.g. by a wizard. */
    onCreate?: () => void;
    /** Replaces the edit dialog, e.g. by navigating to a detail page. */
    onOpen?: (record: EntityRecord) => void;
    readOnly?: boolean;
}) {
    const {t, td} = useI18n();
    const definition = entities[entity];
    const [result, setResult] = useState<ListResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const [sort, setSort] = useState(definition.defaultSort.field);
    const [order, setOrder] = useState<'asc' | 'desc'>(definition.defaultSort.direction);
    const [offset, setOffset] = useState(0);
    const [includeArchived, setIncludeArchived] = useState(false);
    const [editing, setEditing] = useState<EntityRecord | 'new' | null>(null);
    const [saving, setSaving] = useState(false);

    const customerField = customerId === undefined ? undefined : definition.customerField;
    const hidden = customerField === undefined || customerField === 'id' ? [] : [customerField];

    const load = useCallback(async () => {
        const params = new URLSearchParams({limit: String(PAGE_SIZE), offset: String(offset), order, sort});
        if (query.trim() !== '') {
            params.set('q', query.trim());
        }
        if (customerId !== undefined) {
            params.set('customerId', customerId);
        }
        if (includeArchived) {
            params.set('includeArchived', 'true');
        }
        try {
            setResult(await apiFetch<ListResult>(`/api/v1/${entityPath(entity)}?${params.toString()}`));
            setError(null);
        }
        catch (exception) {
            setError(exception instanceof ApiClientError ? exception.message : t('common.error'));
        }
    }, [customerId, entity, includeArchived, offset, order, query, sort, t]);

    useEffect(() => {
        const timer = setTimeout(() => void load(), query === '' ? 0 : 250);
        return () => clearTimeout(timer);
    }, [load, query]);

    const changed = async () => {
        setEditing(null);
        await loadLookup(entity, true).catch(() => undefined);
        await load();
        onChanged?.();
    };

    const save = async (data: Record<string, unknown>) => {
        setSaving(true);
        try {
            if (editing === 'new') {
                await apiFetch(`/api/v1/${entityPath(entity)}`, {body: data, method: 'POST'});
            }
            else if (editing !== null) {
                await apiFetch(`/api/v1/${entityPath(entity)}/${editing.id}`, {body: data, method: 'PATCH'});
            }
            await changed();
        }
        finally {
            setSaving(false);
        }
    };

    const remove = async () => {
        if (editing === null || editing === 'new') {
            return;
        }
        try {
            await apiFetch(`/api/v1/${entityPath(entity)}/${editing.id}`, {method: 'DELETE'});
            await changed();
        }
        catch (exception) {
            setError(exception instanceof ApiClientError ? exception.message : t('common.error'));
            setEditing(null);
        }
    };

    const singular = td(`entity.${entity}.singular`, definition.singular);
    const formId = `form-${entity}`;

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
                <label className="relative min-w-48 flex-1 sm:max-w-sm">
                    <span className="sr-only">{t('common.search')}</span>
                    <IconSearch size={18} stroke={1.75} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-muted"/>
                    <input
                        type="search"
                        className={`${inputClass} pl-9`}
                        placeholder={t('common.searchPlaceholder')}
                        value={query}
                        onChange={(event) => {
                            setOffset(0);
                            setQuery(event.target.value);
                        }}
                    />
                </label>
                {entity === 'customers' ? (
                    <label className="inline-flex items-center gap-2 text-sm text-text-soft">
                        <input type="checkbox" className="size-4 accent-[var(--accent)]" checked={includeArchived} onChange={(event) => setIncludeArchived(event.target.checked)}/>
                        {t('customer.showArchived')}
                    </label>
                ) : null}
                <div className="ml-auto flex flex-wrap gap-2">
                    {extraActions}
                    {!readOnly ? (
                        <Button variant="primary" icon={<IconPlus size={18} stroke={1.75}/>} onClick={() => (onCreate === undefined ? setEditing('new') : onCreate())}>
                            {t('common.newEntity', {entity: singular})}
                        </Button>
                    ) : null}
                </div>
            </div>

            {error !== null ? <Notice tone="error">{error}</Notice> : null}

            {result === null ? (
                <div className="flex flex-col gap-2">{Array.from({length: 5}, (_, index) => <Skeleton key={index} className="h-9 w-full"/>)}</div>
            ) : result.items.length === 0 ? (
                <EmptyState>{query === '' ? td(`entity.${entity}.empty`, t('common.empty')) : t('common.noResults')}</EmptyState>
            ) : (
                <EntityTable
                    entity={entity}
                    hidden={hidden}
                    items={result.items}
                    sort={sort}
                    order={order}
                    onOpen={(record) => {
                        if (onOpen !== undefined) {
                            onOpen(record);
                        }
                        else if (!readOnly) {
                            setEditing(record);
                        }
                    }}
                    onSort={(field) => {
                        setOrder(sort === field && order === 'asc' ? 'desc' : 'asc');
                        setSort(field);
                    }}
                />
            )}

            {result !== null && result.total > PAGE_SIZE ? (
                <div className="flex items-center justify-between text-sm text-text-muted">
                    <span>{t('common.pageInfo', {from: offset + 1, to: Math.min(offset + PAGE_SIZE, result.total), total: result.total})}</span>
                    <div className="flex gap-2">
                        <Button size="sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}>{t('common.previous')}</Button>
                        <Button size="sm" disabled={offset + PAGE_SIZE >= result.total} onClick={() => setOffset(offset + PAGE_SIZE)}>{t('common.next')}</Button>
                    </div>
                </div>
            ) : null}

            <Dialog
                open={editing !== null}
                onClose={() => setEditing(null)}
                size="lg"
                title={editing === 'new' ? t('common.newEntity', {entity: singular}) : t('common.editEntity', {entity: singular})}
                footer={(
                    <>
                        {editing !== null && editing !== 'new' ? (
                            <div className="mr-auto">
                                <ConfirmButton
                                    variant="danger"
                                    size="md"
                                    icon={<IconTrash size={18} stroke={1.75}/>}
                                    title={t('common.deleteTitle', {entity: singular})}
                                    message={t('common.deleteMessage')}
                                    confirmLabel={t('common.delete')}
                                    onConfirm={remove}
                                >
                                    {t('common.delete')}
                                </ConfirmButton>
                            </div>
                        ) : null}
                        <Button variant="ghost" onClick={() => setEditing(null)}>{t('common.cancel')}</Button>
                        <Button variant="primary" type="submit" form={formId} loading={saving}>{t('common.save')}</Button>
                    </>
                )}
            >
                {editing !== null ? (
                    <EntityForm
                        key={editing === 'new' ? 'new' : editing.id}
                        entity={entity}
                        fields={definition.fields}
                        formId={formId}
                        hidden={hidden}
                        defaults={customerField !== undefined && customerField !== 'id' ? {[customerField]: customerId} : {}}
                        initial={editing === 'new' ? undefined : editing}
                        onSubmit={save}
                    />
                ) : null}
            </Dialog>
        </div>
    );
}
