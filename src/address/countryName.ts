const displayNames = new Map<string, Intl.DisplayNames | null>();

function namesFor(language: string): Intl.DisplayNames | null {
    if (!displayNames.has(language)) {
        try {
            displayNames.set(language, new Intl.DisplayNames([language], {type: 'region'}));
        }
        catch {
            displayNames.set(language, null);
        }
    }
    return displayNames.get(language) ?? null;
}

/**
 * Name of a country (ISO 3166-1 alpha-2 code) in the given language; the code if unknown.
 */
export default function countryName(code: string, language: string): string {
    try {
        return namesFor(language)?.of(code) ?? code;
    }
    catch {
        return code;
    }
}
