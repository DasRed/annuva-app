'use client';

import {IconArchive, IconArchiveOff, IconFilePlus, IconPencil} from '@tabler/icons-react';
import {useRouter} from 'next/navigation';
import {useState} from 'react';
import apiFetch from '@/client/apiFetch';
import ApiClientError from '@/client/ApiClientError';
import loadLookup from '@/client/loadLookup';
import RatingPill from '@/component/dashboard/RatingPill';
import SignedMoney from '@/component/dashboard/SignedMoney';
import EntityForm from '@/component/entity/EntityForm';
import EntityManager from '@/component/entity/EntityManager';
import FieldValue from '@/component/entity/FieldValue';
import InvoiceList from '@/component/invoice/InvoiceList';
import Button from '@/component/ui/Button';
import Card from '@/component/ui/Card';
import ConfirmButton from '@/component/ui/ConfirmButton';
import Dialog from '@/component/ui/Dialog';
import Notice from '@/component/ui/Notice';
import PageHeader from '@/component/ui/PageHeader';
import Pill from '@/component/ui/Pill';
import type DashboardResult from '@/calculation/DashboardResult';
import entities from '@/entity/entities';
import type EntityName from '@/entity/EntityName';
import type EntityRecord from '@/entity/EntityRecord';
import humanize from '@/entity/humanize';
import useI18n from '@/i18n/useI18n';

const tabs: ('overview' | EntityName)[] = ['overview', 'invoices', 'offers', 'recurringCharges', 'resources', 'recurringCosts', 'expenses', 'tasks'];

/**
 * Everything about one customer: key figures, master data and all linked records in tabs.
 */
export default function CustomerDetailView({customer, rating}: { customer: EntityRecord; rating: DashboardResult['customers'][number] | null }) {
    const {date, money, t, td} = useI18n();
    const router = useRouter();
    const [tab, setTab] = useState<(typeof tabs)[number]>('overview');
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const archived = customer.archivedAt !== null;
    const definition = entities.customers;

    const archive = async (value: boolean) => {
        setError(null);
        try {
            await apiFetch(`/api/v1/customers/${customer.id}/archive`, {method: value ? 'POST' : 'DELETE'});
            await loadLookup('customers', true);
            router.refresh();
        }
        catch (exception) {
            setError(exception instanceof ApiClientError ? exception.message : t('common.error'));
        }
    };

    return (
        <>
            <PageHeader
                eyebrow={t('nav.customers')}
                title={<span className="flex flex-wrap items-center gap-3">{String(customer.name)}{rating !== null ? <RatingPill rating={rating.rating}/> : null}{archived ? <Pill>{t('customer.archived')}</Pill> : null}</span>}
                description={`${td(`enum.customers.channel.${String(customer.channel)}`)} · ${td(`enum.customers.status.${String(customer.status)}`)}${archived ? ` · ${t('customer.archivedAt', {date: date(String(customer.archivedAt))})}` : ''}`}
                actions={(
                    <>
                        <Button icon={<IconPencil size={18} stroke={1.75}/>} onClick={() => setEditing(true)}>{t('common.edit')}</Button>
                        {archived
                         ? <Button icon={<IconArchiveOff size={18} stroke={1.75}/>} onClick={() => archive(false)}>{t('customer.unarchive')}</Button>
                         : <ConfirmButton icon={<IconArchive size={18} stroke={1.75}/>} title={t('customer.archiveTitle')} message={t('customer.archiveMessage')} confirmLabel={t('customer.archive')} onConfirm={() => archive(true)}>{t('customer.archive')}</ConfirmButton>}
                        {!archived ? <Button variant="primary" href={`/invoices/new?customerId=${customer.id}`} icon={<IconFilePlus size={18} stroke={1.75}/>}>{t('invoice.new')}</Button> : null}
                    </>
                )}
            />

            {error !== null ? <div className="mb-4"><Notice tone="error">{error}</Notice></div> : null}

            {rating !== null ? (
                <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
                    {[
                        [t('dashboard.revenue'), money(rating.revenue)],
                        [t('dashboard.costs'), money(rating.costs)],
                        [t('dashboard.result'), <SignedMoney key="result" cents={rating.result}/>],
                        [t('dashboard.recurringPerYear'), money(rating.recurringPerYear)],
                        [t('dashboard.domainsPackagesPerYear'), money(rating.domainsPackagesPerYear)],
                        [t('dashboard.serverShare'), money(rating.serverShare)],
                        [t('dashboard.surplus'), <SignedMoney key="surplus" cents={rating.surplus}/>],
                    ].map(([label, value], index) => (
                        <div key={String(label)} className="animate-rise rounded-xl border border-line bg-surface p-3 shadow-card" style={{animationDelay: `${index * 30}ms`}}>
                            <p className="text-xs font-semibold tracking-wide text-text-muted uppercase">{label}</p>
                            <p className="mt-1 font-serif text-xl font-semibold tabular">{value}</p>
                        </div>
                    ))}
                </div>
            ) : null}

            <div className="mb-4 flex gap-1 overflow-x-auto border-b border-line" role="tablist">
                {tabs.map((value) => (
                    <button
                        key={value}
                        type="button"
                        role="tab"
                        aria-selected={tab === value}
                        onClick={() => setTab(value)}
                        className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap transition ${tab === value ? 'border-accent text-accent' : 'border-transparent text-text-soft hover:text-text'}`}
                    >
                        {value === 'overview' ? t('customer.tab.overview') : td(`entity.${value}.plural`, value)}
                    </button>
                ))}
            </div>

            <div key={tab} className="animate-fade">
                {tab === 'overview' ? (
                    <Card>
                        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                            {definition.fields.filter((field) => field.name !== 'name' && field.name !== 'archivedAt').map((field) => (
                                <div key={field.name} className={field.type === 'text' ? 'sm:col-span-2' : ''}>
                                    <dt className="text-xs font-semibold tracking-wide text-text-muted uppercase">{td(`field.customers.${field.name}`, humanize(field.name))}</dt>
                                    <dd className="mt-0.5 whitespace-pre-line"><FieldValue entity="customers" field={field} value={customer[field.name]}/></dd>
                                </div>
                            ))}
                        </dl>
                    </Card>
                ) : tab === 'invoices' ? (
                    <Card><InvoiceList customerId={customer.id}/></Card>
                ) : (
                    <Card><EntityManager entity={tab} customerId={customer.id} onChanged={() => router.refresh()}/></Card>
                )}
            </div>

            <Dialog
                open={editing}
                onClose={() => setEditing(false)}
                size="lg"
                title={t('common.editEntity', {entity: td('entity.customers.singular')})}
                footer={(
                    <>
                        <Button variant="ghost" onClick={() => setEditing(false)}>{t('common.cancel')}</Button>
                        <Button variant="primary" type="submit" form="customer-edit" loading={saving}>{t('common.save')}</Button>
                    </>
                )}
            >
                {editing ? (
                    <EntityForm
                        entity="customers"
                        fields={definition.fields}
                        formId="customer-edit"
                        initial={customer}
                        onSubmit={async (data) => {
                            setSaving(true);
                            try {
                                await apiFetch(`/api/v1/customers/${customer.id}`, {body: data, method: 'PATCH'});
                                await loadLookup('customers', true);
                                setEditing(false);
                                router.refresh();
                            }
                            finally {
                                setSaving(false);
                            }
                        }}
                    />
                ) : null}
            </Dialog>
        </>
    );
}
