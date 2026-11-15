'use client';

import {IconKey, IconShieldCheck, IconShieldOff} from '@tabler/icons-react';
import {type FormEvent, useEffect, useState} from 'react';
import apiFetch from '@/client/apiFetch';
import ApiClientError from '@/client/ApiClientError';
import Button from '@/component/ui/Button';
import Card from '@/component/ui/Card';
import Dialog from '@/component/ui/Dialog';
import FormField from '@/component/ui/FormField';
import inputClass from '@/component/ui/inputClass';
import Notice from '@/component/ui/Notice';
import Pill from '@/component/ui/Pill';
import Skeleton from '@/component/ui/Skeleton';
import RecoveryCodes from '@/component/user/RecoveryCodes';
import useI18n from '@/i18n/useI18n';

type Status = { enabled: boolean; recoveryCodesLeft: number };
type Setup = { qrCode: string; secret: string; uri: string };
type Mode = 'disable' | 'recovery' | 'setup' | null;

const codeInputClass = `${inputClass} text-center font-mono text-lg tracking-[0.3em]`;

/**
 * Optional two-factor authentication with an authenticator app: set up with QR code, recovery
 * codes, regenerate them, switch it off.
 */
export default function TwoFactorCard() {
    const {t} = useI18n();
    const [status, setStatus] = useState<Status | null>(null);
    const [mode, setMode] = useState<Mode>(null);
    const [setup, setSetup] = useState<Setup | null>(null);
    const [codes, setCodes] = useState<string[] | null>(null);
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        let active = true;
        apiFetch<Status>('/api/v1/profile/two-factor').then((result) => {
            if (active) {
                setStatus(result);
            }
        }).catch(() => undefined);
        return () => {
            active = false;
        };
    }, []);

    const reload = async () => setStatus(await apiFetch<Status>('/api/v1/profile/two-factor'));

    const open = async (next: Mode) => {
        setCode('');
        setPassword('');
        setError(null);
        setCodes(null);
        setSetup(null);
        setMode(next);
        if (next === 'setup') {
            try {
                setSetup(await apiFetch<Setup>('/api/v1/profile/two-factor/setup', {body: {}}));
            }
            catch (exception) {
                setError(exception instanceof ApiClientError ? exception.message : t('common.error'));
            }
        }
    };

    const close = async () => {
        setMode(null);
        await reload();
    };

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        setBusy(true);
        setError(null);
        try {
            if (mode === 'setup') {
                setCodes((await apiFetch<{ recoveryCodes: string[] }>('/api/v1/profile/two-factor/enable', {body: {code}})).recoveryCodes);
            }
            else if (mode === 'recovery') {
                setCodes((await apiFetch<{ recoveryCodes: string[] }>('/api/v1/profile/two-factor/recovery-codes', {body: {code}})).recoveryCodes);
            }
            else if (mode === 'disable') {
                await apiFetch('/api/v1/profile/two-factor/disable', {body: {code, password}});
                await close();
            }
        }
        catch (exception) {
            setError(exception instanceof ApiClientError ? exception.message : t('common.error'));
        }
        finally {
            setBusy(false);
        }
    };

    const titles = {disable: t('twoFactor.disable'), recovery: t('twoFactor.newRecoveryCodes'), setup: t('twoFactor.setup')};

    return (
        <Card title={t('twoFactor.title')} description={t('twoFactor.description')}>
            {status === null ? <Skeleton className="h-10 w-full"/> : status.enabled ? (
                <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <Pill tone="positive" icon={<IconShieldCheck size={14}/>}>{t('twoFactor.active')}</Pill>
                        <span className="text-sm text-text-muted">{t('twoFactor.recoveryCodesLeft', {count: status.recoveryCodesLeft})}</span>
                    </div>
                    {status.recoveryCodesLeft <= 3 ? <Notice tone="warning">{t('twoFactor.fewRecoveryCodes')}</Notice> : null}
                    <div className="flex flex-wrap gap-2">
                        <Button size="sm" icon={<IconKey size={16} stroke={1.75}/>} onClick={() => open('recovery')}>{t('twoFactor.newRecoveryCodes')}</Button>
                        <Button size="sm" variant="ghost" icon={<IconShieldOff size={16} stroke={1.75}/>} onClick={() => open('disable')}>{t('twoFactor.disable')}</Button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-wrap items-center gap-3">
                    <Pill tone="neutral">{t('twoFactor.inactive')}</Pill>
                    <Button variant="primary" size="sm" icon={<IconShieldCheck size={16} stroke={1.75}/>} onClick={() => open('setup')}>{t('twoFactor.setup')}</Button>
                </div>
            )}

            <Dialog
                open={mode !== null}
                onClose={() => void close()}
                title={mode === null ? '' : titles[mode]}
                footer={codes !== null ? (
                    <Button variant="primary" onClick={() => void close()}>{t('twoFactor.done')}</Button>
                ) : (
                    <>
                        <Button variant="ghost" onClick={() => void close()}>{t('common.cancel')}</Button>
                        <Button variant={mode === 'disable' ? 'danger' : 'primary'} type="submit" form="two-factor-form" loading={busy} disabled={code.trim() === '' || (mode === 'setup' && setup === null)}>
                            {mode === 'setup' ? t('twoFactor.activate') : mode === 'disable' ? t('twoFactor.disable') : t('twoFactor.generate')}
                        </Button>
                    </>
                )}
            >
                {codes !== null ? (
                    <div className="flex flex-col gap-3">
                        {mode === 'setup' ? <Notice tone="success">{t('twoFactor.enabled')}</Notice> : null}
                        <RecoveryCodes codes={codes}/>
                    </div>
                ) : (
                    <form id="two-factor-form" className="flex flex-col gap-4" onSubmit={submit}>
                        {error !== null ? <Notice tone="error">{error}</Notice> : null}
                        {mode === 'setup' ? (
                            <>
                                <ol className="list-decimal space-y-1 pl-5 text-sm text-text-soft">
                                    <li>{t('twoFactor.step1')}</li>
                                    <li>{t('twoFactor.step2')}</li>
                                    <li>{t('twoFactor.step3')}</li>
                                </ol>
                                <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
                                    {setup === null ? <Skeleton className="size-44 shrink-0"/> : (
                                        <img src={`data:image/svg+xml;utf8,${encodeURIComponent(setup.qrCode)}`} alt={t('twoFactor.qrAlt')} width={176} height={176} className="size-44 shrink-0 rounded-lg border border-line bg-white p-1"/>
                                    )}
                                    <div className="flex min-w-0 flex-col gap-1 text-sm">
                                        <span className="text-text-muted">{t('twoFactor.manualKey')}</span>
                                        <code className="rounded-md bg-surface-2 px-2 py-1 font-mono break-all">{setup?.secret ?? '…'}</code>
                                    </div>
                                </div>
                            </>
                        ) : null}
                        {mode === 'disable' ? (
                            <FormField label={t('users.password')} htmlFor="two-factor-password">
                                <input id="two-factor-password" type="password" autoComplete="current-password" className={inputClass} value={password} onChange={(event) => setPassword(event.target.value)}/>
                            </FormField>
                        ) : null}
                        <FormField label={mode === 'disable' ? t('twoFactor.codeOrRecovery') : t('twoFactor.code')} htmlFor="two-factor-code">
                            <input
                                id="two-factor-code"
                                className={codeInputClass}
                                autoComplete="one-time-code"
                                inputMode={mode === 'disable' ? 'text' : 'numeric'}
                                maxLength={mode === 'disable' ? 11 : 6}
                                placeholder="123456"
                                value={code}
                                onChange={(event) => setCode(mode === 'disable' ? event.target.value : event.target.value.replace(/\D/g, ''))}
                            />
                        </FormField>
                    </form>
                )}
            </Dialog>
        </Card>
    );
}
