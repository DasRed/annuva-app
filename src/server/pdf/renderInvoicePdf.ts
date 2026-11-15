import {renderToBuffer} from '@react-pdf/renderer';
import {createElement} from 'react';
import getDictionary from '@/i18n/getDictionary';
import translate from '@/i18n/translate';
import type InvoiceSnapshot from '@/server/invoice/InvoiceSnapshot';
import InvoiceDocument from '@/server/pdf/InvoiceDocument';

export default async function renderInvoicePdf(snapshot: InvoiceSnapshot, draft: boolean): Promise<Buffer> {
    const dictionary = getDictionary(snapshot.language);
    const t = (key: string, params?: Record<string, string | number>) => translate(dictionary, key, params);
    return renderToBuffer(createElement(InvoiceDocument, {draft, snapshot, t}) as Parameters<typeof renderToBuffer>[0]);
}
