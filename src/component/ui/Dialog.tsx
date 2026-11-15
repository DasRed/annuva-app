'use client';

import {IconX} from '@tabler/icons-react';
import {type ReactNode, useEffect, useRef} from 'react';
import useI18n from '@/i18n/useI18n';

/**
 * Modal dialog based on the native <dialog> element (focus trap and Escape for free).
 */
export default function Dialog({children, footer, onClose, open, size = 'md', title}: {
    children: ReactNode;
    footer?: ReactNode;
    onClose: () => void;
    open: boolean;
    size?: 'lg' | 'md' | 'xl';
    title: ReactNode;
}) {
    const {t} = useI18n();
    const ref = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = ref.current;
        if (dialog === null) {
            return;
        }
        if (open && !dialog.open) {
            dialog.showModal();
        }
        if (!open && dialog.open) {
            dialog.close();
        }
    }, [open]);

    const width = {lg: 'sm:max-w-3xl', md: 'sm:max-w-xl', xl: 'sm:max-w-5xl'}[size];

    return (
        <dialog
            ref={ref}
            onClose={onClose}
            onCancel={(event) => {
                event.preventDefault();
                onClose();
            }}
            className={`m-0 mt-auto h-fit max-h-[92dvh] w-full max-w-none overflow-hidden rounded-t-2xl border border-line bg-surface p-0 text-text shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-[2px] sm:m-auto sm:rounded-2xl ${width} open:animate-pop`}
        >
            {open ? (
                <div className="flex max-h-[92dvh] flex-col">
                    <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
                        <h2 className="text-xl font-semibold">{title}</h2>
                        <button type="button" onClick={onClose} className="rounded-full p-1.5 text-text-muted transition hover:bg-surface-2 hover:text-text" aria-label={t('common.close')}>
                            <IconX size={20} stroke={1.75}/>
                        </button>
                    </header>
                    <div className="overflow-y-auto px-5 py-4">{children}</div>
                    {footer !== undefined ? <footer className="flex flex-wrap justify-end gap-2 border-t border-line bg-surface-2/50 px-5 py-3">{footer}</footer> : null}
                </div>
            ) : null}
        </dialog>
    );
}
