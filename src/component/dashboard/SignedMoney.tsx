'use client';

import useI18n from '@/i18n/useI18n';

/**
 * Amount with sign, negative values in the negative colour.
 */
export default function SignedMoney({cents, strong = false}: { cents: number | null; strong?: boolean }) {
    const {money} = useI18n();
    if (cents === null) {
        return <span className="text-text-muted">–</span>;
    }
    return <span className={`tabular ${cents < 0 ? 'text-negative' : ''} ${strong ? 'font-semibold' : ''}`}>{money(cents, true)}</span>;
}
