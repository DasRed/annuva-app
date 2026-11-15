'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import ApiClientError from '@/client/ApiClientError';
import type SaveState from '@/client/SaveState';

const SAVED_VISIBLE_MS = 2000;

/**
 * Saves single fields immediately and keeps a status per field: saving → saved (cleared after a
 * moment) or error with the message from the server.
 */
export default function useAutoSave(save: (changes: Record<string, unknown>) => Promise<void>, fallbackError: string): {
    saveField: (name: string, value: unknown) => Promise<boolean>;
    states:    Record<string, SaveState>;
} {
    const [states, setStates] = useState<Record<string, SaveState>>({});
    const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

    useEffect(() => {
        const pending = timers.current;
        return () => Object.values(pending).forEach(clearTimeout);
    }, []);

    const saveField = useCallback(async (name: string, value: unknown) => {
        clearTimeout(timers.current[name]);
        setStates((current) => ({...current, [name]: {status: 'saving'}}));
        try {
            await save({[name]: value});
            setStates((current) => ({...current, [name]: {status: 'saved'}}));
            timers.current[name] = setTimeout(() => setStates((current) => {
                const next = {...current};
                delete next[name];
                return next;
            }), SAVED_VISIBLE_MS);
            return true;
        }
        catch (exception) {
            const message = exception instanceof ApiClientError ? (exception.fieldErrors[name] ?? exception.message) : fallbackError;
            setStates((current) => ({...current, [name]: {message, status: 'error'}}));
            return false;
        }
    }, [fallbackError, save]);

    return {saveField, states};
}
