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
 * Self-registration of a new tenant (APP_MODE=multi).
 */
export default function RegisterForm() {
    const {locale, t} = useI18n();
    const [form, setForm] = useState({companyName: '', email: '', name: '', password: ''});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const field = (name: keyof typeof form, label: string, type = 'text', autoComplete?: string) => (
        <FormField label={label} htmlFor={`register-${name}`} error={errors[name]} required>
            <input id={`register-${name}`} type={type} autoComplete={autoComplete} className={inputClass} value={form[name]} onChange={(event) => setForm({...form, [name]: event.target.value})}/>
        </FormField>
    );

    return (
        <form className="flex flex-col gap-5" onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setError(null);
            try {
                await apiFetch('/api/auth/register', {body: {...form, locale}});
                window.location.href = '/settings';
            }
            catch (exception) {
                if (exception instanceof ApiClientError) {
                    setErrors(exception.fieldErrors);
                    setError(exception.message);
                }
                setBusy(false);
            }
        }}>
            <div>
                <h1 className="text-4xl font-semibold">{t('auth.register.title')}</h1>
                <p className="mt-2 text-text-soft">{t('auth.register.description')}</p>
            </div>
            {error !== null ? <Notice tone="error">{error}</Notice> : null}
            {field('companyName', t('field.settings.companyName'), 'text', 'organization')}
            {field('name', t('users.name'), 'text', 'name')}
            {field('email', t('users.email'), 'email', 'username')}
            {field('password', t('users.password'), 'password', 'new-password')}
            <Button variant="primary" type="submit" loading={busy}>{t('auth.register.submit')}</Button>
            <Link href="/login" className="text-sm text-accent hover:underline">{t('auth.backToLogin')}</Link>
        </form>
    );
}
