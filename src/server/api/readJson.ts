/**
 * Reads the JSON body; an empty body counts as `{}`.
 */
export default async function readJson(request: Request): Promise<unknown> {
    const text = await request.text();
    return text.trim() === '' ? {} : JSON.parse(text);
}
