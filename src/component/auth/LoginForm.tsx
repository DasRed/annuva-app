'use client';

import Link from 'next/link';
import {useState} from 'react';
import apiFetch from '@/client/apiFetch';
import ApiClientError from '@/client/ApiClientError';
import Button from '@/component/ui/Button';
import FormField from '@/component/ui/FormField';
import inputClass from '@/component/ui/inputClass';
import Notice from '@/component/ui/Notice';
import useI18n from '@/i18n/useI18n';

export default function LoginForm({canRegister, mailEnabled}: { canRegister: boolean; mailEnabled: boolean }) {
    const {t} = useI18n();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    return (
        <form className="flex flex-col gap-5" onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setError(null);
            try {
                await apiFetch('/api/auth/login', {body: {email, password}});
                window.location.href = '/';
            }
            catch (exception) {
                setError(exception instanceof ApiClientError ? exception.message : t('common.error'));
                setBusy(false);
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
