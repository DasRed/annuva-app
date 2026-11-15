'use client';

import type {ReactNode} from 'react';
import I18nContext from '@/i18n/I18nContext';
import type I18nValue from '@/i18n/I18nValue';

export default function I18nProvider({children, value}: { children: ReactNode; value: I18nValue }) {
    return <I18nContext value={value}>{children}</I18nContext>;
}
