'use client';

import {IconFileUpload, IconPaperclip, IconTrash} from '@tabler/icons-react';
import {useRef, useState} from 'react';
import apiFetch from '@/client/apiFetch';
import ApiClientError from '@/client/ApiClientError';
import Button from '@/component/ui/Button';
import useI18n from '@/i18n/useI18n';

/**
 * Uploads a file to /api/v1/files and stores its id in the field.
 */
export default function FileField({accept, id, onChange, value}: { accept?: string; id: string; onChange: (value: string) => void; value: string }) {
    const {t} = useI18n();
    const input = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState(false);
    const [name, setName] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    return (
        <div className="flex flex-wrap items-center gap-2">
            <input
                ref={input}
                id={id}
                type="file"
                accept={accept}
                className="sr-only"
                onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (file === undefined) {
                        return;
                    }
                    setBusy(true);
                    setError(null);
                    try {
                        const form = new FormData();
                        form.append('file', file);
                        const stored = await apiFetch<{ id: string; originalName: string }>('/api/v1/files', {formData: form});
                        setName(stored.originalName);
                        onChange(stored.id);
                    }
                    catch (exception) {
                        setError(exception instanceof ApiClientError ? exception.message : t('common.error'));
                    }
                    finally {
                        setBusy(false);
                        event.target.value = '';
                    }
                }}
            />
            <Button size="sm" loading={busy} icon={<IconFileUpload size={16} stroke={1.75}/>} onClick={() => input.current?.click()}>
                {value === '' ? t('common.upload') : t('common.replace')}
            </Button>
            {value !== '' ? (
                <>
                    <a href={`/api/v1/files/${value}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
                        <IconPaperclip size={16} stroke={1.75}/>{name ?? t('common.openFile')}
                    </a>
                    <Button size="sm" variant="ghost" icon={<IconTrash size={16} stroke={1.75}/>} onClick={() => onChange('')} aria-label={t('common.remove')}/>
                </>
            ) : null}
            {error !== null ? <span className="text-sm text-negative">{error}</span> : null}
        </div>
    );
}
