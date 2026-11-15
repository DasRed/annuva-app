'use client';

import {IconTrash, IconUpload} from '@tabler/icons-react';
import {useRouter} from 'next/navigation';
import {useRef, useState} from 'react';
import apiFetch from '@/client/apiFetch';
import ApiClientError from '@/client/ApiClientError';
import Avatar from '@/component/layout/Avatar';
import Button from '@/component/ui/Button';
import Card from '@/component/ui/Card';
import FormField from '@/component/ui/FormField';
import inputClass from '@/component/ui/inputClass';
import Notice from '@/component/ui/Notice';
import useI18n from '@/i18n/useI18n';
import applyTheme from '@/client/applyTheme';

type Profile = { avatarFileId: string | null; avatarUrl: string | null; email: string; locale: string; name: string; theme: string; timezone: string };

/**
 * Own profile: name, e-mail, picture (or Gravatar), language, time zone and theme.
 */
export default function ProfileForm({gravatarEnabled, profile}: { gravatarEnabled: boolean; profile: Profile }) {
    const {t} = useI18n();
    const router = useRouter();
    const upload = useRef<HTMLInputElement>(null);
    const [form, setForm] = useState(profile);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [message, setMessage] = useState<{ text: string; tone: 'error' | 'success' } | null>(null);
    const [saving, setSaving] = useState(false);

    const save = async (changes: Partial<Profile>) => {
        setSaving(true);
        setMessage(null);
        setErrors({});
        try {
            const updated = await apiFetch<Profile>('/api/v1/profile', {body: changes, method: 'PATCH'});
            setForm(updated);
            setMessage({text: t('common.saved'), tone: 'success'});
            router.refresh();
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
    };

    return (
        <Card title={t('profile.title')} description={t('profile.description')}>
            <div className="flex flex-col gap-6 md:flex-row">
                <div className="flex flex-col items-center gap-3 md:w-44">
                    <Avatar name={form.name} url={form.avatarUrl} size={112}/>
                    <input ref={upload} type="file" accept="image/*" className="sr-only" onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (file === undefined) {
                            return;
                        }
                        const data = new FormData();
                        data.append('file', file);
                        const stored = await apiFetch<{ id: string }>('/api/v1/files', {formData: data});
                        await save({avatarFileId: stored.id});
                        event.target.value = '';
                    }}/>
                    <div className="flex flex-wrap justify-center gap-2">
                        <Button size="sm" icon={<IconUpload size={16} stroke={1.75}/>} onClick={() => upload.current?.click()}>{t('profile.uploadPicture')}</Button>
                        {form.avatarFileId !== null ? <Button size="sm" variant="ghost" icon={<IconTrash size={16} stroke={1.75}/>} onClick={() => save({avatarFileId: null})} aria-label={t('common.remove')}/> : null}
                    </div>
                    <p className="text-center text-xs text-text-muted">{gravatarEnabled ? t('profile.gravatarHint') : t('profile.noGravatarHint')}</p>
                </div>
                <form className="grid flex-1 gap-4 sm:grid-cols-2" onSubmit={(event) => {
                    event.preventDefault();
                    void save({email: form.email, locale: form.locale, name: form.name, theme: form.theme, timezone: form.timezone});
                }}>
                    {message !== null ? <div className="sm:col-span-2"><Notice tone={message.tone}>{message.text}</Notice></div> : null}
                    <FormField label={t('users.name')} htmlFor="profile-name" required error={errors.name}>
                        <input id="profile-name" className={inputClass} value={form.name} onChange={(event) => setForm({...form, name: event.target.value})}/>
                    </FormField>
                    <FormField label={t('users.email')} htmlFor="profile-email" required error={errors.email}>
                        <input id="profile-email" type="email" className={inputClass} value={form.email} onChange={(event) => setForm({...form, email: event.target.value})}/>
                    </FormField>
                    <FormField label={t('profile.language')} htmlFor="profile-locale">
                        <select id="profile-locale" className={inputClass} value={form.locale} onChange={(event) => setForm({...form, locale: event.target.value})}>
                            <option value="de">Deutsch</option>
                            <option value="en">English</option>
                        </select>
                    </FormField>
                    <FormField label={t('profile.theme')} htmlFor="profile-theme">
                        <select id="profile-theme" className={inputClass} value={form.theme} onChange={(event) => {
                            setForm({...form, theme: event.target.value});
                            applyTheme(event.target.value);
                        }}>
                            <option value="system">{t('profile.theme.system')}</option>
                            <option value="light">{t('profile.theme.light')}</option>
                            <option value="dark">{t('profile.theme.dark')}</option>
                        </select>
                    </FormField>
                    <FormField label={t('profile.timezone')} htmlFor="profile-timezone" error={errors.timezone}>
                        <input id="profile-timezone" className={inputClass} list="timezones" value={form.timezone} onChange={(event) => setForm({...form, timezone: event.target.value})}/>
                        <datalist id="timezones">
                            {Intl.supportedValuesOf('timeZone').map((zone) => <option key={zone} value={zone}>{zone}</option>)}
                        </datalist>
                    </FormField>
                    <div className="flex items-end sm:col-span-2">
                        <Button variant="primary" type="submit" loading={saving}>{t('common.save')}</Button>
                    </div>
                </form>
            </div>
        </Card>
    );
}
