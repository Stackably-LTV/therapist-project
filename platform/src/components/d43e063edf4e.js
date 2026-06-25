import Stripe from 'stripe';
let stripeSingleton = null;
export function getStripe() {
    if (stripeSingleton)
        return stripeSingleton;
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
        throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    // Let the SDK use its bundled API version (matches installed stripe package)
    stripeSingleton = new Stripe(secretKey);
    return stripeSingleton;
}
/**
 * Whether the configured Stripe secret key is in test mode.
 * Used to pick the matching test/live Stripe price ID from billing_tiers.
 */
export function isStripeTestMode() {
    const key = process.env.STRIPE_SECRET_KEY ?? '';
    // Live keys: sk_live_*, rk_live_*. Test keys: sk_test_*, rk_test_*.
    return key.includes('_test_');
}
/**
 * Resolves the public base URL for Stripe redirects.
 *
 * In production: use NEXT_PUBLIC_APP_URL / APP_URL (your real domain).
 * In dev: prefer the actual request origin (e.g. http://localhost:3000) so
 *   Stripe redirects back to localhost instead of your prod domain — even if
 *   NEXT_PUBLIC_APP_URL is set to prod for build-time use elsewhere.
 *
 * Override knob: set STRIPE_REDIRECT_USE_REQUEST_ORIGIN=true to force the
 * request-origin path in any environment (useful for preview deploys).
 */
export function getAppUrl(origin) {
    const forceRequestOrigin = process.env.STRIPE_REDIRECT_USE_REQUEST_ORIGIN === 'true';
    const isDev = process.env.NODE_ENV !== 'production';
    const preferRequestOrigin = forceRequestOrigin || isDev;
    const url = (preferRequestOrigin && origin) ||
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.APP_URL ||
        origin ||
        'http://localhost:3000';
    return url.replace(/\/$/, '');
}
export function toStripeTimestamp(dateLike) {
    if (!dateLike)
        return null;
    const date = typeof dateLike === 'string' ? new Date(dateLike) : dateLike;
    if (Number.isNaN(date.getTime()))
        return null;
    return Math.floor(date.getTime() / 1000);
}
export function dollarsToCents(amount) {
    return Math.round(amount * 100);
}
