/**
 * Save status of a single auto-saved field.
 */
type SaveState = {
    message?: string;
    status:   'error' | 'saved' | 'saving';
};

export default SaveState;
