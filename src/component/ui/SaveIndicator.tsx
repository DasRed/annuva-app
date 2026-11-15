'use client';

import {IconCheck, IconLoader2, IconX} from '@tabler/icons-react';
import type SaveState from '@/client/SaveState';
import useI18n from '@/i18n/useI18n';

/**
 * Small status next to a field label: spinner while saving, a green check that fades out after
 * saving, a red cross when saving failed (the message is shown below the field).
 */
export default function SaveIndicator({state}: { state: SaveState | undefined }) {
    const {t} = useI18n();
    if (state === undefined) {
        return null;
    }
    if (state.status === 'saving') {
        return (
            <span className="inline-flex items-center gap-1 text-xs font-normal text-text-muted" role="status">
                <IconLoader2 size={14} stroke={2} className="animate-spin motion-reduce:animate-none"/>{t('common.saving')}
            </span>
        );
    }
    if (state.status === 'saved') {
        return (
            <span className="animate-saved inline-flex items-center gap-1 text-xs font-semibold text-positive" role="status">
                <IconCheck size={14} stroke={2.5}/>{t('common.savedShort')}
            </span>
        );
    }
    return (
        <span className="animate-pop inline-flex items-center gap-1 text-xs font-semibold text-negative" role="alert">
            <IconX size={14} stroke={2.5}/>{t('common.notSaved')}
        </span>
    );
}
