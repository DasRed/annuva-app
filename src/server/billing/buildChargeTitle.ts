/**
 * Title of a recurring charge on an invoice line: the service label followed by the description.
 * The label is left out when the description already contains it, so "Hosting Website" does not
 * become "Hosting Hosting Website".
 */
export default function buildChargeTitle(label: string, description: string | null | undefined): string {
    const text = description?.trim() ?? '';
    if (text === '') {
        return label;
    }
    if (text.toLocaleLowerCase().includes(label.toLocaleLowerCase())) {
        return text;
    }
    return `${label} ${text}`;
}
