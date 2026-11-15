'use client';

import {IconPlus, IconTrash} from '@tabler/icons-react';
import {useCallback, useEffect, useState} from 'react';
import apiFetch from '@/client/apiFetch';
import ApiClientError from '@/client/ApiClientError';
import Avatar from '@/component/layout/Avatar';
import Button from '@/component/ui/Button';
import Card from '@/component/ui/Card';
import ConfirmButton from '@/component/ui/ConfirmButton';
import Dialog from '@/component/ui/Dialog';
import FormField from '@/component/ui/FormField';
import inputClass from '@/component/ui/inputClass';
import Notice from '@/component/ui/Notice';
import PageHeader from '@/component/ui/PageHeader';
import Pill from '@/component/ui/Pill';
import Skeleton from '@/component/ui/Skeleton';
import useI18n from '@/i18n/useI18n';

type User = { active: boolean; avatarUrl: string | null; email: string; id: string; lastLoginAt: string | null; name: string; role: string };

/**
 * User management of the tenant (admins only): create, edit, deactivate, delete.
 */
export default function UsersAdmin({currentUserId, mailEnabled}: { currentUserId: string; mailEnabled: boolean }) {
    const {date, t} = useI18n();
    const [users, setUsers] = useState<User[] | null>(null);
    const [editing, setEditing] = useState<User | 'new' | null>(null);
    const [form, setForm] = useState({active: true, email: '', locale: 'de', name: '', password: '', role: 'user'});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        setUsers((await apiFetch<{ items: User[] }>('/api/v1/users')).items);
    }, []);

    useEffect(() => {
        let active = true;
        apiFetch<{ items: User[] }>('/api/v1/users').then((result) => {
            if (active) {
                setUsers(result.items);
            }
        }).catch(() => undefined);
        return () => {
            active = false;
        };
    }, []);

    const open = (user: User | 'new') => {
        setErrors({});
        setError(null);
        setForm(user === 'new'
                ? {active: true, email: '', locale: 'de', name: '', password: '', role: 'user'}
                : {active: user.active, email: user.email, locale: 'de', name: user.name, password: '', role: user.role});
        setEditing(user);
    };

    const save = async () => {
        setSaving(true);
        setErrors({});
        setError(null);
        try {
            if (editing === 'new') {
                await apiFetch('/api/v1/users', {body: {email: form.email, locale: form.locale, name: form.name, password: form.password, role: form.role}});
            }
            else if (editing !== null) {
                await apiFetch(`/api/v1/users/${editing.id}`, {
                    body:   {active: form.active, email: form.email, name: form.name, password: form.password === '' ? undefined : form.password, role: form.role},
                    method: 'PATCH',
                });
            }
            setEditing(null);
            await load();
        }
        catch (exception) {
            if (exception instanceof ApiClientError) {
                setErrors(exception.fieldErrors);
                setError(exception.message);
            }
        }
        finally {
            setSaving(false);
        }
    };

    return (
        <>
            <PageHeader eyebrow={t('nav.group.admin')} title={t('nav.users')} description={t('users.description')}
                        actions={<Button variant="primary" icon={<IconPlus size={18} stroke={1.75}/>} onClick={() => open('new')}>{t('users.new')}</Button>}/>
            <Card>
                {users === null ? <Skeleton className="h-24 w-full"/> : (
                    <ul className="divide-y divide-line">
                        {users.map((user) => (
                            <li key={user.id}>
                                <button type="button" onClick={() => open(user)} className="flex w-full flex-wrap items-center gap-3 rounded-lg px-2 py-3 text-left transition hover:bg-surface-2/60">
                                    <Avatar name={user.name} url={user.avatarUrl}/>
                                    <span className="min-w-0 flex-1">
                                        <span className="block font-semibold">{user.name}{user.id === currentUserId ? ` (${t('users.you')})` : ''}</span>
                                        <span className="block truncate text-sm text-text-muted">{user.email}</span>
                                    </span>
                                    <Pill tone={user.role === 'admin' ? 'accent' : 'neutral'}>{t(user.role === 'admin' ? 'users.role.admin' : 'users.role.user')}</Pill>
                                    {!user.active ? <Pill tone="warning">{t('users.inactive')}</Pill> : null}
                                    <span className="w-full text-xs text-text-muted sm:w-auto">{t('users.lastLogin', {date: date(user.lastLoginAt, true)})}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>

            <Dialog
                open={editing !== null}
                onClose={() => setEditing(null)}
                title={editing === 'new' ? t('users.new') : t('users.edit')}
                footer={(
                    <>
                        {editing !== null && editing !== 'new' && editing.id !== currentUserId ? (
                            <div className="mr-auto">
                                <ConfirmButton variant="danger" icon={<IconTrash size={18} stroke={1.75}/>} title={t('users.deleteTitle')} message={t('users.deleteMessage')} confirmLabel={t('common.delete')}
                                               onConfirm={async () => {
                                                   try {
                                                       await apiFetch(`/api/v1/users/${editing.id}`, {method: 'DELETE'});
                                                       setEditing(null);
                                                       await load();
                                                   }
                                                   catch (exception) {
                                                       setError(exception instanceof ApiClientError ? exception.message : t('common.error'));
                                                   }
                                               }}>
                                    {t('common.delete')}
                                </ConfirmButton>
                            </div>
                        ) : null}
                        <Button variant="ghost" onClick={() => setEditing(null)}>{t('common.cancel')}</Button>
                        <Button variant="primary" loading={saving} onClick={save}>{t('common.save')}</Button>
                    </>
                )}
            >
                <div className="flex flex-col gap-4">
                    {error !== null ? <Notice tone="error">{error}</Notice> : null}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormField label={t('users.name')} htmlFor="user-name" required error={errors.name}>
                            <input id="user-name" className={inputClass} value={form.name} onChange={(event) => setForm({...form, name: event.target.value})}/>
                        </FormField>
                        <FormField label={t('users.email')} htmlFor="user-email" required error={errors.email}>
                            <input id="user-email" type="email" className={inputClass} value={form.email} onChange={(event) => setForm({...form, email: event.target.value})}/>
                        </FormField>
                        <FormField label={t('users.role')} htmlFor="user-role">
                            <select id="user-role" className={inputClass} value={form.role} onChange={(event) => setForm({...form, role: event.target.value})}>
                                <option value="user">{t('users.role.user')}</option>
                                <option value="admin">{t('users.role.admin')}</option>
                            </select>
                        </FormField>
                        {editing === 'new' ? (
                            <FormField label={t('profile.language')} htmlFor="user-locale">
                                <select id="user-locale" className={inputClass} value={form.locale} onChange={(event) => setForm({...form, locale: event.target.value})}>
                                    <option value="de">Deutsch</option>
                                    <option value="en">English</option>
                                </select>
                            </FormField>
                        ) : (
                            <FormField label={t('users.status')} htmlFor="user-active">
                                <select id="user-active" className={inputClass} value={form.active ? '1' : '0'} onChange={(event) => setForm({...form, active: event.target.value === '1'})}>
                                    <option value="1">{t('users.active')}</option>
                                    <option value="0">{t('users.inactive')}</option>
                                </select>
                            </FormField>
                        )}
                        <FormField label={editing === 'new' ? t('users.password') : t('users.newPassword')} htmlFor="user-password" required={editing === 'new'} error={errors.password}
                                   hint={editing === 'new' ? t('users.passwordHint') : t('users.newPasswordHint')} className="sm:col-span-2">
                            <input id="user-password" type="password" autoComplete="new-password" className={inputClass} value={form.password} onChange={(event) => setForm({...form, password: event.target.value})}/>
                        </FormField>
                    </div>
                    {!mailEnabled ? <p className="text-xs text-text-muted">{t('users.noMailHint')}</p> : null}
                </div>
            </Dialog>
        </>
    );
}
