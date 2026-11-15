import {IconMoodEmpty} from '@tabler/icons-react';
import type {ReactNode} from 'react';

export default function EmptyState({action, children}: { action?: ReactNode; children: ReactNode }) {
    return (
        <div className="animate-fade flex flex-col items-center gap-3 rounded-lg border border-dashed border-line px-4 py-8 text-center text-sm text-text-muted">
            <IconMoodEmpty size={28} stroke={1.5} className="text-gold"/>
            <p>{children}</p>
            {action}
        </div>
    );
}
