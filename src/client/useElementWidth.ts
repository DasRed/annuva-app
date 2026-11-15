'use client';

import {type RefObject, useEffect, useRef, useState} from 'react';

/**
 * Width of an element, updated on resize. Charts compute their geometry from it instead of using
 * fixed sizes.
 */
export default function useElementWidth<T extends HTMLElement>(fallback = 640): [RefObject<T | null>, number] {
    const ref = useRef<T>(null);
    const [width, setWidth] = useState(fallback);
    useEffect(() => {
        const element = ref.current;
        if (element === null) {
            return;
        }
        const observer = new ResizeObserver(([entry]) => setWidth(Math.max(240, Math.floor(entry.contentRect.width))));
        observer.observe(element);
        return () => observer.disconnect();
    }, []);
    return [ref, width];
}
