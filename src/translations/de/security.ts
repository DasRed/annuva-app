import type securityEn from '@/translations/en/security';

const security: Record<keyof typeof securityEn, string> = {
    'auth.twoFactor.description':         'Gib den 6-stelligen Code aus deiner Authenticator-App ein.',
    'auth.twoFactor.recoveryDescription': 'Gib einen deiner Wiederherstellungscodes ein. Jeder Code funktioniert nur einmal.',
    'auth.twoFactor.submit':              'Bestätigen',
    'auth.twoFactor.title':               'Zwei-Faktor-Anmeldung',
    'auth.twoFactor.useApp':              'Authenticator-App verwenden',
    'auth.twoFactor.useRecovery':         'Wiederherstellungscode verwenden',

    'twoFactor.activate':                 'Aktivieren',
    'twoFactor.active':                   'Aktiv',
    'twoFactor.code':                     'Code aus der App',
    'twoFactor.codeOrRecovery':           'Code aus der App oder Wiederherstellungscode',
    'twoFactor.description':              'Optional: schützt deine Anmeldung mit einem zweiten Schritt – einem Code aus einer Authenticator-App wie 2FAS, Aegis, Google Authenticator, Microsoft Authenticator oder 1Password. API-Tokens sind davon nicht betroffen.',
    'twoFactor.disable':                  'Ausschalten',
    'twoFactor.done':                     'Fertig',
    'twoFactor.enabled':                  'Die Zwei-Faktor-Anmeldung ist aktiv.',
    'twoFactor.fewRecoveryCodes':         'Es sind nur noch wenige Wiederherstellungscodes übrig. Erstelle neue.',
    'twoFactor.generate':                 'Neue Codes erstellen',
    'twoFactor.inactive':                 'Aus',
    'twoFactor.manualKey':                'Oder gib diesen Schlüssel von Hand ein:',
    'twoFactor.newRecoveryCodes':         'Neue Wiederherstellungscodes',
    'twoFactor.qrAlt':                    'QR-Code für die Authenticator-App',
    'twoFactor.recoveryCode':             'Wiederherstellungscode',
    'twoFactor.recoveryCodes':            'Wiederherstellungscodes',
    'twoFactor.recoveryCodesLeft':        'Noch {count} Wiederherstellungscodes',
    'twoFactor.recoveryCodesNotice':      'Bewahre diese Codes sicher auf, z. B. im Passwortmanager. Mit jedem Code kannst du dich einmal anmelden, falls dein Handy weg ist. Sie werden nur jetzt angezeigt.',
    'twoFactor.setup':                    'Einrichten',
    'twoFactor.step1':                    'Öffne deine Authenticator-App und füge ein neues Konto hinzu.',
    'twoFactor.step2':                    'Scanne den QR-Code oder gib den Schlüssel ein.',
    'twoFactor.step3':                    'Gib den 6-stelligen Code ein, den die App anzeigt.',
    'twoFactor.title':                    'Zwei-Faktor-Anmeldung',

    'users.resetTwoFactor':               '2FA zurücksetzen',
    'users.resetTwoFactorMessage':        'Der Benutzer meldet sich dann nur mit dem Passwort an und kann die Zwei-Faktor-Anmeldung im Profil neu einrichten.',
    'users.resetTwoFactorTitle':          'Zwei-Faktor-Anmeldung zurücksetzen?',
    'users.twoFactorActive':              'Zwei-Faktor-Anmeldung ist aktiv.',
};

export default security;
