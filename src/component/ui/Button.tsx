import Link from 'next/link';
import type {ButtonHTMLAttributes, ReactNode} from 'react';

type Variant = 'danger' | 'ghost' | 'primary' | 'secondary';

const variants: Record<Variant, string> = {
    danger:    'bg-negative text-white hover:brightness-110 shadow-sm',
    ghost:     'text-text-soft hover:bg-surface-2 hover:text-text',
    primary:   'bg-accent text-accent-ink hover:bg-accent-strong shadow-sm',
    secondary: 'border border-line bg-surface text-text hover:border-accent hover:text-accent',
};

/**
 * Pill-shaped button after the style guide. With `href` it renders a link.
 */
export default function Button({children, className = '', href, icon, loading = false, size = 'md', variant = 'secondary', ...props}: ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: string;
    icon?: ReactNode;
    loading?: boolean;
    size?: 'md' | 'sm';
    variant?: Variant;
}) {
    const classes = [
        'inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap transition duration-150',
        'active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50',
        size === 'sm' ? 'h-8 px-3 text-sm' : 'h-10 px-4 text-[0.95rem]',
        variants[variant],
        className,
    ].join(' ');
    const content = (
        <>
            {loading ? <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden/> : icon}
            {children}
        </>
    );
    if (href !== undefined) {
        return <Link href={href} className={classes}>{content}</Link>;
    }
    return <button type="button" className={classes} disabled={loading || props.disabled} {...props}>{content}</button>;
}
