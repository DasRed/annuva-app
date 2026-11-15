'use client';

import {useState} from 'react';
import useElementWidth from '@/client/useElementWidth';
import ChartLegend from '@/component/chart/ChartLegend';
import ChartTooltip from '@/component/chart/ChartTooltip';
import TooltipRow from '@/component/chart/TooltipRow';
import type DashboardResult from '@/calculation/DashboardResult';
import useI18n from '@/i18n/useI18n';

const ROW = 30;

/**
 * Fixed costs per assignment as stacked bar: rebilled share and self-borne rest, with a 2px gap.
 */
export default function CostAssignmentChart({rows}: { rows: DashboardResult['costsByAssignment'] }) {
    const {money, t} = useI18n();
    const [ref, width] = useElementWidth<HTMLDivElement>();
    const [hover, setHover] = useState<number | null>(null);
    const labelWidth = Math.min(160, width * 0.34);
    const plot = width - labelWidth - 80;
    const max = Math.max(...rows.map((row) => row.cost), 1);
    const scale = (value: number) => (value / max) * plot;
    const height = rows.length * ROW + 4;

    return (
        <div>
            <ChartLegend items={[{color: 'var(--income)', label: t('dashboard.rebilled')}, {color: 'var(--expense)', label: t('dashboard.selfBorne')}]}/>
            <div ref={ref} className="relative min-w-0" onMouseLeave={() => setHover(null)}>
                <svg width={width} height={height} role="img" aria-label={t('dashboard.costsByAssignment')}>
                    {rows.map((row, index) => {
                        const y = index * ROW + 4;
                        const rebilled = scale(Math.min(row.rebilled, row.cost));
                        const self = scale(row.selfBorne);
                        return (
                            <g key={row.customerId} onMouseEnter={() => setHover(index)}>
                                <rect x={0} y={y - 4} width={width} height={ROW} fill={hover === index ? 'var(--surface-2)' : 'transparent'} opacity={0.7}/>
                                <text x={labelWidth - 8} y={y + 14} textAnchor="end" fontSize={12} fill="var(--text)">{row.name.length > 22 ? `${row.name.slice(0, 21)}…` : row.name}</text>
                                <rect className="chart-bar-x" x={labelWidth} y={y + 1} width={rebilled} height={18} rx={rebilled > 0 && self === 0 ? 4 : 0} fill="var(--income)"/>
                                {self > 0 ? <rect className="chart-bar-x" x={labelWidth + rebilled + (rebilled > 0 ? 2 : 0)} y={y + 1} width={Math.max(self - (rebilled > 0 ? 2 : 0), 1)} height={18} rx={4} fill="var(--expense)"/> : null}
                                <text x={labelWidth + rebilled + self + 6} y={y + 14} fontSize={11} fill="var(--text-soft)" className="tabular">{money(row.cost)}</text>
                            </g>
                        );
                    })}
                </svg>
                {hover !== null ? (
                    <ChartTooltip x={Math.min(Math.max(labelWidth + plot / 2, 100), width - 100)} y={hover * ROW + 4}>
                        <p className="mb-1 font-semibold text-text">{rows[hover].name}</p>
                        <TooltipRow label={t('dashboard.costsPerYear')} value={money(rows[hover].cost)}/>
                        <TooltipRow color="var(--income)" label={t('dashboard.rebilled')} value={money(rows[hover].rebilled)}/>
                        <TooltipRow color="var(--expense)" label={t('dashboard.selfBorne')} value={money(rows[hover].selfBorne)}/>
                    </ChartTooltip>
                ) : null}
            </div>
        </div>
    );
}
