'use client';

import {IconPlus} from '@tabler/icons-react';
import {usePathname, useRouter} from 'next/navigation';
import {useTransition} from 'react';
import CashflowChart from '@/component/dashboard/CashflowChart';
import CostAssignmentChart from '@/component/dashboard/CostAssignmentChart';
import CustomerRatingTable from '@/component/dashboard/CustomerRatingTable';
import CustomerResultChart from '@/component/dashboard/CustomerResultChart';
import ExpensePivotTable from '@/component/dashboard/ExpensePivotTable';
import FilterBar from '@/component/dashboard/FilterBar';
import KpiTile from '@/component/dashboard/KpiTile';
import ResourceSection from '@/component/dashboard/ResourceSection';
import SignedMoney from '@/component/dashboard/SignedMoney';
import TaskTable from '@/component/dashboard/TaskTable';
import TaxTable from '@/component/dashboard/TaxTable';
import UpcomingTable from '@/component/dashboard/UpcomingTable';
import YearChart from '@/component/dashboard/YearChart';
import Button from '@/component/ui/Button';
import Card from '@/component/ui/Card';
import EmptyState from '@/component/ui/EmptyState';
import Notice from '@/component/ui/Notice';
import type DashboardResult from '@/calculation/DashboardResult';
import useI18n from '@/i18n/useI18n';

const sections = ['overview', 'years', 'cashflow', 'customers', 'costs', 'tax', 'upcoming', 'tasks', 'resources'] as const;

/**
 * The dashboard. Filters live in the URL (?year=&customer=), so views can be shared and bookmarked;
 * changing a filter re-renders on the server.
 */
