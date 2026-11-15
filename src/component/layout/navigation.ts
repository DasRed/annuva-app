import {
    IconAffiliate,
    IconCalendarRepeat,
    IconChecklist,
    IconFileDescription,
    IconFileInvoice,
    IconLayoutDashboard,
    IconReceipt,
    IconReceiptTax,
    IconRepeat,
    IconServer2,
    IconSettings,
    IconTemplate,
    IconUserCog,
    IconUsers,
} from '@tabler/icons-react';
import type TranslationKey from '@/i18n/TranslationKey';

/**
 * Main navigation, grouped by task. Admin sections are only shown to tenant admins.
 */
const navigation: { admin?: boolean; items: { href: string; icon: typeof IconUsers; label: TranslationKey }[]; label: TranslationKey }[] = [
    {
        items: [{href: '/', icon: IconLayoutDashboard, label: 'nav.dashboard'}],
        label: 'nav.group.overview',
    },
    {
        items: [
            {href: '/customers', icon: IconUsers, label: 'nav.customers'},
            {href: '/invoices', icon: IconFileInvoice, label: 'nav.invoices'},
            {href: '/offers', icon: IconFileDescription, label: 'nav.offers'},
            {href: '/recurring-charges', icon: IconRepeat, label: 'nav.recurringCharges'},
            {href: '/resources', icon: IconServer2, label: 'nav.resources'},
            {href: '/tasks', icon: IconChecklist, label: 'nav.tasks'},
            {href: '/partners', icon: IconAffiliate, label: 'nav.partners'},
        ],
        label: 'nav.group.business',
    },
    {
        items: [
            {href: '/expenses', icon: IconReceipt, label: 'nav.expenses'},
            {href: '/recurring-costs', icon: IconCalendarRepeat, label: 'nav.recurringCosts'},
            {href: '/tax', icon: IconReceiptTax, label: 'nav.tax'},
        ],
        label: 'nav.group.costs',
    },
    {
        admin: true,
        items: [
            {href: '/settings', icon: IconSettings, label: 'nav.settings'},
            {href: '/settings/templates', icon: IconTemplate, label: 'nav.templates'},
            {href: '/settings/users', icon: IconUserCog, label: 'nav.users'},
        ],
        label: 'nav.group.admin',
    },
];

export default navigation;
