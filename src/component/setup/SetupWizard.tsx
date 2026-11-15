'use client';

import {IconArrowLeft, IconArrowRight, IconCheck, IconDatabase, IconPlus} from '@tabler/icons-react';
import {useState} from 'react';
import apiFetch from '@/client/apiFetch';
import ApiClientError from '@/client/ApiClientError';
import CustomerWizard from '@/component/customer/CustomerWizard';
import FieldInput from '@/component/entity/FieldInput';
import Button from '@/component/ui/Button';
import Card from '@/component/ui/Card';
import FormField from '@/component/ui/FormField';
import inputClass from '@/component/ui/inputClass';
import Notice from '@/component/ui/Notice';
import Stepper from '@/component/ui/Stepper';
import entities from '@/entity/entities';
import type EntityName from '@/entity/EntityName';
import type FieldDefinition from '@/entity/FieldDefinition';
import fromFormValue from '@/entity/fromFormValue';
import humanize from '@/entity/humanize';
import settingsFields from '@/entity/settingsFields';
import toFormValue from '@/entity/toFormValue';
import useI18n from '@/i18n/useI18n';
import isStrongPassword from '@/validation/isStrongPassword';

const companyFields = ['companyName', 'address', 'email', 'phone', 'website', 'vatMode', 'defaultVatRate', 'taxNumber', 'vatId', 'currency', 'locale', 'invoiceNumberFormat', 'iban', 'bic', 'bankName'];
const templateFields = ['senderLine', 'introText', 'closingText', 'accentColor', 'paymentTermDays', 'logoFileId'];

/**
 * First start: setup token → database check → admin → company → invoice template → (optional)
 * first customers. The database itself is configured in the environment; the wizard only checks it.
 */
