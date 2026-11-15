'use client';

import {IconCopy, IconKey, IconTrash} from '@tabler/icons-react';
import {useCallback, useEffect, useState} from 'react';
import apiFetch from '@/client/apiFetch';
import ApiClientError from '@/client/ApiClientError';
import Button from '@/component/ui/Button';
import Card from '@/component/ui/Card';
import ConfirmButton from '@/component/ui/ConfirmButton';
import EmptyState from '@/component/ui/EmptyState';
import FormField from '@/component/ui/FormField';
import inputClass from '@/component/ui/inputClass';
import Notice from '@/component/ui/Notice';
import Pill from '@/component/ui/Pill';
import useI18n from '@/i18n/useI18n';

type Token = { createdAt: string; expiresAt: string | null; id: string; lastUsedAt: string | null; name: string; prefix: string; scope: string };

/**
 * Personal API tokens for the REST API and the MCP server. The token is shown exactly once.
 */
export default function TokenManager({baseUrl}: { baseUrl: string }) {
    const {date, t} = useI18n();
    const [tokens, setTokens] = useState<Token[]>([]);
    const [name, setName] = useState('');
    const [scope, setScope] = useState('read');
    const [expiresAt, setExpiresAt] = useState('');
    const [created, setCreated] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        setTokens((await apiFetch<{ items: Token[] }>('/api/v1/tokens')).items);
    }, []);

    useEffect(() => {
        let active = true;
        apiFetch<{ items: Token[] }>('/api/v1/tokens').then((result) => {
            if (active) {
                setTokens(result.items);
            }
        }).catch(() => undefined);
        return () => {
            active = false;
        };
    }, []);

    return (
        <Card title={t('tokens.title')} description={t('tokens.description')}>
            <form className="grid gap-4 sm:grid-cols-[1fr_12rem_12rem_auto] sm:items-end" onSubmit={async (event) => {
                event.preventDefault();
                setBusy(true);
                setError(null);
                try {
                    const token = await apiFetch<{ token: string }>('/api/v1/tokens', {body: {expiresAt: expiresAt === '' ? null : expiresAt, name, scope}});
                    setCreated(token.token);
                    setName('');
                    await load();
                }
                catch (exception) {
                    setError(exception instanceof ApiClientError ? exception.message : t('common.error'));
                }
                finally {
                    setBusy(false);
                }
            }}>
                <FormField label={t('tokens.name')} htmlFor="token-name" required>
                    <input id="token-name" className={inputClass} value={name} placeholder="Claude Desktop" onChange={(event) => setName(event.target.value)}/>
                </FormField>
                <FormField label={t('tokens.scope')} htmlFor="token-scope">
                    <select id="token-scope" className={inputClass} value={scope} onChange={(event) => setScope(event.target.value)}>
                        <option value="read">{t('tokens.scope.read')}</option>
                        <option value="read_write">{t('tokens.scope.read_write')}</option>
                    </select>
                </FormField>
                <FormField label={t('tokens.expiresAt')} htmlFor="token-expires">
                    <input id="token-expires" type="date" className={inputClass} value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)}/>
                </FormField>
                <Button variant="primary" type="submit" loading={busy} disabled={name.trim() === ''} icon={<IconKey size={18} stroke={1.75}/>}>{t('tokens.create')}</Button>
            </form>

            {error !== null ? <div className="mt-4"><Notice tone="error">{error}</Notice></div> : null}
            {created !== null ? (
                <div className="mt-4 flex flex-col gap-2">
                    <Notice tone="warning">{t('tokens.copyNow')}</Notice>
                    <div className="flex items-center gap-2">
                        <code className="flex-1 overflow-x-auto rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm">{created}</code>
                        <Button size="sm" icon={<IconCopy size={16} stroke={1.75}/>} onClick={() => navigator.clipboard.writeText(created)}>{t('common.copy')}</Button>
                    </div>
                    <p className="text-xs text-text-muted">{t('tokens.usage', {mcp: `${baseUrl}/api/mcp`, api: `${baseUrl}/api/v1`})}</p>
                </div>
            ) : null}

            <div className="mt-6">
                {tokens.length === 0 ? <EmptyState>{t('tokens.empty')}</EmptyState> : (
                    <ul className="divide-y divide-line">
                        {tokens.map((token) => (
                            <li key={token.id} className="flex flex-wrap items-center gap-3 py-3">
                                <IconKey size={18} stroke={1.75} className="text-gold"/>
                                <span className="min-w-0 flex-1">
                                    <span className="block font-semibold">{token.name}</span>
                                    <span className="block text-xs text-text-muted">
                                        <code>{token.prefix}…</code> · {t('tokens.created', {date: date(token.createdAt)})} · {t('tokens.lastUsed', {date: date(token.lastUsedAt, true)})}
                                        {token.expiresAt !== null ? ` · ${t('tokens.expires', {date: date(token.expiresAt.slice(0, 10))})}` : ''}
                                    </span>
                                </span>
                                <Pill tone={token.scope === 'read' ? 'neutral' : 'warning'}>{t(token.scope === 'read' ? 'tokens.scope.read' : 'tokens.scope.read_write')}</Pill>
                                <ConfirmButton size="sm" variant="ghost" icon={<IconTrash size={16} stroke={1.75}/>} title={t('tokens.revokeTitle')} message={t('tokens.revokeMessage')} confirmLabel={t('tokens.revoke')}
                                               onConfirm={async () => {
                                                   await apiFetch(`/api/v1/tokens/${token.id}`, {method: 'DELETE'});
                                                   await load();
                                               }}>
                                    {t('tokens.revoke')}
                                </ConfirmButton>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </Card>
    );
}
