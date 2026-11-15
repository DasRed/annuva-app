const PERIOD_SECONDS = 30;

/**
 * The 30-second time step (RFC 6238 default, used by all common authenticator apps) of a moment.
 */
export default function totpStep(timeMs: number): number {
    return Math.floor(timeMs / 1000 / PERIOD_SECONDS);
}
