'use client';

import {createContext} from 'react';
import type I18nValue from '@/i18n/I18nValue';

const I18nContext = createContext<I18nValue>({
    currency:     'EUR',
    dictionary:   {},
    formatLocale: 'de-DE',
    locale:       'en',
    timezone:     'Europe/Berlin',
});

export default I18nContext;
