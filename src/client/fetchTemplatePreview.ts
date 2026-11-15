/**
 * Renders a sample invoice for the given template values and returns it as object URL.
 */
export default async function fetchTemplatePreview(values: Record<string, unknown>, signal?: AbortSignal): Promise<string> {
    const response = await fetch('/api/v1/invoice-templates/preview', {
        body:        JSON.stringify(values),
        credentials: 'same-origin',
        headers:     {'Content-Type': 'application/json'},
        method:      'POST',
        signal,
    });
    if (!response.ok) {
        throw new Error(`Preview failed with status ${response.status}`);
    }
    return URL.createObjectURL(await response.blob());
}
