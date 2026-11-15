const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

const attempts = new Map<string, number[]>();

/**
 * Simple in-memory brute-force protection for the login, per IP and e-mail.
 */
const loginRateLimit = {
    isBlocked(key: string): boolean {
        const now = Date.now();
        const recent = (attempts.get(key) ?? []).filter((time) => now - time < WINDOW_MS);
        attempts.set(key, recent);
        return recent.length >= MAX_ATTEMPTS;
    },

    recordFailure(key: string): void {
        attempts.set(key, [...(attempts.get(key) ?? []), Date.now()]);
    },

    reset(key: string): void {
        attempts.delete(key);
    },
};

export default loginRateLimit;
