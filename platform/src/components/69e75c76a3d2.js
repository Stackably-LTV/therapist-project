import { NextResponse } from 'next/server';
import { requireRole } from '@/components/3168fa71d1e4';
import { getAppUrl } from '@/components/d43e063edf4e';
import { syncTherapistSubscriptionFromCheckoutSession } from '@/components/e3acad965c66';
/**
 * Stripe redirects therapists here after Checkout success. We:
 *   1. Verify the caller is the same therapist (pending or active).
 *   2. Retrieve the Checkout Session from Stripe with the subscription expanded.
 *   3. Upsert billing_subscriptions inline (don't wait for the webhook — race
 *      condition would leave hasSubscription=false on the next page render).
 *   4. Redirect onward to the signup wizard at step 3.
 *
 * Stripe pattern docs:
 *   https://docs.stripe.com/payments/checkout/custom-success-page
 *
 * Idempotent: the upsert keys on therapist_id, so the webhook firing later
 * with the same data is a no-op.
 */
export async function GET(request) {
    const appUrl = getAppUrl(request.nextUrl.origin);
    const auth = await requireRole('therapist', { allowStatuses: ['pending', 'active'] });
    if (!auth.ok) {
        // Send unauth users to login with a generic error.
        return NextResponse.redirect(`${appUrl}/login?error=session_expired`, { status: 303 });
    }
    const sessionId = request.nextUrl.searchParams.get('session_id');
    if (!sessionId || !sessionId.startsWith('cs_')) {
        return NextResponse.redirect(`${appUrl}/login?step=2&checkout=cancelled&reason=missing_session`, { status: 303 });
    }
    const result = await syncTherapistSubscriptionFromCheckoutSession(sessionId);
    if (!result.ok) {
        console.error('[checkout/return] sync failed', {
            sessionId,
            therapistId: auth.userId,
            reason: 'reason' in result ? result.reason : 'unknown',
        });
        // Keep the therapist on step 2 so they can retry. The webhook will eventually
        // sync if Stripe really did create the subscription, but we surface the error
        // immediately rather than silently advancing.
        return NextResponse.redirect(`${appUrl}/login?step=2&checkout=cancelled&reason=verify_failed`, { status: 303 });
    }
    // Safety check: did we sync the row that belongs to the authenticated therapist?
    // (Prevents one therapist replaying another's session_id, however unlikely.)
    if (result.therapistId !== auth.userId) {
        console.error('[checkout/return] session belongs to a different therapist', {
            sessionId,
            sessionTherapistId: result.therapistId,
            callerTherapistId: auth.userId,
        });
        return NextResponse.redirect(`${appUrl}/login?step=2&checkout=cancelled&reason=mismatched_session`, { status: 303 });
    }
    return NextResponse.redirect(`${appUrl}/login?step=3&checkout=success&status=${encodeURIComponent(result.status)}`, { status: 303 });
}
