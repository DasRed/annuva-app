import {useState} from 'react';

/**
 * Today's date (YYYY-MM-DD), fixed for the lifetime of the component.
 */
export default function useToday(): string {
    const [today] = useState(() => new Date().toISOString().slice(0, 10));
    return today;
}
