import type navEn from '@/translations/en/nav';

const nav: Record<keyof typeof navEn, string> = {
    'nav.close':            'Menü schließen',
    'nav.customers':        'Kunden',
    'nav.dashboard':        'Dashboard',
    'nav.expenses':         'Kosten',
    'nav.group.admin':      'Verwaltung',
    'nav.group.business':   'Geschäft',
    'nav.group.costs':      'Kosten & Steuer',
    'nav.group.overview':   'Überblick',
    'nav.invoices':         'Rechnungen',
    'nav.logout':           'Abmelden',
    'nav.main':             'Hauptnavigation',
    'nav.offers':           'Angebote',
    'nav.open':             'Menü öffnen',
    'nav.partners':         'Partner',
    'nav.profile':          'Profil',
    'nav.recurringCharges': 'Wiederkehrende Posten',
    'nav.recurringCosts':   'Fixkosten',
    'nav.resources':        'Ressourcen',
    'nav.settings':         'Einstellungen',
    'nav.tasks':            'Aufgaben',
    'nav.tax':              'Steuer',
    'nav.templates':        'Rechnungsvorlagen',
    'nav.users':            'Benutzer',
};

export default nav;
