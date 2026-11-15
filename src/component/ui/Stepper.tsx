import {IconCheck} from '@tabler/icons-react';

/**
 * Progress of a wizard. On phones only the current step label is shown.
 */
export default function Stepper({current, steps}: { current: number; steps: string[] }) {
    return (
        <ol className="mb-6 flex items-center gap-2" aria-label="Progress">
            {steps.map((label, index) => {
                const done = index < current;
                const active = index === current;
                return (
                    <li key={label} className={`flex items-center gap-2 ${active ? 'flex-1 sm:flex-none' : ''}`} aria-current={active ? 'step' : undefined}>
                        <span className={`inline-flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition duration-300 ${done ? 'border-accent bg-accent text-accent-ink' : active ? 'border-accent text-accent ring-4 ring-accent/15' : 'border-line text-text-muted'}`}>
                            {done ? <IconCheck size={16} stroke={2.5}/> : index + 1}
                        </span>
                        <span className={`text-sm font-medium ${active ? 'text-text' : 'hidden text-text-muted xl:inline'}`}>{label}</span>
                        {index < steps.length - 1 ? <span className={`hidden h-px w-6 sm:block ${done ? 'bg-accent' : 'bg-line'}`} aria-hidden/> : null}
                    </li>
                );
            })}
        </ol>
    );
}
