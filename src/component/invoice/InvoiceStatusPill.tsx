'use client';

import Pill from '@/component/ui/Pill';
import type PillTone from '@/component/ui/PillTone';
import useI18n from '@/i18n/useI18n';

const tones: Record<string, PillTone> = {cancelled: 'neutral', open: 'warning', paid: 'positive', to_issue: 'info'};

export default function InvoiceStatusPill({overdue = false, status}: { overdue?: boolean; status: string }) {
    const {t, td} = useI18n();
    if (overdue && status === 'open') {
        return <Pill tone="negative">{t('invoice.overdue')}</Pill>;
    }
    return <Pill tone={tones[status] ?? 'neutral'}>{td(`enum.invoices.status.${status}`, status)}</Pill>;
}
