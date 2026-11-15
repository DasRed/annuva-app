'use client';

import {useEffect, useMemo, useRef, useState} from 'react';
import fetchTemplatePreview from '@/client/fetchTemplatePreview';

const CACHE_SIZE = 20;

/**
 * Live PDF preview of invoice template values: renders after a short pause, keeps the last good
 * preview while a new one is rendered and caches recent results (e.g. for hovering a list).
 */
export default function useTemplatePreview(values: Record<string, unknown> | null, delay = 500): { error: boolean; loading: boolean; url: string | null } {
    const key = useMemo(() => (values === null ? null : JSON.stringify(values)), [values]);
    const cache = useRef(new Map<string, string>());
    const [state, setState] = useState<{ error: boolean; loading: boolean; url: string | null }>({error: false, loading: false, url: null});

    useEffect(() => {
        const urls = cache.current;
        return () => urls.forEach((url) => URL.revokeObjectURL(url));
    }, []);

    useEffect(() => {
        if (key === null) {
            return;
        }
        const controller = new AbortController();
        const cached = cache.current.get(key);
        const timer = setTimeout(async () => {
            if (cached !== undefined) {
                setState({error: false, loading: false, url: cached});
                return;
            }
            setState((current) => ({...current, loading: true}));
            try {
                const url = await fetchTemplatePreview(JSON.parse(key) as Record<string, unknown>, controller.signal);
                cache.current.set(key, url);
                if (cache.current.size > CACHE_SIZE) {
                    const [oldest] = cache.current.keys();
                    URL.revokeObjectURL(cache.current.get(oldest)!);
                    cache.current.delete(oldest);
                }
                setState({error: false, loading: false, url});
            }
            catch {
                if (!controller.signal.aborted) {
                    setState((current) => ({...current, error: true, loading: false}));
                }
            }
        }, cached !== undefined ? 0 : delay);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [delay, key]);

    return state;
}
