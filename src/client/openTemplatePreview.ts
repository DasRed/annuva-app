import fetchTemplatePreview from '@/client/fetchTemplatePreview';

/**
 * Opens the sample invoice in a new tab – the preview on small screens, where browsers cannot show
 * PDFs inline. The tab is opened right away so it is not blocked as a pop-up.
 */
export default async function openTemplatePreview(values: Record<string, unknown>): Promise<void> {
    const tab = window.open('', '_blank');
    try {
        const url = await fetchTemplatePreview(values);
        if (tab === null) {
            window.location.href = url;
            return;
        }
        tab.location.href = url;
    }
    catch (error) {
        tab?.close();
        throw error;
    }
}
