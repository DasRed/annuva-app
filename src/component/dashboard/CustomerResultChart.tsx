'use client';

import {useState} from 'react';
import useElementWidth from '@/client/useElementWidth';
import barPath from '@/component/chart/barPath';
import ChartTooltip from '@/component/chart/ChartTooltip';
import TooltipRow from '@/component/chart/TooltipRow';
import type DashboardResult from '@/calculation/DashboardResult';
import useI18n from '@/i18n/useI18n';

const ROW = 30;

/**
 * Result per customer as horizontal bars around a zero line; positive in the income colour,
 * negative in the expense colour. Values are written next to the bars; click filters.
 */
export default function CustomerResultChart({customers, onSelect, selected}: { customers: DashboardResult['customers']; onSelect: (id: string) => void; selected: string | null }) {
    const {money, t} = useI18n();
    const [ref, width] = useElementWidth<HTMLDivElement>();
    const [hover, setHover] = useState<number | null>(null);
    const rows = customers.filter((customer) => customer.revenue !== 0 || customer.costs !== 0);
    const labelWidth = Math.min(180, width * 0.34);
    const valueWidth = 76;
    const plot = width - labelWidth - valueWidth * 2;
    const max = Math.max(...rows.map((row) => Math.abs(row.result)), 1);
    const hasNegative = rows.some((row) => row.result < 0);
    const zero = labelWidth + valueWidth + (hasNegative ? plot / 2 : 0);
    const scale = (value: number) => (Math.abs(value) / max) * (hasNegative ? plot / 2 : plot);
    const height = rows.length * ROW + 8;

    return (
        <div ref={ref} className="relative min-w-0" onMouseLeave={() => setHover(null)}>
            <svg width={width} height={height} role="img" aria-label={t('dashboard.perCustomer')}>
                <line x1={zero} x2={zero} y1={0} y2={height} stroke="var(--text-muted)"/>
                {rows.map((row, index) => {
                    const y = index * ROW + 6;
                    const length = scale(row.result);
                    const positive = row.result >= 0;
                    const dimmed = selected !== null && selected !== row.customerId;
                    return (
                        <g key={row.customerId} className="cursor-pointer" opacity={dimmed ? 0.35 : 1} onClick={() => onSelect(row.customerId)} onMouseEnter={() => setHover(index)}>
                            <rect x={0} y={y - 3} width={width} height={ROW} fill={hover === index ? 'var(--surface-2)' : 'transparent'} opacity={0.7}/>
                            <text x={labelWidth - 8} y={y + 15} textAnchor="end" fontSize={12} fill="var(--text)">{row.name.length > 24 ? `${row.name.slice(0, 23)}…` : row.name}</text>
                            {positive
                             ? <path className="chart-bar-x" style={{animationDelay: `${index * 30}ms`}} d={barPath(zero, y + 2, length, 18, 'right')} fill="var(--income)"/>
                             : <path style={{animationDelay: `${index * 30}ms`}} className="animate-fade" d={barPath(zero - length, y + 2, length, 18, 'left')} fill="var(--expense)"/>}
                            <text
                                x={positive ? zero + length + 6 : zero - length - 6}
                                y={y + 15}
                                textAnchor={positive ? 'start' : 'end'}
                                fontSize={11}
                                fill={positive ? 'var(--text-soft)' : 'var(--negative)'}
                                className="tabular"
                            >
                                {money(row.result, true)}
                            </text>
                        </g>
                    );
                })}
            </svg>
            {hover !== null ? (
                <ChartTooltip x={Math.min(Math.max(zero, 100), width - 100)} y={hover * ROW + 6}>
                    <p className="mb-1 font-semibold text-text">{rows[hover].name}</p>
                    <TooltipRow color="var(--income)" label={t('dashboard.revenue')} value={money(rows[hover].revenue)}/>
                    <TooltipRow color="var(--expense)" label={t('dashboard.costs')} value={money(rows[hover].costs)}/>
                    <TooltipRow label={t('dashboard.result')} value={money(rows[hover].result, true)}/>
                </ChartTooltip>
            ) : null}
        </div>
    );
}
