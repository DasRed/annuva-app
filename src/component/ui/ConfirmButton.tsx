'use client';

import {type ReactNode, useState} from 'react';
import Button from '@/component/ui/Button';
import Dialog from '@/component/ui/Dialog';
import useI18n from '@/i18n/useI18n';

/**
 * Button that asks for confirmation in a dialog before running the action.
 */
export default function ConfirmButton({children, confirmLabel, icon, message, onConfirm, size = 'md', title, variant = 'secondary'}: {
    children: ReactNode;
    confirmLabel?: ReactNode;
    icon?: ReactNode;
    message: ReactNode;
    onConfirm: () => Promise<void> | void;
    size?: 'md' | 'sm';
    title: ReactNode;
    variant?: 'danger' | 'ghost' | 'primary' | 'secondary';
}) {
    const {t} = useI18n();
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);

    return (
        <>
            <Button variant={variant} size={size} icon={icon} onClick={() => setOpen(true)}>{children}</Button>
            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                title={title}
                footer={(
                    <>
                        <Button variant="ghost" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
                        <Button
                            variant={variant === 'danger' ? 'danger' : 'primary'}
                            loading={busy}
                            onClick={async () => {
                                setBusy(true);
                                try {
                                    await onConfirm();
                                    setOpen(false);
                                }
                                finally {
                                    setBusy(false);
                                }
                            }}
                        >
                            {confirmLabel ?? t('common.confirm')}
                        </Button>
                    </>
                )}
            >
                <div className="text-text-soft">{message}</div>
            </Dialog>
        </>
    );
}
