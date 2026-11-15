import type {ReactNode} from 'react';
import type PillTone from '@/component/ui/PillTone';

const tones: Record<PillTone, string> = {
    accent:   'bg-accent-soft text-accent-strong',
    info:     'bg-info-soft text-info',
    negative: 'bg-negative-soft text-negative',
    neutral:  'bg-surface-2 text-text-soft',
    positive: 'bg-positive-soft text-positive',
    warning:  'bg-warning-soft text-warning',
};

export default function Pill({children, icon, tone = 'neutral'}: { children: ReactNode; icon?: ReactNode; tone?: PillTone }) {
    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${tones[tone]}`}>
            {icon}
            {children}
        </span>
    );
}
