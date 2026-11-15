'use client';

import {IconCopy, IconDownload} from '@tabler/icons-react';
import Button from '@/component/ui/Button';
import Notice from '@/component/ui/Notice';
import useI18n from '@/i18n/useI18n';

/**
 * One-time recovery codes, shown exactly once, with copy and download.
 */
export default function RecoveryCodes({codes}: { codes: string[] }) {
    const {t} = useI18n();
    const text = codes.join('\n');
    return (
        <div className="flex flex-col gap-3">
            <Notice tone="warning">{t('twoFactor.recoveryCodesNotice')}</Notice>
            <ul className="grid grid-cols-2 gap-2 rounded-lg border border-line bg-surface-2 p-3 font-mono text-sm">
                {codes.map((code) => <li key={code}>{code}</li>)}
            </ul>
            <div className="flex flex-wrap gap-2">
                <Button size="sm" icon={<IconCopy size={16} stroke={1.75}/>} onClick={() => navigator.clipboard.writeText(text)}>{t('common.copy')}</Button>
                <Button size="sm" icon={<IconDownload size={16} stroke={1.75}/>} onClick={() => {
                    const url = URL.createObjectURL(new Blob([`${t('twoFactor.recoveryCodes')}\n\n${text}\n`], {type: 'text/plain'}));
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'annuva-recovery-codes.txt';
                    link.click();
                    URL.revokeObjectURL(url);
                }}>
                    {t('common.download')}
                </Button>
            </div>
        </div>
    );
}
