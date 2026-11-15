'use client';

import {IconArrowLeft, IconArrowRight, IconCheck} from '@tabler/icons-react';
import {useRouter} from 'next/navigation';
import {useState} from 'react';
import apiFetch from '@/client/apiFetch';
import ApiClientError from '@/client/ApiClientError';
import loadLookup from '@/client/loadLookup';
import FieldInput from '@/component/entity/FieldInput';
import RowListEditor from '@/component/entity/RowListEditor';
import Button from '@/component/ui/Button';
import Card from '@/component/ui/Card';
import FormField from '@/component/ui/FormField';
import Notice from '@/component/ui/Notice';
import Stepper from '@/component/ui/Stepper';
import entities from '@/entity/entities';
import entityPath from '@/entity/entityPath';
import type EntityName from '@/entity/EntityName';
import type EntityRecord from '@/entity/EntityRecord';
import fromFormValue from '@/entity/fromFormValue';
import humanize from '@/entity/humanize';
import toFormValue from '@/entity/toFormValue';
import useI18n from '@/i18n/useI18n';

type Rows = Record<string, string>[];

const basics = ['name', 'channel', 'partnerId', 'status', 'language'];
const contact = ['contactName', 'email', 'phone', 'billingAddress', 'vatId', 'hourlyRate', 'hostingSummary', 'notes'];

function nextInvoiceDate(month: number): string {
    const now = new Date();
    const candidate = new Date(Date.UTC(now.getUTCFullYear(), month - 1, 1));
    if (candidate <= now) {
        candidate.setUTCFullYear(candidate.getUTCFullYear() + 1);
    }
    return candidate.toISOString().slice(0, 10);
}

function toPayload(entity: EntityName, row: Record<string, string>): Record<string, unknown> {
    const payload: Record<string, unknown> = {};
    for (const field of entities[entity].fields) {
        if (row[field.name] !== undefined && field.readOnly !== true) {
            payload[field.name] = fromFormValue(field, row[field.name]);
        }
    }
    return payload;
}

/**
 * Step-by-step creation of a customer with everything that belongs to it: contact and billing data,
 * recurring charges, resources, fixed costs and offers. Everything is saved at the end.
 */
