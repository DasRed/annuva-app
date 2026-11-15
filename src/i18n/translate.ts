/**
 * Looks up a translation and replaces `{name}` placeholders. Unknown keys return the key itself,
 * so a missing translation is visible but never breaks the UI.
 */
export default function translate(dictionary: Readonly<Record<string, string>>, key: string, params?: Record<string, string | number>): string {
    const text = dictionary[key] ?? key;
    if (params === undefined) {
        return text;
    }
    return text.replace(/\{(\w+)\}/g, (match, name: string) => (params[name] === undefined ? match : String(params[name])));
}
