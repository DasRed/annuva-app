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

const HEIGHT = 240;
const TOP = 24;
const BOTTOM = 44;

/**
 * Revenue and expenses per year as grouped bars; the plan year is lighter. The result is written
 * below each year. Clicking a year sets (or clears) the year filter.
 */
export default function YearChart({onSelect, selected, years}: { onSelect: (year: number) => void; selected: number | null; years: DashboardResult['years'] }) {
    const {money, t} = useI18n();
    const [ref, width] = useElementWidth<HTMLDivElement>();
    const [hover, setHover] = useState<number | null>(null);
    const max = niceMax(Math.max(...years.map((row) => Math.max(row.revenue, row.expenses)), 1));
    const plot = HEIGHT - TOP - BOTTOM;
    const slot = width / Math.max(years.length, 1);
    const bar = Math.min(36, Math.max(8, slot * 0.28));
    const scale = (value: number) => (value / max) * plot;

    return (
        <div>
            <ChartLegend items={[
                {color: 'var(--income)', label: t('dashboard.revenue')},
                {color: 'var(--expense)', label: t('dashboard.expenses')},
                {color: 'var(--income)', dashed: true, label: t('dashboard.planYear')},
            ]}/>
            <div ref={ref} className="relative min-w-0">
                <svg width={width} height={HEIGHT} role="img" aria-label={t('dashboard.perYear')}>
                    {[0, 0.5, 1].map((fraction) => (
                        <g key={fraction}>
                            <line x1={0} x2={width} y1={TOP + plot - fraction * plot} y2={TOP + plot - fraction * plot} stroke="var(--line)" strokeDasharray={fraction === 0 ? undefined : '3 4'}/>
                            {fraction > 0 ? <text x={0} y={TOP + plot - fraction * plot - 4} fontSize={10} fill="var(--text-muted)">{formatCompact(max * fraction)}</text> : null}
                        </g>
                    ))}
                    {years.map((row, index) => {
                        const center = slot * index + slot / 2;
                        const dimmed = selected !== null && selected !== row.year;
                        const opacity = (row.plan ? 0.45 : 1) * (dimmed ? 0.35 : 1);
                        return (
                            <g
                                key={row.year}
                                className="cursor-pointer"
                                onClick={() => onSelect(row.year)}
                                onMouseEnter={() => setHover(index)}
                                onMouseLeave={() => setHover(null)}
                                role="button"
                                tabIndex={0}
                                aria-label={`${row.year}: ${money(row.revenue)} / ${money(row.expenses)}`}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        onSelect(row.year);
                                    }
                                }}
                            >
                                <rect x={slot * index} y={0} width={slot} height={HEIGHT} fill={hover === index ? 'var(--surface-2)' : 'transparent'} opacity={0.6}/>
                                <path className="chart-bar" style={{animationDelay: `${index * 50}ms`}} d={barPath(center - bar - 1, TOP + plot - scale(row.revenue), bar, scale(row.revenue), 'up')} fill="var(--income)" opacity={opacity} strokeDasharray={row.plan ? '4 3' : undefined} stroke={row.plan ? 'var(--income)' : undefined}/>
                                <path className="chart-bar" style={{animationDelay: `${index * 50 + 30}ms`}} d={barPath(center + 1, TOP + plot - scale(row.expenses), bar, scale(row.expenses), 'up')} fill="var(--expense)" opacity={opacity} strokeDasharray={row.plan ? '4 3' : undefined} stroke={row.plan ? 'var(--expense)' : undefined}/>
                                <text x={center} y={HEIGHT - BOTTOM + 16} textAnchor="middle" fontSize={12} fontWeight={selected === row.year ? 700 : 500} fill="var(--text)">
                                    {row.year}{row.plan ? ` (${t('dashboard.planShort')})` : ''}
                                </text>
                                <text x={center} y={HEIGHT - BOTTOM + 32} textAnchor="middle" fontSize={11} fill={row.result < 0 ? 'var(--negative)' : 'var(--text-soft)'} className="tabular">
                                    {row.result > 0 ? '+' : ''}{formatCompact(row.result)}
                                </text>
                            </g>
                        );
                    })}
                </svg>
                {hover !== null ? (
                    <ChartTooltip x={slot * hover + slot / 2} y={TOP}>
                        <p className="mb-1 font-semibold text-text">{years[hover].year}{years[hover].plan ? ` · ${t('dashboard.planYear')}` : ''}</p>
                        <TooltipRow color="var(--income)" label={t('dashboard.revenue')} value={money(years[hover].revenue)}/>
                        <TooltipRow color="var(--expense)" label={t('dashboard.expenses')} value={money(years[hover].expenses)}/>
                        {years[hover].expensesPlanned > 0 && !years[hover].plan ? <TooltipRow label={t('dashboard.ofWhichPlanned')} value={money(years[hover].expensesPlanned)}/> : null}
                        <TooltipRow label={t('dashboard.result')} value={money(years[hover].result, true)}/>
                    </ChartTooltip>
                ) : null}
            </div>
        </div>
    );
}
