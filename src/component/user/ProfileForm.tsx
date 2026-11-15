'use client';

import {IconCloudCheck, IconTrash, IconUpload} from '@tabler/icons-react';
import {useRouter} from 'next/navigation';
import {type ReactNode, useCallback, useRef, useState} from 'react';
import apiFetch from '@/client/apiFetch';
import applyTheme from '@/client/applyTheme';
import useAutoSave from '@/client/useAutoSave';
import Avatar from '@/component/layout/Avatar';
import Button from '@/component/ui/Button';
import Card from '@/component/ui/Card';
import FormField from '@/component/ui/FormField';
import inputClass from '@/component/ui/inputClass';
import SaveIndicator from '@/component/ui/SaveIndicator';
import useI18n from '@/i18n/useI18n';

type Profile = { avatarFileId: string | null; avatarUrl: string | null; email: string; locale: string; name: string; theme: string; timezone: string };
type Field = 'avatarFileId' | 'email' | 'locale' | 'name' | 'theme' | 'timezone';

/**
 * Own profile: name, e-mail, picture (or Gravatar), language, time zone and theme. Every change is
 * saved immediately – choices on change, typed values when the field loses focus.
 */
export default function ProfileForm({gravatarEnabled, profile}: { gravatarEnabled: boolean; profile: Profile }) {
    const {t} = useI18n();
    const router = useRouter();
    const upload = useRef<HTMLInputElement>(null);
    const [form, setForm] = useState(profile);
    const saved = useRef<Record<string, unknown>>({...profile});

    const save = useCallback(async (changes: Record<string, unknown>) => {
        const updated = await apiFetch<Profile>('/api/v1/profile', {body: changes, method: 'PATCH'});
        if ('avatarFileId' in changes) {
            setForm((current) => ({...current, avatarFileId: updated.avatarFileId, avatarUrl: updated.avatarUrl}));
        }
        router.refresh();
    }, [router]);
    const {saveField, states} = useAutoSave(save, t('common.error'));

    const commit = async (name: Field, value: unknown) => {
        if (saved.current[name] === value) {
            return;
        }
        saved.current[name] = value;
        if (!(await saveField(name, value))) {
            delete saved.current[name];
        }
    };

    const text = (name: 'email' | 'name' | 'timezone') => ({
        className: `${inputClass} ${states[name]?.status === 'error' ? 'border-negative' : ''}`,
        onBlur:    () => void commit(name, form[name]),
        onChange:  (event: { target: { value: string } }) => setForm({...form, [name]: event.target.value}),
        onKeyDown: (event: { currentTarget: HTMLInputElement; key: string }) => {
            if (event.key === 'Enter') {
                event.currentTarget.blur();
            }
        },
        value:     form[name],
    });
    const field = (name: Field, label: string, children: ReactNode, required = false) => (
        <FormField label={label} htmlFor={`profile-${name}`} required={required} status={<SaveIndicator state={states[name]}/>}
                   error={states[name]?.status === 'error' ? states[name].message : undefined}>
            {children}
        </FormField>
    );

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
                        await commit('avatarFileId', stored.id);
                        event.target.value = '';
                    }}/>
                    <div className="flex flex-wrap justify-center gap-2">
                        <Button size="sm" icon={<IconUpload size={16} stroke={1.75}/>} onClick={() => upload.current?.click()}>{t('profile.uploadPicture')}</Button>
                        {form.avatarFileId !== null ? <Button size="sm" variant="ghost" icon={<IconTrash size={16} stroke={1.75}/>} onClick={() => commit('avatarFileId', null)} aria-label={t('common.remove')}/> : null}
                    </div>
                    <SaveIndicator state={states.avatarFileId}/>
                    {states.avatarFileId?.status === 'error' ? <p className="text-center text-sm text-negative">{states.avatarFileId.message}</p> : null}
                    <p className="text-center text-xs text-text-muted">{gravatarEnabled ? t('profile.gravatarHint') : t('profile.noGravatarHint')}</p>
                </div>
                <div className="flex flex-1 flex-col gap-4">
                    <p className="flex items-center gap-2 text-sm text-text-muted">
                        <IconCloudCheck size={18} stroke={1.75}/>{t('common.autoSaveHint')}
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {field('name', t('users.name'), <input id="profile-name" autoComplete="name" {...text('name')}/>, true)}
                        {field('email', t('users.email'), <input id="profile-email" type="email" autoComplete="email" {...text('email')}/>, true)}
                        {field('locale', t('profile.language'), (
                            <select id="profile-locale" className={inputClass} value={form.locale} onChange={(event) => {
                                setForm({...form, locale: event.target.value});
                                void commit('locale', event.target.value);
                            }}>
                                <option value="de">Deutsch</option>
                                <option value="en">English</option>
                            </select>
                        ))}
                        {field('theme', t('profile.theme'), (
                            <select id="profile-theme" className={inputClass} value={form.theme} onChange={(event) => {
                                setForm({...form, theme: event.target.value});
                                applyTheme(event.target.value);
                                void commit('theme', event.target.value);
                            }}>
                                <option value="system">{t('profile.theme.system')}</option>
                                <option value="light">{t('profile.theme.light')}</option>
                                <option value="dark">{t('profile.theme.dark')}</option>
                            </select>
                        ))}
                        {field('timezone', t('profile.timezone'), (
                            <>
                                <input id="profile-timezone" list="timezones" {...text('timezone')}/>
                                <datalist id="timezones">
                                    {Intl.supportedValuesOf('timeZone').map((zone) => <option key={zone} value={zone}>{zone}</option>)}
                                </datalist>
                            </>
                        ))}
                    </div>
                </div>
            </div>
        </Card>
    );
}
