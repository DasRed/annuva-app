'use client';

import {IconArrowLeft, IconShieldLock} from '@tabler/icons-react';
import Link from 'next/link';
import {useState} from 'react';
import apiFetch from '@/client/apiFetch';
import ApiClientError from '@/client/ApiClientError';
import Button from '@/component/ui/Button';
import FormField from '@/component/ui/FormField';
import inputClass from '@/component/ui/inputClass';
import Notice from '@/component/ui/Notice';
import useI18n from '@/i18n/useI18n';

/**
 * Login with e-mail and password; users with two-factor authentication enter a code from their
 * authenticator app (or a recovery code) in a second step.
 */
export default function LoginForm({canRegister, mailEnabled}: { canRegister: boolean; mailEnabled: boolean }) {
    const {t} = useI18n();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [challenge, setChallenge] = useState<string | null>(null);
    const [code, setCode] = useState('');
    const [recovery, setRecovery] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const fail = (exception: unknown) => {
        if (exception instanceof ApiClientError && exception.code === 'challenge_expired') {
            setChallenge(null);
            setCode('');
        }
        setError(exception instanceof ApiClientError ? exception.message : t('common.error'));
        setBusy(false);
    };

    if (challenge !== null) {
        return (
            <form className="flex flex-col gap-5" onSubmit={async (event) => {
                event.preventDefault();
                setBusy(true);
                setError(null);
                try {
                    await apiFetch('/api/auth/login/two-factor', {body: {challenge, code}});
                    window.location.href = '/';
                }
                catch (exception) {
                    fail(exception);
                }
            }}>
                <div>
                    <IconShieldLock size={36} stroke={1.5} className="mb-3 text-accent"/>
                    <h1 className="text-4xl font-semibold">{t('auth.twoFactor.title')}</h1>
                    <p className="mt-2 text-text-soft">{recovery ? t('auth.twoFactor.recoveryDescription') : t('auth.twoFactor.description')}</p>
                </div>
                {error !== null ? <Notice tone="error">{error}</Notice> : null}
                <FormField label={recovery ? t('twoFactor.recoveryCode') : t('twoFactor.code')} htmlFor="login-code">
                    <input
                        id="login-code"
                        autoFocus
                        required
                        className={`${inputClass} text-center font-mono text-xl tracking-[0.3em]`}
                        autoComplete="one-time-code"
                        inputMode={recovery ? 'text' : 'numeric'}
                        maxLength={recovery ? 11 : 6}
                        placeholder={recovery ? 'xxxxx-xxxxx' : '123456'}
                        value={code}
                        onChange={(event) => setCode(recovery ? event.target.value : event.target.value.replace(/\D/g, ''))}
                    />
                </FormField>
                <Button variant="primary" type="submit" loading={busy} disabled={code.trim() === ''}>{t('auth.twoFactor.submit')}</Button>
                <div className="flex flex-wrap justify-between gap-2 text-sm">
                    <button type="button" className="inline-flex items-center gap-1 text-text-muted hover:text-text" onClick={() => {
                        setChallenge(null);
                        setCode('');
                        setError(null);
                    }}>
                        <IconArrowLeft size={16} stroke={1.75}/>{t('common.back')}
                    </button>
                    <button type="button" className="text-accent hover:underline" onClick={() => {
                        setRecovery(!recovery);
                        setCode('');
                        setError(null);
                    }}>
                        {recovery ? t('auth.twoFactor.useApp') : t('auth.twoFactor.useRecovery')}
                    </button>
                </div>
            </form>
        );
    }

    return (
        <form className="flex flex-col gap-5" onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setError(null);
            try {
                const result = await apiFetch<{ challenge?: string; twoFactorRequired: boolean }>('/api/auth/login', {body: {email, password}});
                if (result.twoFactorRequired && result.challenge !== undefined) {
                    setRecovery(false);
                    setChallenge(result.challenge);
                    setBusy(false);
                    return;
                }
                window.location.href = '/';
            }
            catch (exception) {
                fail(exception);
            }
        }}>
            <div>
                <h1 className="text-4xl font-semibold">{t('auth.login.title')}</h1>
                <p className="mt-2 text-text-soft">{t('auth.login.description')}</p>
            </div>
            {error !== null ? <Notice tone="error">{error}</Notice> : null}
            <FormField label={t('users.email')} htmlFor="login-email">
                <input id="login-email" type="email" autoComplete="username" required className={inputClass} value={email} onChange={(event) => setEmail(event.target.value)}/>
            </FormField>
            <FormField label={t('users.password')} htmlFor="login-password">
                <input id="login-password" type="password" autoComplete="current-password" required className={inputClass} value={password} onChange={(event) => setPassword(event.target.value)}/>
            </FormField>
            <Button variant="primary" type="submit" loading={busy}>{t('auth.login.submit')}</Button>
            <div className="flex flex-wrap justify-between gap-2 text-sm">
                {mailEnabled ? <Link href="/password-reset" className="text-accent hover:underline">{t('auth.login.forgot')}</Link> : <span className="text-text-muted">{t('auth.login.forgotNoMail')}</span>}
                {canRegister ? <Link href="/register" className="text-accent hover:underline">{t('auth.register.link')}</Link> : null}
            </div>
        </form>
    );
}
