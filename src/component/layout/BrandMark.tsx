/**
 * Word mark: serif name with a small ring that hints at the yearly cycle.
 */
export default function BrandMark({name}: { name: string }) {
    return (
        <span className="inline-flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden className="shrink-0">
                <circle cx="16" cy="16" r="12" fill="none" stroke="var(--gold)" strokeWidth="3" strokeDasharray="56 20" strokeLinecap="round" transform="rotate(-70 16 16)"/>
                <circle cx="16" cy="16" r="5" fill="var(--accent)"/>
            </svg>
            <span className="font-serif text-2xl font-semibold tracking-tight">{name}</span>
        </span>
    );
}
