'use client';

import {useState} from 'react';
import useElementWidth from '@/client/useElementWidth';
import barPath from '@/component/chart/barPath';
import ChartLegend from '@/component/chart/ChartLegend';
import ChartTooltip from '@/component/chart/ChartTooltip';
import niceMax from '@/component/chart/niceMax';
import TooltipRow from '@/component/chart/TooltipRow';
import type DashboardResult from '@/calculation/DashboardResult';
import useI18n from '@/i18n/useI18n';
import formatCompact from '@/component/chart/formatCompact';

const HEIGHT = 280;
const TOP = 16;
const BOTTOM = 28;

const monthLabel = (month: string) => new Intl.DateTimeFormat(undefined, {month: 'short', timeZone: 'UTC'}).format(new Date(`${month}-01T00:00:00Z`));

/**
 * Monthly cash flow: income up, expenses down (planned values lighter) and the cumulative balance
 * as a line – all on one money axis.
 */
export default function CashflowChart({months}: { months: DashboardResult['cashflow'] }) {
    const {date, money, t} = useI18n();
    const [ref, width] = useElementWidth<HTMLDivElement>();
    const [hover, setHover] = useState<number | null>(null);

    const up = Math.max(...months.map((month) => Math.max(month.income + month.incomePlanned, month.balance)), 1);
    const down = Math.max(...months.map((month) => Math.max(month.expenses + month.expensesPlanned, -month.balance)), 1);
    const top = niceMax(up);
    const bottom = niceMax(down);
    const plot = HEIGHT - TOP - BOTTOM;
    const zero = TOP + (top / (top + bottom)) * plot;
    const scale = (value: number) => (value / (top + bottom)) * plot;
    const slot = width / Math.max(months.length, 1);
    const bar = Math.max(2, Math.min(22, slot - 4));
    const every = Math.ceil(months.length / Math.max(1, Math.floor(width / 48)));
    const line = months.map((month, index) => `${index === 0 ? 'M' : 'L'}${slot * index + slot / 2},${zero - scale(month.balance)}`).join(' ');

    return (
        <div>
            <ChartLegend items={[
                {color: 'var(--income)', label: t('dashboard.income')},
                {color: 'var(--income)', dashed: true, label: t('dashboard.incomePlanned')},
                {color: 'var(--expense)', label: t('dashboard.expenses')},
                {color: 'var(--expense)', dashed: true, label: t('dashboard.expensesPlanned')},
                {color: 'var(--text)', label: t('dashboard.balance'), line: true},
            ]}/>
            <div ref={ref} className="relative min-w-0" onMouseLeave={() => setHover(null)}>
                <svg width={width} height={HEIGHT} role="img" aria-label={t('dashboard.cashflow')}>
                    <line x1={0} x2={width} y1={TOP} y2={TOP} stroke="var(--line)" strokeDasharray="3 4"/>
                    <text x={0} y={TOP + 10} fontSize={10} fill="var(--text-muted)">{formatCompact(top)}</text>
                    <line x1={0} x2={width} y1={HEIGHT - BOTTOM} y2={HEIGHT - BOTTOM} stroke="var(--line)" strokeDasharray="3 4"/>
                    <text x={0} y={HEIGHT - BOTTOM - 4} fontSize={10} fill="var(--text-muted)">-{formatCompact(bottom)}</text>
                    {months.map((month, index) => {
                        const x = slot * index + (slot - bar) / 2;
                        const income = scale(month.income);
                        const incomePlanned = scale(month.incomePlanned);
                        const expenses = scale(month.expenses);
                        const expensesPlanned = scale(month.expensesPlanned);
                        return (
                            <g key={month.month} onMouseEnter={() => setHover(index)}>
                                <rect x={slot * index} y={0} width={slot} height={HEIGHT} fill={hover === index ? 'var(--surface-2)' : 'transparent'} opacity={0.7}/>
                                <path className="chart-bar" d={barPath(x, zero - income - incomePlanned, bar, incomePlanned, 'up')} fill="var(--income)" opacity={0.4}/>
                                <path className="chart-bar" d={income > 0 && incomePlanned > 0 ? `M${x},${zero - income}h${bar}v${income}h${-bar}z` : barPath(x, zero - income, bar, income, 'up')} fill="var(--income)"/>
                                <path className="chart-bar-down" d={expenses > 0 && expensesPlanned > 0 ? `M${x},${zero}h${bar}v${expenses}h${-bar}z` : barPath(x, zero, bar, expenses, 'down')} fill="var(--expense)"/>
                                <path className="chart-bar-down" d={barPath(x, zero + expenses, bar, expensesPlanned, 'down')} fill="var(--expense)" opacity={0.4}/>
                                {index % every === 0 ? <text x={slot * index + slot / 2} y={HEIGHT - 8} fontSize={10} textAnchor="middle" fill="var(--text-muted)">{monthLabel(month.month)}{month.month.endsWith('-01') ? ` ${month.month.slice(2, 4)}` : ''}</text> : null}
                            </g>
                        );
                    })}
                    <line x1={0} x2={width} y1={zero} y2={zero} stroke="var(--text-muted)" strokeWidth={1}/>
                    {months.length > 1 ? <path d={line} fill="none" stroke="var(--text)" strokeWidth={2} strokeLinejoin="round" className="animate-fade"/> : null}
                    {hover !== null ? <circle cx={slot * hover + slot / 2} cy={zero - scale(months[hover].balance)} r={4} fill="var(--text)" stroke="var(--surface)" strokeWidth={2}/> : null}
                </svg>
                {hover !== null ? (
                    <ChartTooltip x={Math.min(Math.max(slot * hover + slot / 2, 90), width - 90)} y={TOP + 20}>
                        <p className="mb-1 font-semibold text-text">{date(`${months[hover].month}-01`).slice(3)}</p>
                        <TooltipRow color="var(--income)" label={t('dashboard.income')} value={money(months[hover].income)}/>
                        {months[hover].incomePlanned !== 0 ? <TooltipRow label={t('dashboard.incomePlanned')} value={money(months[hover].incomePlanned)}/> : null}
                        <TooltipRow color="var(--expense)" label={t('dashboard.expenses')} value={money(months[hover].expenses)}/>
                        {months[hover].expensesPlanned !== 0 ? <TooltipRow label={t('dashboard.expensesPlanned')} value={money(months[hover].expensesPlanned)}/> : null}
                        <TooltipRow label={t('dashboard.balance')} value={money(months[hover].balance, true)}/>
                    </ChartTooltip>
                ) : null}
            </div>
        </div>
    );
}
