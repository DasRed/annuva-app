'use client';

import Link from 'next/link';
import EmptyState from '@/component/ui/EmptyState';
import Pill from '@/component/ui/Pill';
import type DashboardResult from '@/calculation/DashboardResult';
import useI18n from '@/i18n/useI18n';
import useToday from '@/client/useToday';

export default function TaskTable({tasks}: { tasks: DashboardResult['tasks'] }) {
    const {date, t, td} = useI18n();
    const today = useToday();
    if (tasks.length === 0) {
        return <EmptyState action={<Link href="/tasks" className="text-accent hover:underline">{t('dashboard.manageTasks')}</Link>}>{t('dashboard.noTasks')}</EmptyState>;
    }
    return (
        <ul className="divide-y divide-line">
            {tasks.map((task) => (
                <li key={task.id} className={`grid grid-cols-[6.5rem_1fr_auto] gap-x-3 gap-y-1 py-2.5 text-sm md:grid-cols-[6.5rem_1fr_minmax(8rem,14rem)_9rem] ${task.status === 'done' ? 'text-text-muted line-through decoration-text-muted/40' : ''}`}>
                    <span className={`tabular ${task.status !== 'done' && task.dueDate !== null && task.dueDate < today ? 'font-semibold text-negative no-underline' : ''}`}>{date(task.dueDate)}</span>
                    <span className="min-w-0">
                        <span className="font-medium">{task.title}</span>
                        {task.note !== null ? <span className="block truncate text-xs text-text-muted">{task.note}</span> : null}
                    </span>
                    <span className="hidden truncate text-text-soft md:block">{task.customerName ?? '–'}</span>
                    <span><Pill tone={task.status === 'open' ? 'info' : task.status === 'waiting_for_go' ? 'warning' : 'neutral'}>{td(`enum.tasks.status.${task.status}`, task.status)}</Pill></span>
                </li>
            ))}
        </ul>
    );
}
