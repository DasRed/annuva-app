import type {ReactNode} from 'react';

/**
 * Label, control, hint and the error message directly at the field.
 */
export default function FormField({children, className = '', error, hint, htmlFor, label, required = false}: {
    children: ReactNode;
    className?: string;
    error?: string | null;
    hint?: ReactNode;
    htmlFor?: string;
    label: ReactNode;
    required?: boolean;
}) {
    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            <label htmlFor={htmlFor} className="text-sm font-semibold text-text-soft">
                {label}
                {required ? <span className="ml-0.5 text-negative" aria-hidden>*</span> : null}
            </label>
            {children}
            {error !== undefined && error !== null && error !== '' ? <p className="animate-fade text-sm text-negative">{error}</p> : null}
            {hint !== undefined && (error === undefined || error === null) ? <p className="text-xs text-text-muted">{hint}</p> : null}
        </div>
    );
}
