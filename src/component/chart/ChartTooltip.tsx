import type {ReactNode} from 'react';

/**
 * Hover tooltip with exact values, positioned inside the chart container.
 */
export default function ChartTooltip({children, x, y}: { children: ReactNode; x: number; y: number }) {
    return (
        <div
            role="tooltip"
            className="animate-fade pointer-events-none absolute z-10 min-w-40 -translate-x-1/2 -translate-y-full rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-card"
            style={{left: x, top: y - 8}}
        >
            {children}
        </div>
    );
}