export default function DashboardView({customers, data}: { customers: { id: string; name: string }[]; data: DashboardResult }) {
    const {money, t} = useI18n();
    const router = useRouter();
    const pathname = usePathname();
    const [pending, startTransition] = useTransition();
    const {customerId, year} = data.filter;
    const kpis = data.kpis;

    const setFilter = (filter: { customerId: string | null; year: number | null }) => {
        const params = new URLSearchParams();
        if (filter.year !== null) {
            params.set('year', String(filter.year));
        }
        if (filter.customerId !== null) {
            params.set('customer', filter.customerId);
        }
        startTransition(() => router.replace(params.size === 0 ? pathname : `${pathname}?${params.toString()}`, {scroll: false}));
    };
    const toggleYear = (value: number) => setFilter({customerId, year: year === value ? null : value});
    const toggleCustomer = (value: string) => setFilter({customerId: customerId === value ? null : value, year});

    const empty = data.years.every((row) => row.revenue === 0 && row.expenses === 0) && customers.length === 0;
    const business = data.customers.filter((row) => row.rating !== 'own_project');
    const own = data.customers.filter((row) => row.rating === 'own_project');
    const years = data.years.map((row) => row.year);

    return (
        <>
            <header className="animate-rise mb-4">
                <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-gold-ink uppercase">{t('nav.dashboard')}</p>
                <h1 className="text-3xl leading-tight font-semibold sm:text-4xl">{t('dashboard.title')}</h1>
                <p className="mt-2 max-w-4xl text-text-soft">
                    {t('dashboard.summary', {
                        expenses:  money(kpis.expenses),
                        fixed:     money(kpis.fixedCostsPerYear),
                        recurring: money(kpis.recurringPerYear),
                        revenue:   money(kpis.revenue),
                        year:      kpis.referenceYear,
                    })}
                </p>
                <nav className="mt-4 flex gap-1 overflow-x-auto pb-1 text-sm" aria-label={t('dashboard.sections')}>
                    {sections.map((section) => (
                        <a key={section} href={`#${section}`} className="rounded-full border border-line px-3 py-1 whitespace-nowrap text-text-soft transition hover:border-accent hover:text-accent">
                            {t(`dashboard.section.${section}`)}
                        </a>
                    ))}
                </nav>
            </header>

            <FilterBar customerId={customerId} customers={customers} onChange={setFilter} pending={pending} planYear={data.planYear} year={year} years={years}/>

            {empty ? (
                <Card className="mb-6">
                    <EmptyState action={<Button variant="primary" href="/customers/new" icon={<IconPlus size={18} stroke={1.75}/>}>{t('customer.new')}</Button>}>{t('dashboard.welcome')}</EmptyState>
                </Card>
            ) : null}

            <div className={`flex flex-col gap-6 transition-opacity ${pending ? 'opacity-60' : ''}`}>
                <section id="overview" className="scroll-mt-32">
                    <h2 className="sr-only">{t('dashboard.section.overview')}</h2>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3">
                        <KpiTile delay={0} label={t('dashboard.kpi.revenue', {year: kpis.referenceYear})} value={money(kpis.revenue)} formula={t('dashboard.formula.revenue')}
                                 sub={kpis.change === null ? undefined : t('dashboard.kpi.change', {value: `${kpis.change > 0 ? '+' : ''}${Math.round(kpis.change * 100)} %`})}/>
                        <KpiTile delay={30} label={t('dashboard.kpi.expenses')} value={money(kpis.expenses)} formula={t('dashboard.formula.expenses')}
                                 sub={kpis.expensesPlanned > 0 ? t('dashboard.kpi.ofWhichPlanned', {value: money(kpis.expensesPlanned)}) : undefined}/>
                        <KpiTile delay={60} label={t('dashboard.kpi.result')} value={<SignedMoney cents={kpis.result}/>} tone={kpis.result < 0 ? 'negative' : 'positive'} formula={t('dashboard.formula.result')}/>
                        <KpiTile delay={90} label={t('dashboard.kpi.tax')} value={kpis.tax === null ? '–' : money(kpis.tax)} formula={t('dashboard.formula.tax')}
                                 sub={customerId !== null ? t('dashboard.kpi.wholeBusiness') : (kpis.afterTax === null ? t('dashboard.kpi.noTaxRate') : t('dashboard.kpi.afterTax', {value: money(kpis.afterTax)}))}/>
                        <KpiTile delay={120} label={t('dashboard.kpi.sinceStart')} value={<SignedMoney cents={kpis.resultSinceStart}/>} formula={t('dashboard.formula.sinceStart')}/>
                        <KpiTile delay={150} label={t('dashboard.kpi.recurring')} value={money(kpis.recurringPerYear)} formula={t('dashboard.formula.recurring')} href="/recurring-charges"/>
                        <KpiTile delay={180} label={t('dashboard.kpi.fixedCosts')} value={money(kpis.fixedCostsPerYear)} formula={t('dashboard.formula.fixedCosts')} href="/recurring-costs"/>
                        <KpiTile delay={210} label={t('dashboard.kpi.serverCoverage')} value={<SignedMoney cents={kpis.serverCoverage}/>} tone={kpis.serverCoverage < 0 ? 'negative' : 'neutral'} formula={t('dashboard.formula.serverCoverage')}
                                 sub={customerId !== null ? t('dashboard.kpi.wholeBusiness') : undefined}/>
                        <KpiTile delay={240} label={t('dashboard.kpi.toIssue')} value={money(kpis.toIssueSum)} formula={t('dashboard.formula.toIssue')} href="/invoices?status=to_issue"
                                 sub={t('dashboard.kpi.count', {count: kpis.toIssueCount})}/>
                        <KpiTile delay={270} label={t('dashboard.kpi.tasks')} value={kpis.tasksOpen} formula={t('dashboard.formula.tasks')} href="/tasks"
                                 sub={t('dashboard.kpi.waiting', {count: kpis.tasksWaiting})}/>
                    </div>
                </section>

                <div className="grid gap-6 2xl:grid-cols-2">
                    <Card id="years" title={t('dashboard.section.years')} description={t('dashboard.yearsHint')}>
                        <YearChart years={data.years} selected={year} onSelect={toggleYear}/>
                    </Card>
                    <Card id="cashflow" title={t('dashboard.section.cashflow')} description={t('dashboard.cashflowHint')}>
                        {data.cashflow.length === 0 ? <EmptyState>{t('dashboard.noData')}</EmptyState> : <CashflowChart months={data.cashflow}/>}
                    </Card>
                </div>

                <Card id="customers" title={t('dashboard.section.customers')} description={t('dashboard.customersHint')}>
                    {business.length === 0 ? <EmptyState>{t('dashboard.noCustomers')}</EmptyState> : (
                        <div className="flex flex-col gap-6">
                            <CustomerResultChart customers={business} selected={customerId} onSelect={toggleCustomer}/>
                            <CustomerRatingTable customers={business} onSelect={toggleCustomer}/>
                        </div>
                    )}
                    {own.length > 0 ? (
                        <div className="mt-6">
                            <h3 className="mb-2 text-lg font-semibold">{t('dashboard.ownProjects')}</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-line text-xs tracking-wide text-text-muted uppercase">
                                            <th className="px-2 py-2 text-left font-semibold">{t('dashboard.customer')}</th>
                                            <th className="px-2 py-2 text-right font-semibold">{t('dashboard.costs')}</th>
                                            <th className="px-2 py-2 text-right font-semibold">{t('dashboard.fixedCostsPerYear')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {own.map((row) => (
                                            <tr key={row.customerId} className="border-b border-line/60">
                                                <td className="px-2 py-2"><button type="button" className="hover:text-accent" onClick={() => toggleCustomer(row.customerId)}>{row.name}</button></td>
                                                <td className="px-2 py-2 text-right tabular">{money(row.costs)}</td>
                                                <td className="px-2 py-2 text-right tabular">{money(row.domainsPackagesPerYear)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : null}
                </Card>

                <div id="costs" className="grid scroll-mt-32 gap-6 xl:grid-cols-2">
                    <Card title={t('dashboard.costsByAssignment')}>
                        {data.costsByAssignment.length === 0 ? <EmptyState>{t('dashboard.noFixedCosts')}</EmptyState> : <CostAssignmentChart rows={data.costsByAssignment}/>}
                    </Card>
                    <Card title={t('dashboard.expensePivot')}>
                        <ExpensePivotTable pivot={data.expensePivot}/>
                    </Card>
                </div>

                <Card id="tax" title={t('dashboard.section.tax')}>
                    {customerId !== null ? <div className="mb-3"><Notice tone="info">{t('dashboard.taxIgnoresCustomer')}</Notice></div> : null}
                    <TaxTable rows={data.tax}/>
                </Card>

                <div className="grid gap-6 3xl:grid-cols-2">
                    <Card id="upcoming" title={t('dashboard.section.upcoming')}>
                        <UpcomingTable items={data.upcoming}/>
                    </Card>
                    <Card id="tasks" title={t('dashboard.section.tasks')}>
                        <TaskTable tasks={data.tasks}/>
                    </Card>
                </div>

                <Card id="resources" title={t('dashboard.section.resources')}>
                    <ResourceSection resources={data.resources}/>
                </Card>
            </div>
        </>
    );
}
