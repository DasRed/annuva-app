'use client';

import {IconHelpCircle} from '@tabler/icons-react';
import {type ReactNode, useState} from 'react';
import useI18n from '@/i18n/useI18n';

/**
 * Key figure with an optional sub line and a "how is this calculated?" explanation.
 */
export default function KpiTile({delay = 0, formula, href, label, sub, tone = 'neutral', value}: {
    delay?: number;
    formula: string;
    href?: string;
    label: string;
    sub?: ReactNode;
    tone?: 'negative' | 'neutral' | 'positive';
    value: ReactNode;
}) {
    const {t} = useI18n();
    const [open, setOpen] = useState(false);
    const color = {negative: 'text-negative', neutral: 'text-text', positive: 'text-positive'}[tone];

    return (
        <div className="animate-rise relative flex flex-col gap-1 rounded-xl border border-line bg-surface p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg" style={{animationDelay: `${delay}ms`}}>
            <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold tracking-wide text-text-muted uppercase">{href !== undefined ? <a href={href} className="hover:text-accent">{label}</a> : label}</p>
                <button type="button" onClick={() => setOpen(!open)} className="-m-1 rounded-full p-1 text-text-muted transition hover:bg-surface-2 hover:text-accent" aria-expanded={open} aria-label={t('dashboard.howCalculated')}>
                    <IconHelpCircle size={16} stroke={1.75}/>
                </button>
            </div>
            <p className={`font-serif text-2xl font-semibold tabular sm:text-[1.7rem] ${color}`}>{value}</p>
            {sub !== undefined ? <p className="text-xs text-text-muted">{sub}</p> : null}
            {open ? (
                <p className="animate-fade mt-2 rounded-lg bg-surface-2 p-2 text-xs text-text-soft">
                    <span className="font-semibold">{t('dashboard.howCalculated')} </span>{formula}
                </p>
            ) : null}
        </div>
    );
}
