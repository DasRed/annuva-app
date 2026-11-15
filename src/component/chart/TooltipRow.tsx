import type {ReactNode} from 'react';

export default function TooltipRow({color, label, value}: { color?: string; label: ReactNode; value: ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-1.5 text-text-soft">
                {color !== undefined ? <span className="inline-block size-2 rounded-sm" style={{background: color}}/> : null}
                {label}
            </span>
            <span className="font-semibold text-text tabular">{value}</span>
        </div>
    );
}
