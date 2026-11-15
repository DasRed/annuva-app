'use client';

import {useEffect, useState} from 'react';
import loadLookup from '@/client/loadLookup';
import type EntityName from '@/entity/EntityName';

/**
 * Options of a relation (id and title), e.g. all customers for a select.
 */
export default function useLookup(name: EntityName | undefined): { id: string; title: string }[] | null {
    const [options, setOptions] = useState<{ id: string; title: string }[] | null>(null);
    useEffect(() => {
        if (name === undefined) {
            return;
        }
        let active = true;
        loadLookup(name).then((result) => {
            if (active) {
                setOptions(result);
            }
        }).catch(() => {
            if (active) {
                setOptions([]);
            }
        });
        return () => {
            active = false;
        };
    }, [name]);
    return options;
}
