/**
 * Error returned by the API, with field errors for forms.
 */
export default class ApiClientError extends Error {
    constructor(
        readonly status: number,
        readonly code: string,
        message: string,
        readonly details: unknown,
    ) {
        super(message);
        this.name = 'ApiClientError';
    }

    /** Field errors as a map field → message (from validation details). */
    get fieldErrors(): Record<string, string> {
        const result: Record<string, string> = {};
        if (Array.isArray(this.details)) {
            for (const entry of this.details as { field?: string; message?: string }[]) {
                if (typeof entry.field === 'string' && entry.field !== '') {
                    result[entry.field] = entry.message ?? this.message;
                }
            }
        }
        else if (this.details !== null && typeof this.details === 'object' && 'field' in this.details) {
            result[String((this.details as { field: string }).field)] = this.message;
        }
        return result;
    }
}
