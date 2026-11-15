'use client';

import {use} from 'react';
import createI18n from '@/i18n/createI18n';
import I18nContext from '@/i18n/I18nContext';

export default function useI18n() {
    return createI18n(use(I18nContext));
}