export default function CustomerWizard({defaultHostingPerYear, onDone, recurringInvoiceMonth}: {
    defaultHostingPerYear: number;
    onDone?: (customer: EntityRecord) => void;
    recurringInvoiceMonth: number;
}) {
    const {t, td} = useI18n();
    const router = useRouter();
    const definition = entities.customers;
    const [step, setStep] = useState(0);
    const [customer, setCustomer] = useState<Record<string, string>>(() => Object.fromEntries(definition.fields.map((field) => [field.name, toFormValue(field, field.default)])));
    const [charges, setCharges] = useState<Rows>([]);
    const [resources, setResources] = useState<Rows>([]);
    const [costs, setCosts] = useState<Rows>([]);
    const [offers, setOffers] = useState<Rows>([]);
    const [newPartner, setNewPartner] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [created, setCreated] = useState<EntityRecord | null>(null);

    const steps = [t('wizard.customer.basics'), t('wizard.customer.contact'), t('wizard.customer.charges'), t('wizard.customer.resources'), t('wizard.customer.costs'), t('wizard.customer.offers')];

    const renderFields = (names: string[]) => (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {names.map((name) => definition.fields.find((field) => field.name === name)!)
                  .filter((field) => field.visibleWhen === undefined || field.visibleWhen.values.includes(customer[field.visibleWhen.field]))
                  .map((field) => (
                      <FormField
                          key={field.name}
                          htmlFor={`customer-${field.name}`}
                          label={td(`field.customers.${field.name}`, humanize(field.name))}
                          required={field.required === true}
                          error={errors[field.name]}
                          className={field.type === 'text' ? 'sm:col-span-full' : ''}
                      >
                          <FieldInput
                              entity="customers"
                              field={field}
                              id={`customer-${field.name}`}
                              value={customer[field.name] ?? ''}
                              invalid={errors[field.name] !== undefined}
                              onChange={(value) => setCustomer((current) => ({...current, [field.name]: value}))}
                          />
                      </FormField>
                  ))}
            {customer.channel === 'partner' ? (
                <FormField htmlFor="customer-new-partner" label={t('wizard.customer.newPartner')} hint={t('wizard.customer.newPartnerHint')}>
                    <input id="customer-new-partner" className="w-full rounded-lg border border-line bg-surface px-3 py-2" value={newPartner} onChange={(event) => setNewPartner(event.target.value)}/>
                </FormField>
            ) : null}
        </div>
    );

    const validateBasics = (): boolean => {
        const next: Record<string, string> = {};
        if (customer.name.trim() === '') {
            next.name = t('validation.required');
        }
        if (customer.channel === 'partner' && customer.partnerId === '' && newPartner.trim() === '') {
            next.partnerId = t('wizard.customer.partnerRequired');
        }
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const save = async () => {
        setSaving(true);
        setError(null);
        try {
            let record = created;
            if (record === null) {
                const payload = toPayload('customers', customer);
                if (customer.channel === 'partner' && customer.partnerId === '' && newPartner.trim() !== '') {
                    const partner = await apiFetch<EntityRecord>('/api/v1/partners', {body: {name: newPartner.trim()}});
                    payload.partnerId = partner.id;
                    await loadLookup('partners', true);
                }
                record = await apiFetch<EntityRecord>('/api/v1/customers', {body: payload});
                setCreated(record);
            }
            // rows are removed once saved, so a retry after an error never creates duplicates
            const children: [EntityName, Rows, (rows: Rows) => void, string][] = [
                ['recurringCharges', charges, setCharges, 'customerId'],
                ['resources', resources, setResources, 'customerId'],
                ['recurringCosts', costs, setCosts, 'assignedTo'],
                ['offers', offers, setOffers, 'customerId'],
            ];
            for (const [entity, rows, setRows, field] of children) {
                let remaining = [...rows];
                for (const row of rows) {
                    await apiFetch(`/api/v1/${entityPath(entity)}`, {body: {...toPayload(entity, row), [field]: record.id}});
                    remaining = remaining.slice(1);
                    setRows(remaining);
                }
            }
            await loadLookup('customers', true);
            if (onDone !== undefined) {
                onDone(record);
            }
            else {
                router.push(`/customers/${record.id}`);
                router.refresh();
            }
        }
        catch (exception) {
            if (exception instanceof ApiClientError) {
                setError(exception.message);
                setErrors(exception.fieldErrors);
            }
            else {
                setError(t('common.error'));
            }
        }
        finally {
            setSaving(false);
        }
    };

    const content = [
        renderFields(basics),
        renderFields(contact),
        <RowListEditor
            key="charges"
            entity="recurringCharges"
            fieldNames={['service', 'description', 'amountPerYear', 'interval', 'nextInvoiceDate', 'startsAfterSetup']}
            rows={charges}
            onChange={setCharges}
            addLabel={t('wizard.customer.addCharge')}
            newRow={() => ({
                amountPerYear:    String(charges.length === 0 ? defaultHostingPerYear : ''),
                description:      '',
                interval:         'yearly',
                nextInvoiceDate:  nextInvoiceDate(recurringInvoiceMonth),
                service:          charges.length === 0 ? 'hosting' : 'domain',
                startsAfterSetup: 'false',
            })}
        />,
        <RowListEditor
            key="resources"
            entity="resources"
            fieldNames={['kind', 'name', 'location']}
            rows={resources}
            onChange={setResources}
            addLabel={t('wizard.customer.addResource')}
            newRow={() => ({kind: 'domain', location: '', name: ''})}
        />,
        <RowListEditor
            key="costs"
            entity="recurringCosts"
            fieldNames={['name', 'type', 'provider', 'costPerYear', 'rebilledPerYear', 'nextRenewal']}
            rows={costs}
            onChange={setCosts}
            addLabel={t('wizard.customer.addCost')}
            newRow={() => ({autoRenew: 'true', costPerYear: '', name: '', nextRenewal: '', provider: '', rebilledPerYear: '0', type: 'domain'})}
        />,
        <RowListEditor
            key="offers"
            entity="offers"
            fieldNames={['number', 'date', 'validUntil', 'amount', 'status', 'fileId']}
            rows={offers}
            onChange={setOffers}
            addLabel={t('wizard.customer.addOffer')}
            newRow={() => ({amount: '', date: new Date().toISOString().slice(0, 10), fileId: '', number: '', status: 'open', validUntil: ''})}
        />,
    ];

    const last = step === steps.length - 1;

    return (
        <Card>
            <Stepper steps={steps} current={step}/>
            <div key={step} className="animate-rise">
                <h2 className="mb-1 text-xl font-semibold">{steps[step]}</h2>
                <p className="mb-4 text-sm text-text-muted">{t(`wizard.customer.hint${step}` as 'wizard.customer.hint0')}</p>
                {content[step]}
            </div>
            {error !== null ? <div className="mt-4"><Notice tone="error">{error}</Notice></div> : null}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
                <Button variant="ghost" icon={<IconArrowLeft size={18} stroke={1.75}/>} disabled={step === 0} onClick={() => setStep(step - 1)}>{t('common.back')}</Button>
                <div className="flex flex-wrap gap-2">
                    {step > 0 && !last ? <Button onClick={save} loading={saving}>{t('wizard.saveNow')}</Button> : null}
                    {last ? (
                        <Button variant="primary" icon={<IconCheck size={18} stroke={2}/>} loading={saving} onClick={save}>{t('wizard.customer.finish')}</Button>
                    ) : (
                        <Button
                            variant="primary"
                            icon={<IconArrowRight size={18} stroke={1.75}/>}
                            onClick={() => {
                                if (step === 0 && !validateBasics()) {
                                    return;
                                }
                                setStep(step + 1);
                            }}
                        >
                            {t('common.next')}
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    );
}