export default function SetupWizard({database}: { database: { driver: string; error: string | null; ok: boolean } }) {
    const {locale, t, td} = useI18n();
    const [step, setStep] = useState(0);
    const [token, setToken] = useState('');
    const [admin, setAdmin] = useState({email: '', name: '', password: '', password2: ''});
    const [company, setCompany] = useState<Record<string, string>>(() => Object.fromEntries(settingsFields.map((field) => [field.name, toFormValue(field, field.default)])));
    const templateDefinition = entities.invoiceTemplates;
    const [template, setTemplate] = useState<Record<string, string>>(() => Object.fromEntries(templateDefinition.fields.map((field) => [field.name, toFormValue(field, field.default)])));
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [customers, setCustomers] = useState<string[]>([]);
    const [addingCustomer, setAddingCustomer] = useState(true);

    const steps = [t('setup.step.token'), t('setup.step.database'), t('setup.step.admin'), t('setup.step.company'), t('setup.step.template'), t('setup.step.customers')];

    const renderFields = (entity: EntityName | 'settings', fields: readonly FieldDefinition[], names: string[], values: Record<string, string>, onChange: (name: string, value: string) => void) => (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {names.map((name) => fields.find((field) => field.name === name)!).map((field) => (
                <FormField key={field.name} htmlFor={`setup-${field.name}`} label={td(`field.${entity}.${field.name}`, humanize(field.name))} error={errors[field.name]}
                           className={field.type === 'text' ? 'sm:col-span-full' : ''} hint={td(`hint.${entity}.${field.name}`, '') || undefined}>
                    <FieldInput entity={entity} field={field} id={`setup-${field.name}`} value={values[field.name] ?? ''} invalid={errors[field.name] !== undefined} onChange={(value) => onChange(field.name, value)}/>
                </FormField>
            ))}
        </div>
    );

    const run = async (work: () => Promise<void>) => {
        setBusy(true);
        setError(null);
        setErrors({});
        try {
            await work();
        }
        catch (exception) {
            if (exception instanceof ApiClientError) {
                setError(exception.message);
                setErrors(Object.fromEntries(Object.entries(exception.fieldErrors).map(([key, value]) => [key.split('.').pop()!, value])));
            }
            else {
                setError(t('common.error'));
            }
        }
        finally {
            setBusy(false);
        }
    };

    const next = () => {
        if (step === 0) {
            void run(async () => {
                await apiFetch('/api/setup', {body: {action: 'verify', token}});
                setStep(1);
            });
        }
        else if (step === 2) {
            const found: Record<string, string> = {};
            if (admin.name.trim() === '') {
                found.name = t('validation.required');
            }
            if (!admin.email.includes('@')) {
                found.email = t('validation.email');
            }
            if (!isStrongPassword(admin.password)) {
                found.password = t('users.passwordHint');
            }
            if (admin.password !== admin.password2) {
                found.password2 = t('setup.passwordMismatch');
            }
            setErrors(found);
            if (Object.keys(found).length === 0) {
                setCompany((current) => ({...current, companyName: current.companyName || '', email: current.email || admin.email, name: current.name || admin.name}));
                setStep(3);
            }
        }
        else if (step === 4) {
            void run(async () => {
                const settings: Record<string, unknown> = {};
                for (const field of settingsFields) {
                    const value = fromFormValue(field, company[field.name] ?? '');
                    if (value !== null) {
                        settings[field.name] = value;
                    }
                }
                settings.name = company.companyName || admin.name;
                settings.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                const templateData: Record<string, unknown> = {};
                for (const field of templateDefinition.fields) {
                    if (templateFields.includes(field.name)) {
                        templateData[field.name] = fromFormValue(field, template[field.name] ?? '');
                    }
                }
                await apiFetch('/api/setup', {
                    body: {
                        action:   'complete',
                        admin:    {email: admin.email, locale, name: admin.name, password: admin.password, timezone: settings.timezone},
                        settings,
                        template: templateData,
                        token,
                    },
                });
                setStep(5);
            });
        }
        else {
            setStep(step + 1);
        }
    };

    return (
        <Card>
            <Stepper steps={steps} current={step}/>
            <div key={step} className="animate-rise">
                <h2 className="mb-1 text-2xl font-semibold">{steps[step]}</h2>
                <p className="mb-5 text-text-soft">{t(`setup.hint${step}` as 'setup.hint0')}</p>
                {error !== null ? <div className="mb-4"><Notice tone="error">{error}</Notice></div> : null}

                {step === 0 ? (
                    <FormField label={t('setup.token')} htmlFor="setup-token" hint={t('setup.tokenHint')}>
                        <input id="setup-token" className={`${inputClass} font-mono`} autoComplete="off" value={token} onChange={(event) => setToken(event.target.value)}/>
                    </FormField>
                ) : null}

                {step === 1 ? (
                    <div className="flex items-start gap-3 rounded-lg border border-line bg-surface-2/50 p-4">
                        <IconDatabase size={28} stroke={1.5} className="shrink-0 text-accent"/>
                        <div className="flex flex-col gap-2">
                            <p><strong>{t('setup.driver')}:</strong> {database.driver}</p>
                            {database.ok ? <Notice tone="success">{t('setup.databaseOk')}</Notice> : <Notice tone="error">{t('setup.databaseError', {error: database.error ?? ''})}</Notice>}
                            <p className="text-sm text-text-muted">{t('setup.databaseEnv')}</p>
                        </div>
                    </div>
                ) : null}

                {step === 2 ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormField label={t('users.name')} htmlFor="setup-admin-name" error={errors.name} required>
                            <input id="setup-admin-name" className={inputClass} autoComplete="name" value={admin.name} onChange={(event) => setAdmin({...admin, name: event.target.value})}/>
                        </FormField>
                        <FormField label={t('users.email')} htmlFor="setup-admin-email" error={errors.email} required>
                            <input id="setup-admin-email" type="email" className={inputClass} autoComplete="username" value={admin.email} onChange={(event) => setAdmin({...admin, email: event.target.value})}/>
                        </FormField>
                        <FormField label={t('users.password')} htmlFor="setup-admin-password" error={errors.password} hint={t('users.passwordHint')} required>
                            <input id="setup-admin-password" type="password" className={inputClass} autoComplete="new-password" value={admin.password} onChange={(event) => setAdmin({...admin, password: event.target.value})}/>
                        </FormField>
                        <FormField label={t('setup.passwordRepeat')} htmlFor="setup-admin-password2" error={errors.password2} required>
                            <input id="setup-admin-password2" type="password" className={inputClass} autoComplete="new-password" value={admin.password2} onChange={(event) => setAdmin({...admin, password2: event.target.value})}/>
                        </FormField>
                    </div>
                ) : null}

                {step === 3 ? renderFields('settings', settingsFields, companyFields, company, (name, value) => setCompany((current) => ({...current, [name]: value}))) : null}

                {step === 4 ? renderFields('invoiceTemplates', templateDefinition.fields, templateFields, template, (name, value) => setTemplate((current) => ({...current, [name]: value}))) : null}

                {step === 5 ? (
                    <div className="flex flex-col gap-4">
                        <Notice tone="success">{t('setup.done')}</Notice>
                        {customers.length > 0 ? <p className="text-sm text-text-soft">{t('setup.customersCreated', {names: customers.join(', ')})}</p> : null}
                        {addingCustomer ? (
                            <CustomerWizard
                                defaultHostingPerYear={Number(company.defaultHostingPerYear || 60)}
                                recurringInvoiceMonth={Number(company.recurringInvoiceMonth || 1)}
                                onDone={(customer) => {
                                    setCustomers((current) => [...current, String(customer.name)]);
                                    setAddingCustomer(false);
                                }}
                            />
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                <Button icon={<IconPlus size={18} stroke={1.75}/>} onClick={() => setAddingCustomer(true)}>{t('setup.anotherCustomer')}</Button>
                                <Button variant="primary" icon={<IconCheck size={18} stroke={2}/>} onClick={() => {
                                    window.location.href = '/';
                                }}>{t('setup.toDashboard')}</Button>
                            </div>
                        )}
                    </div>
                ) : null}
            </div>

            {step < 5 ? (
                <div className="mt-6 flex items-center justify-between gap-2 border-t border-line pt-4">
                    <Button variant="ghost" icon={<IconArrowLeft size={18} stroke={1.75}/>} disabled={step === 0} onClick={() => setStep(step - 1)}>{t('common.back')}</Button>
                    <Button variant="primary" icon={step === 4 ? <IconCheck size={18} stroke={2}/> : <IconArrowRight size={18} stroke={1.75}/>} loading={busy} disabled={step === 1 && !database.ok} onClick={next}>
                        {step === 4 ? t('setup.complete') : t('common.next')}
                    </Button>
                </div>
            ) : addingCustomer ? (
                <div className="mt-4 text-right">
                    <Button variant="ghost" onClick={() => {
                        window.location.href = '/';
                    }}>{t('setup.skipCustomers')}</Button>
                </div>
            ) : null}
        </Card>
    );
}
