'use client';

import {IconEye, IconPencil, IconPlus, IconStarFilled} from '@tabler/icons-react';
import {useRouter} from 'next/navigation';
import {useEffect, useState} from 'react';
import apiFetch from '@/client/apiFetch';
import ApiClientError from '@/client/ApiClientError';
import openTemplatePreview from '@/client/openTemplatePreview';
import templatePreviewValues from '@/client/templatePreviewValues';
import useTemplatePreview from '@/client/useTemplatePreview';
import TemplatePreview from '@/component/template/TemplatePreview';
import Button from '@/component/ui/Button';
import Card from '@/component/ui/Card';
import EmptyState from '@/component/ui/EmptyState';
import Notice from '@/component/ui/Notice';
import PageHeader from '@/component/ui/PageHeader';
import Pill from '@/component/ui/Pill';
import Skeleton from '@/component/ui/Skeleton';
import type EntityRecord from '@/entity/EntityRecord';
import type ListResult from '@/entity/ListResult';
import useI18n from '@/i18n/useI18n';

const DESKTOP = '(min-width: 1024px)';

/**
 * Invoice templates: the list and – on desktop – a sample invoice of the selected or hovered
 * template next to it. A new template is created right away and opened in the editor.
 */
export default function TemplatesView() {
    const {t, td} = useI18n();
    const router = useRouter();
    const [items, setItems] = useState<EntityRecord[] | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [hoverId, setHoverId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        let active = true;
        apiFetch<ListResult>('/api/v1/invoice-templates?limit=200&sort=name&order=asc').then((result) => {
            if (active) {
                setItems(result.items);
            }
        }).catch((exception: unknown) => {
            if (active) {
                setError(exception instanceof ApiClientError ? exception.message : t('common.error'));
            }
        });
        return () => {
            active = false;
        };
    }, [t]);

    const fallback = items?.find((item) => item.isDefault === true) ?? items?.[0];
    const shown = items?.find((item) => item.id === (hoverId ?? selectedId)) ?? fallback;
    const preview = useTemplatePreview(shown === undefined ? null : templatePreviewValues(shown), hoverId === null ? 0 : 150);

    const create = async () => {
        setCreating(true);
        setError(null);
        try {
            const created = await apiFetch<EntityRecord>('/api/v1/invoice-templates', {body: {name: t('templates.newName')}, method: 'POST'});
            router.push(`/settings/templates/${created.id}`);
        }
        catch (exception) {
            setError(exception instanceof ApiClientError ? exception.message : t('common.error'));
            setCreating(false);
        }
    };

    return (
        <>
            <PageHeader
                eyebrow={td('entity.invoiceTemplates.eyebrow', '')}
                title={td('entity.invoiceTemplates.plural', 'Invoice templates')}
                description={td('entity.invoiceTemplates.description', '')}
                actions={<Button variant="primary" icon={<IconPlus size={18} stroke={1.75}/>} loading={creating} onClick={create}>{t('common.newEntity', {entity: td('entity.invoiceTemplates.singular', 'Template')})}</Button>}
            />
            {error !== null ? <div className="mb-4"><Notice tone="error">{error}</Notice></div> : null}
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)] 2xl:grid-cols-[minmax(0,1fr)_32rem]">
                <Card>
                    {items === null ? (
                        <div className="flex flex-col gap-2">{Array.from({length: 3}, (_, index) => <Skeleton key={index} className="h-14 w-full"/>)}</div>
                    ) : items.length === 0 ? (
                        <EmptyState>{td('entity.invoiceTemplates.empty', '')}</EmptyState>
                    ) : (
                        <ul className="flex flex-col gap-1" onMouseLeave={() => setHoverId(null)}>
                            {items.map((item) => {
                                const active = item.id === shown?.id;
                                return (
                                    <li key={item.id}>
                                        <div
                                            className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition ${active ? 'border-accent/40 bg-accent-soft/50' : 'border-transparent hover:bg-surface-2'}`}
                                            onMouseEnter={() => setHoverId(item.id)}
                                        >
                                            <button
                                                type="button"
                                                className="flex min-w-0 flex-1 items-center gap-3 text-left"
                                                aria-pressed={item.id === selectedId}
                                                onClick={() => {
                                                    if (window.matchMedia(DESKTOP).matches) {
                                                        setSelectedId(item.id);
                                                    }
                                                    else {
                                                        router.push(`/settings/templates/${item.id}`);
                                                    }
                                                }}
                                                onDoubleClick={() => router.push(`/settings/templates/${item.id}`)}
                                            >
                                                <span className="size-3 shrink-0 rounded-full border border-line" style={{backgroundColor: String(item.accentColor ?? '#0f6b5c')}}/>
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate font-semibold">{String(item.name)}</span>
                                                    <span className="block text-xs text-text-muted">{t('templates.paymentTerm', {days: Number(item.paymentTermDays)})}</span>
                                                </span>
                                                {item.isDefault === true ? (
                                                    <>
                                                        <IconStarFilled size={16} className="shrink-0 text-accent sm:hidden" aria-label={t('templates.default')}/>
                                                        <span className="hidden sm:inline-flex"><Pill tone="accent" icon={<IconStarFilled size={12}/>}>{t('templates.default')}</Pill></span>
                                                    </>
                                                ) : null}
                                            </button>
                                            <Button size="sm" variant="ghost" className="lg:hidden" icon={<IconEye size={16} stroke={1.75}/>} aria-label={t('templates.openPreview')}
                                                    onClick={() => openTemplatePreview(templatePreviewValues(item)).catch(() => setError(t('templates.previewError')))}/>
                                            <Button size="sm" href={`/settings/templates/${item.id}`} icon={<IconPencil size={16} stroke={1.75}/>} aria-label={t('common.edit')}>
                                                <span className="hidden sm:inline">{t('common.edit')}</span>
                                            </Button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </Card>
                <Card title={t('templates.preview')} className="hidden lg:sticky lg:top-8 lg:block">
                    {shown === undefined ? <EmptyState>{t('templates.previewEmpty')}</EmptyState> : <TemplatePreview {...preview}/>}
                </Card>
            </div>
        </>
    );
}
