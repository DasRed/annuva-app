import {IconAlertTriangle, IconCircleCheck, IconInfoCircle, IconXboxX} from '@tabler/icons-react';
import type {ReactNode} from 'react';

const tones = {
    error:   {className: 'border-negative/30 bg-negative-soft text-negative', icon: IconXboxX},
    info:    {className: 'border-info/30 bg-info-soft text-info', icon: IconInfoCircle},
    success: {className: 'border-positive/30 bg-positive-soft text-positive', icon: IconCircleCheck},
    warning: {className: 'border-warning/30 bg-warning-soft text-warning', icon: IconAlertTriangle},
};

/**
 * Status message with text and icon, never colour alone.
 */
export default function Notice({children, tone = 'info'}: { children: ReactNode; tone?: keyof typeof tones }) {
    const {className, icon: Icon} = tones[tone];
    return (
        <div role={tone === 'error' ? 'alert' : 'status'} className={`animate-fade flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${className}`}>
            <Icon size={18} stroke={1.75} className="mt-0.5 shrink-0"/>
            <div className="min-w-0 text-text">{children}</div>
        </div>
    );
}
