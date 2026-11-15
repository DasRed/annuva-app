import ApiClientError from '@/client/ApiClientError';

/**
 * Calls the app's own REST API with the session cookie. Throws ApiClientError on errors.
 */
export default async function apiFetch<T = unknown>(path: string, options: { body?: unknown; formData?: FormData; method?: string } = {}): Promise<T> {
    const response = await fetch(path, {
        body:        options.formData ?? (options.body === undefined ? undefined : JSON.stringify(options.body)),
        credentials: 'same-origin',
        headers:     options.formData === undefined && options.body !== undefined ? {'Content-Type': 'application/json'} : undefined,
        method:      options.method ?? (options.body === undefined && options.formData === undefined ? 'GET' : 'POST'),
    });
    if (response.status === 204) {
        return undefined as T;
    }
    const data = await response.json().catch(() => null) as { error?: { code: string; details: unknown; message: string } } | null;
    if (!response.ok) {
        if (response.status === 401 && typeof window !== 'undefined' && !path.startsWith('/api/auth')) {
            window.location.href = '/login';
        }
        throw new ApiClientError(response.status, data?.error?.code ?? 'error', data?.error?.message ?? response.statusText, data?.error?.details ?? null);
    }
    return data as T;
}
