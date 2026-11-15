import type pdfEn from '@/translations/en/pdf';

const pdf: Record<keyof typeof pdfEn, string> = {
    'pdf.amount':        'Betrag',
    'pdf.cancellation':  'Stornorechnung',
    'pdf.cancels':       'Diese Rechnung storniert die Rechnung {number}.',
    'pdf.date':          'Rechnungsdatum',
    'pdf.description':   'Beschreibung',
    'pdf.draft':         'ENTWURF',
    'pdf.dueDate':       'Zahlbar bis',
    'pdf.invoice':       'Rechnung',
    'pdf.net':           'Nettobetrag',
    'pdf.number':        'Rechnungsnr.',
    'pdf.paymentNote':   'Bitte überweisen Sie den Betrag bis zum {date} unter Angabe der Rechnungsnummer.',
    'pdf.position':      'Pos.',
    'pdf.quantity':      'Menge',
    'pdf.servicePeriod': 'Leistungszeitraum',
    'pdf.smallBusiness': 'Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.',
    'pdf.taxNumber':     'St.-Nr.',
    'pdf.total':         'Gesamtbetrag',
    'pdf.unitPrice':     'Einzelpreis',
    'pdf.vat':           'Umsatzsteuer',
    'pdf.vatId':         'USt-IdNr.',
};

export default pdf;
