'use client';

import {useState} from 'react';

/**
 * Profile picture, Gravatar or – if neither exists – the initials.
 */
export default function Avatar({name, size = 36, url}: { name: string; size?: number; url: string | null }) {
    const [failed, setFailed] = useState(false);
    const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || '?';
    if (url !== null && !failed) {
        // A 404 can happen before hydration, when onError is not attached yet – check on mount as well.
        const detectEarlyError = (image: HTMLImageElement | null) => {
            if (image !== null && image.complete && image.naturalWidth === 0) {
                setFailed(true);
            }
        };
        return <img ref={detectEarlyError} src={url} alt="" width={size} height={size} onError={() => setFailed(true)} className="shrink-0 rounded-full border border-line object-cover" style={{height: size, width: size}}/>;
    }
    return (
        <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-accent-soft font-semibold text-accent-strong" style={{fontSize: size * 0.38, height: size, width: size}} aria-hidden>
            {initials}
        </span>
    );
}
