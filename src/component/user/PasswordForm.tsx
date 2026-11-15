'use client';

import {useState} from 'react';
import apiFetch from '@/client/apiFetch';
import ApiClientError from '@/client/ApiClientError';
import Button from '@/component/ui/Button';
import Card from '@/component/ui/Card';
import FormField from '@/component/ui/FormField';
import inputClass from '@/component/ui/inputClass';
import Notice from '@/component/ui/Notice';
import useI18n from '@/i18n/useI18n';
import isStrongPassword from '@/validation/isStrongPassword';

export default function PasswordForm() {
    const {t} = useI18n();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [message, setMessage] = useState<{ text: string; tone: 'error' | 'success' } | null>(null);
    const [saving, setSaving] = useState(false);

    return (
        <Card title={t('profile.password')}>
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={async (event) => {
                event.preventDefault();
                setErrors({});
                setMessage(null);
                if (!isStrongPassword(newPassword)) {
                    setErrors({newPassword: t('users.passwordHint')});
                    return;
                }
                setSaving(true);
                try {
                    await apiFetch('/api/v1/profile/password', {body: {currentPassword, newPassword}});
                    setCurrentPassword('');
                    setNewPassword('');
                    setMessage({text: t('profile.passwordChanged'), tone: 'success'});
                }
                catch (exception) {
                    if (exception instanceof ApiClientError) {
                        setErrors(exception.fieldErrors);
                        setMessage({text: exception.message, tone: 'error'});
                    }
                }
                finally {
                    setSaving(false);
                }
            }}>
                {message !== null ? <div className="sm:col-span-2"><Notice tone={message.tone}>{message.text}</Notice></div> : null}
                <FormField label={t('profile.currentPassword')} htmlFor="password-current" error={errors.currentPassword}>
                    <input id="password-current" type="password" autoComplete="current-password" className={inputClass} value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)}/>
                </FormField>
                <FormField label={t('users.newPassword')} htmlFor="password-new" error={errors.newPassword} hint={t('users.passwordHint')}>
                    <input id="password-new" type="password" autoComplete="new-password" className={inputClass} value={newPassword} onChange={(event) => setNewPassword(event.target.value)}/>
                </FormField>
                <div className="sm:col-span-2"><Button type="submit" loading={saving}>{t('profile.changePassword')}</Button></div>
            </form>
        </Card>
    );
}
