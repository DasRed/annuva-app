'use client';

import {IconDownload} from '@tabler/icons-react';
import {useEffect, useState} from 'react';
import apiFetch from '@/client/apiFetch';
import Button from '@/component/ui/Button';
import Card from '@/component/ui/Card';
import PageHeader from '@/component/ui/PageHeader';
import Skeleton from '@/component/ui/Skeleton';
import useI18n from '@/i18n/useI18n';

type Operation = { requestBody?: { content?: Record<string, { schema?: unknown }> }; summary?: string; tags?: string[] };
type Spec = { info: { description: string; version: string }; paths: Record<string, Record<string, Operation>> };

const methodColors: Record<string, string> = {
    delete: 'bg-negative-soft text-negative',
    get:    'bg-info-soft text-info',
    patch:  'bg-warning-soft text-warning',
    post:   'bg-positive-soft text-positive',
    put:    'bg-warning-soft text-warning',
};

/**
 * Readable overview of the OpenAPI document plus how to connect the MCP server.
 */
export default function ApiDocs({baseUrl}: { baseUrl: string }) {
    const {t} = useI18n();
    const [spec, setSpec] = useState<Spec | null>(null);
    useEffect(() => {
        apiFetch<Spec>('/api/v1/openapi').then(setSpec).catch(() => undefined);
    }, []);

    const groups = new Map<string, { method: string; operation: Operation; path: string }[]>();
    for (const [path, methods] of Object.entries(spec?.paths ?? {})) {
        for (const [method, operation] of Object.entries(methods)) {
            const tag = operation.tags?.[0] ?? 'other';
            groups.set(tag, [...(groups.get(tag) ?? []), {method, operation, path}]);
        }
    }

    return (
        <>
            <PageHeader eyebrow="API" title={t('apiDocs.title')} description={spec?.info.description}
                        actions={<Button href="/api/v1/openapi" icon={<IconDownload size={18} stroke={1.75}/>}>OpenAPI JSON</Button>}/>
            <div className="grid gap-6 2xl:grid-cols-[24rem_minmax(0,1fr)]">
                <Card title={t('apiDocs.mcpTitle')} className="2xl:sticky 2xl:top-8 2xl:self-start">
                    <div className="flex flex-col gap-3 text-sm text-text-soft">
                        <p>{t('apiDocs.mcpDescription')}</p>
                        <dl className="flex flex-col gap-2">
                            <div><dt className="text-xs font-semibold text-text-muted uppercase">URL</dt><dd><code className="break-all">{baseUrl}/api/mcp</code></dd></div>
                            <div><dt className="text-xs font-semibold text-text-muted uppercase">Header</dt><dd><code>Authorization: Bearer an_…</code></dd></div>
                            <div><dt className="text-xs font-semibold text-text-muted uppercase">REST</dt><dd><code className="break-all">{baseUrl}/api/v1</code></dd></div>
                        </dl>
                        <p>{t('apiDocs.tokenHint')}</p>
                        <Button href="/profile" size="sm">{t('apiDocs.toTokens')}</Button>
                    </div>
                </Card>
                <div className="flex flex-col gap-6">
                    {spec === null ? <Skeleton className="h-64 w-full"/> : [...groups.entries()].map(([tag, operations]) => (
                        <Card key={tag} title={tag}>
                            <ul className="flex flex-col gap-2">
                                {operations.map(({method, operation, path}) => {
                                    const body = operation.requestBody?.content?.['application/json']?.schema;
                                    return (
                                        <li key={`${method} ${path}`}>
                                            <details className="group rounded-lg border border-line">
                                                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 px-3 py-2">
                                                    <span className={`w-16 rounded px-2 py-0.5 text-center text-xs font-bold uppercase ${methodColors[method] ?? ''}`}>{method}</span>
                                                    <code className="text-sm break-all">{path}</code>
                                                    <span className="text-sm text-text-muted">{operation.summary}</span>
                                                </summary>
                                                {body !== undefined ? <pre className="overflow-x-auto border-t border-line bg-surface-2/50 p-3 text-xs">{JSON.stringify(body, null, 2)}</pre> : null}
                                            </details>
                                        </li>
                                    );
                                })}
                            </ul>
                        </Card>
                    ))}
                </div>
            </div>
        </>
    );
}
