import type templateEn from '@/translations/en/template';

const template: Record<keyof typeof templateEn, string> = {
    'templates.back':                         'Alle Vorlagen',
    'templates.default':                      'Standard',
    'templates.editorDescription':            'Alles, was du hier änderst, steht auf neuen Rechnungen mit dieser Vorlage. Die Vorschau zeigt eine Beispielrechnung mit deinen Firmendaten.',
    'templates.newName':                      'Neue Vorlage',
    'templates.openPreview':                  'Vorschau',
    'templates.paymentTerm':                  'Zahlungsziel {days} Tage',
    'templates.preview':                      'Beispielrechnung',
    'templates.previewEmpty':                 'Lege eine Vorlage an, um die Vorschau zu sehen.',
    'templates.previewError':                 'Die Vorschau konnte nicht erstellt werden.',
    'templates.previewHint':                  'Beispieldaten mit deinen Firmendaten. Bereits gestellte Rechnungen behalten ihr Aussehen.',
    'templates.rendering':                    'Aktualisiere …',

    'hint.invoiceTemplates.accentColor':      'Farbe für Titel, Summenzeile und den Firmennamen ohne Logo.',
    'hint.invoiceTemplates.closingText':      'Unter den Summen und dem Zahlungshinweis – z. B. Dank oder Grußformel.',
    'hint.invoiceTemplates.footerCenter':     'Leer: E-Mail, Telefon, Website und Steuernummer aus den Einstellungen.',
    'hint.invoiceTemplates.footerLeft':       'Leer: Firmenname und Adresse aus den Einstellungen.',
    'hint.invoiceTemplates.footerRight':      'Leer: Bankverbindung aus den Einstellungen.',
    'hint.invoiceTemplates.introText':        'Über den Positionen – z. B. eine kurze Anrede.',
    'hint.invoiceTemplates.isDefault':        'Gilt für alle Rechnungen ohne eigene Vorlage.',
    'hint.invoiceTemplates.logoFileId':       'Oben rechts statt des Firmennamens. PNG oder JPG, am besten mit transparentem Hintergrund.',
    'hint.invoiceTemplates.name':             'Nur für dich – wird nicht gedruckt.',
    'hint.invoiceTemplates.paymentTermDays':  'Fälligkeit = Rechnungsdatum + diese Tage.',
    'hint.invoiceTemplates.signatureFileId':  'Eingescannte Unterschrift, steht nach dem Schlusstext. PNG mit transparentem Hintergrund sieht am besten aus.',
    'hint.invoiceTemplates.signatureName':    'Steht unter der Unterschrift, z. B. dein Name.',
    'hint.invoiceTemplates.senderLine':       'Kleine Zeile über der Anschrift (sichtbar im Fensterumschlag). Leer: Firmenname und Adresse.',

    'placeholder.invoiceTemplates.accentColor':  '#0f6b5c',
    'placeholder.invoiceTemplates.closingText':  'Vielen Dank für Ihr Vertrauen. Bei Fragen zur Rechnung antworten Sie einfach auf diese E-Mail.\nMit freundlichen Grüßen',
    'placeholder.invoiceTemplates.footerCenter': 'info@muster-it.de\n+49 123 456789\nSteuernummer 123/456/78901',
    'placeholder.invoiceTemplates.footerLeft':   'Muster IT\nMax Mustermann\nMusterweg 1, 12345 Musterstadt',
    'placeholder.invoiceTemplates.footerRight':  'Musterbank\nIBAN DE00 1234 5678 9012 3456 78\nBIC MUSTDEXXX',
    'placeholder.invoiceTemplates.introText':    'Vielen Dank für Ihren Auftrag. Hiermit stelle ich folgende Leistungen in Rechnung:',
    'placeholder.invoiceTemplates.name':         'z. B. Standard, Agenturkunden, Englisch',
    'placeholder.invoiceTemplates.paymentTermDays': '14',
    'placeholder.invoiceTemplates.signatureName': 'Max Mustermann',
    'placeholder.invoiceTemplates.senderLine':   'Muster IT – Musterweg 1 – 12345 Musterstadt',
};

export default template;
