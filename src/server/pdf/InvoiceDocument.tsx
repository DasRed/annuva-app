import {Document, Image, Page, StyleSheet, Text, View} from '@react-pdf/renderer';
import formatDate from '@/format/formatDate';
import formatMoney from '@/format/formatMoney';
import formatNumber from '@/format/formatNumber';
import type InvoiceSnapshot from '@/server/invoice/InvoiceSnapshot';


const styles = StyleSheet.create({
    address:       {fontSize: 10, lineHeight: 1.4, marginTop: 4},
    amount:        {textAlign: 'right', width: 80},
    draft:         {color: '#c0392b', fontSize: 60, left: 120, opacity: 0.15, position: 'absolute', top: 340, transform: 'rotate(-30deg)'},
    footer:        {borderTopColor: '#e4e0d7', borderTopWidth: 1, bottom: 30, flexDirection: 'row', fontSize: 7.5, gap: 12, left: 50, lineHeight: 1.4, paddingTop: 8, position: 'absolute', right: 50},
    footerColumn:  {flex: 1},
    header:        {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40},
    logo:          {maxHeight: 60, maxWidth: 180, objectFit: 'contain'},
    meta:          {fontSize: 9, marginTop: 30},
    metaLabel:     {color: '#6f6b63', width: 110},
    metaRow:       {flexDirection: 'row', marginBottom: 2},
    note:          {color: '#555555', fontSize: 9, marginTop: 14},
    page:          {color: '#1c1c1c', fontFamily: 'Helvetica', fontSize: 10, paddingBottom: 110, paddingHorizontal: 50, paddingTop: 45},
    position:      {width: 24},
    quantity:      {textAlign: 'right', width: 50},
    row:           {borderBottomColor: '#e4e0d7', borderBottomWidth: 0.5, flexDirection: 'row', paddingVertical: 5},
    sender:        {color: '#6f6b63', fontSize: 7.5, marginBottom: 6, textDecoration: 'underline'},
    tableHead:     {borderBottomWidth: 1, flexDirection: 'row', fontFamily: 'Helvetica-Bold', fontSize: 9, paddingBottom: 4},
    text:          {flex: 1, paddingRight: 8},
    title:         {fontFamily: 'Helvetica-Bold', fontSize: 18, marginBottom: 12, marginTop: 30},
    totalLabel:    {textAlign: 'right', width: 150},
    totalRow:      {flexDirection: 'row', justifyContent: 'flex-end', paddingVertical: 2},
    totalStrong:   {fontFamily: 'Helvetica-Bold'},
    totalValue:    {textAlign: 'right', width: 90},
    unitPrice:     {textAlign: 'right', width: 80},
});

/**
 * PDF layout of an invoice (DIN-5008-like: sender line, address window, meta block, positions).
 */
