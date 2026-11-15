/**
 * Fallback label for a field without translation: "nextInvoiceDate" → "Next invoice date".
 */
export default function humanize(name: string): string {
    const words = name.replace(/Id$/, '').replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim().toLowerCase();
    return words.charAt(0).toUpperCase() + words.slice(1);
}
