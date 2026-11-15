import account from '@/translations/de/account';
import auth from '@/translations/de/auth';
import business from '@/translations/de/business';
import common from '@/translations/de/common';
import dashboard from '@/translations/de/dashboard';
import entity from '@/translations/de/entity';
import nav from '@/translations/de/nav';
import pdf from '@/translations/de/pdf';
import type en from '@/translations/en/index';

const de: Record<keyof typeof en, string> = {
    ...account,
    ...auth,
    ...business,
    ...common,
    ...dashboard,
    ...entity,
    ...nav,
    ...pdf,
};

export default de;