export default function InvoiceDocument({draft, snapshot, t}: {
    draft: boolean;
    snapshot: InvoiceSnapshot;
    t: (key: string, params?: Record<string, string | number>) => string;
}) {
    const money = (cents: number) => formatMoney(cents, snapshot.locale, snapshot.currency);
    const date = (value: string | null) => formatDate(value, snapshot.locale);
    const accent = {color: snapshot.template.accentColor};
    const title = snapshot.cancelsNumber === null ? t('pdf.invoice') : t('pdf.cancellation');

    return (
        <Document title={`${title} ${snapshot.number ?? ''}`.trim()} author={snapshot.tenant.companyName}>
            <Page size="A4" style={styles.page}>
                {draft ? <Text style={styles.draft} fixed>{t('pdf.draft')}</Text> : null}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.sender}>{snapshot.template.senderLine ?? [snapshot.tenant.companyName, snapshot.tenant.address?.replaceAll('\n', ', ')].filter(Boolean).join(' · ')}</Text>
                        <Text style={{fontFamily: 'Helvetica-Bold'}}>{snapshot.recipient.name}</Text>
                        {snapshot.recipient.address !== null ? <Text style={styles.address}>{snapshot.recipient.address}</Text> : null}
                    </View>
                    {snapshot.template.logo !== null ? <Image src={snapshot.template.logo} style={styles.logo}/> : <Text style={[{fontFamily: 'Helvetica-Bold', fontSize: 14}, accent]}>{snapshot.tenant.companyName}</Text>}
                </View>

                <View style={styles.meta}>
                    <View style={styles.metaRow}><Text style={styles.metaLabel}>{t('pdf.number')}</Text><Text>{snapshot.number ?? '–'}</Text></View>
                    <View style={styles.metaRow}><Text style={styles.metaLabel}>{t('pdf.date')}</Text><Text>{date(snapshot.date)}</Text></View>
                    {snapshot.serviceDateFrom !== null ? (
                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>{t('pdf.servicePeriod')}</Text>
                            <Text>{snapshot.serviceDateTo !== null && snapshot.serviceDateTo !== snapshot.serviceDateFrom ? `${date(snapshot.serviceDateFrom)} – ${date(snapshot.serviceDateTo)}` : date(snapshot.serviceDateFrom)}</Text>
                        </View>
                    ) : null}
                    {snapshot.dueDate !== null && snapshot.cancelsNumber === null ? <View style={styles.metaRow}><Text style={styles.metaLabel}>{t('pdf.dueDate')}</Text><Text>{date(snapshot.dueDate)}</Text></View> : null}
                    {snapshot.tenant.vatId !== null ? <View style={styles.metaRow}><Text style={styles.metaLabel}>{t('pdf.vatId')}</Text><Text>{snapshot.tenant.vatId}</Text></View> : null}
                </View>

                <Text style={[styles.title, accent]}>{title} {snapshot.number ?? ''}</Text>
                {snapshot.cancelsNumber !== null ? <Text style={{marginBottom: 8}}>{t('pdf.cancels', {number: snapshot.cancelsNumber})}</Text> : null}
                <Text style={{fontFamily: 'Helvetica-Bold', marginBottom: 8}}>{snapshot.description}</Text>
                {snapshot.template.introText !== null ? <Text style={{lineHeight: 1.4, marginBottom: 14}}>{snapshot.template.introText}</Text> : null}

                <View style={styles.tableHead}>
                    <Text style={styles.position}>{t('pdf.position')}</Text>
                    <Text style={styles.text}>{t('pdf.description')}</Text>
                    <Text style={styles.quantity}>{t('pdf.quantity')}</Text>
                    <Text style={styles.unitPrice}>{t('pdf.unitPrice')}</Text>
                    <Text style={styles.amount}>{t('pdf.amount')}</Text>
                </View>
                {snapshot.lines.map((line, index) => (
                    <View key={index} style={styles.row} wrap={false}>
                        <Text style={styles.position}>{index + 1}</Text>
                        <Text style={styles.text}>{line.description}</Text>
                        <Text style={styles.quantity}>{formatNumber(line.quantity / 100, snapshot.locale)}</Text>
                        <Text style={styles.unitPrice}>{money(line.unitPrice)}</Text>
                        <Text style={styles.amount}>{money(line.net)}</Text>
                    </View>
                ))}

                <View style={{marginTop: 10}} wrap={false}>
                    {snapshot.vatMode === 'regular' ? (
                        <>
                            <View style={styles.totalRow}><Text style={styles.totalLabel}>{t('pdf.net')}</Text><Text style={styles.totalValue}>{money(snapshot.net)}</Text></View>
                            <View style={styles.totalRow}><Text style={styles.totalLabel}>{t('pdf.vat')}</Text><Text style={styles.totalValue}>{money(snapshot.tax)}</Text></View>
                        </>
                    ) : null}
                    <View style={styles.totalRow}>
                        <Text style={[styles.totalLabel, styles.totalStrong]}>{t('pdf.total')}</Text>
                        <Text style={[styles.totalValue, styles.totalStrong]}>{money(snapshot.gross)}</Text>
                    </View>
                </View>

                {snapshot.vatMode === 'small_business' ? <Text style={styles.note}>{t('pdf.smallBusiness')}</Text> : null}
                {snapshot.cancelsNumber === null && snapshot.dueDate !== null ? <Text style={styles.note}>{t('pdf.paymentNote', {date: date(snapshot.dueDate)})}</Text> : null}
                {snapshot.notes !== null ? <Text style={styles.note}>{snapshot.notes}</Text> : null}
                {snapshot.template.closingText !== null ? <Text style={[styles.note, {color: '#1c1c1c'}]}>{snapshot.template.closingText}</Text> : null}

                <View style={styles.footer} fixed>
                    <Text style={styles.footerColumn}>{snapshot.template.footerLeft ?? [snapshot.tenant.companyName, snapshot.tenant.address].filter(Boolean).join('\n')}</Text>
                    <Text style={styles.footerColumn}>{snapshot.template.footerCenter ?? [snapshot.tenant.email, snapshot.tenant.phone, snapshot.tenant.website, snapshot.tenant.taxNumber === null ? null : `${t('pdf.taxNumber')}: ${snapshot.tenant.taxNumber}`].filter(Boolean).join('\n')}</Text>
                    <Text style={styles.footerColumn}>{snapshot.template.footerRight ?? [snapshot.tenant.bankName, snapshot.tenant.iban === null ? null : `IBAN ${snapshot.tenant.iban}`, snapshot.tenant.bic === null ? null : `BIC ${snapshot.tenant.bic}`].filter(Boolean).join('\n')}</Text>
                </View>
            </Page>
        </Document>
    );
}
