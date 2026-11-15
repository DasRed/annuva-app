import type {ReactNode} from 'react';

export default function Card({actions, children, className = '', description, id, title}: {
    actions?: ReactNode;
    children: ReactNode;
    className?: string;
    description?: ReactNode;
    id?: string;
    title?: ReactNode;
}) {
    return (
        <section id={id} className={`animate-rise min-w-0 scroll-mt-24 rounded-xl border border-line bg-surface p-4 shadow-card sm:p-5 ${className}`}>
            {title !== undefined || actions !== undefined ? (
                <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                        {title !== undefined ? <h2 className="text-xl font-semibold">{title}</h2> : null}
                        {description !== undefined ? <p className="mt-1 text-sm text-text-muted">{description}</p> : null}
                    </div>
                    {actions !== undefined ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
                </header>
            ) : null}
            {children}
        </section>
    );
}
