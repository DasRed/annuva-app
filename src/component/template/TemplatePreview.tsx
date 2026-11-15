'use client';

import {IconLoader2} from '@tabler/icons-react';
import Notice from '@/component/ui/Notice';
import useI18n from '@/i18n/useI18n';

/**
 * A4 preview of a sample invoice as rendered PDF. A small spinner shows while a newer preview is
 * being rendered; the previous one stays visible meanwhile.
 */
export default function TemplatePreview({error, loading, url}: { error: boolean; loading: boolean; url: string | null }) {
    const {t} = useI18n();
    return (
        <div className="flex flex-col gap-2">
            <div className="relative aspect-[1/1.4142] w-full overflow-hidden rounded-lg border border-line bg-white shadow-card">
                {url !== null ? (
                    // oxlint-disable-next-line react/iframe-missing-sandbox -- the browser PDF viewer does not work in a sandbox
                    <iframe title={t('templates.preview')} src={`${url}#toolbar=0&navpanes=0&view=FitH`} className="absolute inset-0 size-full"/>
                ) : (
                    <div className="skeleton absolute inset-4"/>
                )}
                {loading ? (
                    <span className="animate-fade absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-xs text-text-muted shadow-card">
                        <IconLoader2 size={14} stroke={2} className="animate-spin motion-reduce:animate-none"/>{t('templates.rendering')}
                    </span>
                ) : null}
            </div>
            {error ? <Notice tone="error">{t('templates.previewError')}</Notice> : <p className="text-xs text-text-muted">{t('templates.previewHint')}</p>}
        </div>
    );
}
