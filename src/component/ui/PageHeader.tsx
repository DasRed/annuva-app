import type {ReactNode} from 'react';

/**
 * Eyebrow → headline → short context → actions, as in the style guide.
 */
export default function PageHeader({actions, description, eyebrow, title}: {
    actions?: ReactNode;
    description?: ReactNode;
    eyebrow?: ReactNode;
    title: ReactNode;
}) {
    return (
        <header className="animate-rise mb-6 flex flex-col gap-4 sm:mb-8 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
                {eyebrow !== undefined ? <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-gold-ink uppercase">{eyebrow}</p> : null}
                <h1 className="text-3xl leading-tight font-semibold sm:text-4xl">{title}</h1>
                {description !== undefined ? <p className="mt-2 max-w-3xl text-text-soft">{description}</p> : null}
            </div>
            {actions !== undefined ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </header>
    );
}
