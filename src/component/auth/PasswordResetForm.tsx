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

/**
 * Without token: request a reset link by e-mail. With token (from the link): set a new password.
 */
export default function PasswordResetForm({token}: { token: string | null }) {
    const {t} = useI18n();
    const [value, setValue] = useState('');
    const [done, setDone] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    return (
        <form className="flex flex-col gap-5" onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setError(null);
            try {
                await apiFetch('/api/auth/password-reset', {body: token === null ? {email: value} : {password: value, token}});
                setDone(true);
            }
            catch (exception) {
                setError(exception instanceof ApiClientError ? exception.message : t('common.error'));
            }
            finally {
                setBusy(false);
            }
        }}>
            <div>
                <h1 className="text-4xl font-semibold">{t('auth.reset.title')}</h1>
                <p className="mt-2 text-text-soft">{token === null ? t('auth.reset.requestDescription') : t('auth.reset.setDescription')}</p>
            </div>
            {error !== null ? <Notice tone="error">{error}</Notice> : null}
            {done ? (
                <Notice tone="success">{token === null ? t('auth.reset.sent') : t('auth.reset.done')}</Notice>
            ) : (
                <>
                    <FormField label={token === null ? t('users.email') : t('users.newPassword')} htmlFor="reset-value" hint={token === null ? undefined : t('users.passwordHint')}>
                        <input id="reset-value" type={token === null ? 'email' : 'password'} autoComplete={token === null ? 'username' : 'new-password'} required className={inputClass} value={value} onChange={(event) => setValue(event.target.value)}/>
                    </FormField>
                    <Button variant="primary" type="submit" loading={busy}>{token === null ? t('auth.reset.request') : t('auth.reset.set')}</Button>
                </>
            )}
            <Link href="/login" className="text-sm text-accent hover:underline">{t('auth.backToLogin')}</Link>
        </form>
    );
}
