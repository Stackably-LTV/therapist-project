import 'server-only';
import { createServiceRoleClient } from '@/components/9a6b39502e62';
import { getStripe } from '@/components/d43e063edf4e';
function toIsoFromStripeTimestamp(ts) {
    if (!ts)
        return null;
    return new Date(ts * 1000).toISOString();
}
export async function syncTherapistSubscriptionFromStripeObject(sub) {
    const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
    const supabase = createServiceRoleClient();
    let therapistId = sub.metadata?.therapistId ?? null;
    if (!therapistId) {
        console.warn(`[subscription-sync] Subscription ${sub.id} has no therapistId in metadata — falling back to customer lookup`);
        const { data: existing } = await supabase
            .from('billing_subscriptions')
            .select('therapist_id')
            .eq('stripe_customer_id', customerId)
            .maybeSingle();
        therapistId = existing?.therapist_id ?? null;
    }
    if (!therapistId) {
        const reason = `No therapistId found for Stripe subscription ${sub.id} (customer ${customerId})`;
        console.error('[subscription-sync]', reason);
        return { ok: false, reason };
    }
    const priceId = sub.items.data[0]?.price?.id;
    if (!priceId) {
        const reason = `No price on subscription items for ${sub.id}`;
        console.error('[subscription-sync]', reason);
        return { ok: false, reason };
    }
    const { data: tier } = await supabase
        .from('billing_tiers')
        .select('id')
        .or(`stripe_price_id.eq.${priceId},stripe_price_id_test.eq.${priceId}`)
        .maybeSingle();
    if (!tier) {
        const reason = `No tier found for Stripe price ${priceId}`;
        console.error('[subscription-sync]', reason);
        return { ok: false, reason };
    }
    // Stripe SDK occasionally surfaces "cancelled"; our DB check constraint uses "canceled".
    const normalizedStatus = sub.status === 'cancelled'
        ? 'canceled'
        : sub.status;
    const { error } = await supabase
        .from('billing_subscriptions')
        .upsert({
        therapist_id: therapistId,
        tier_id: tier.id,
        stripe_customer_id: customerId,
        stripe_subscription_id: sub.id,
        status: normalizedStatus,
        cancel_at_period_end: sub.cancel_at_period_end,
        current_period_end: toIsoFromStripeTimestamp(sub.items.data[0]?.current_period_end),
    }, { onConflict: 'therapist_id' });
    if (error) {
        console.error('[subscription-sync] upsert failed', error);
        return { ok: false, reason: `DB upsert failed: ${error.message}` };
    }
    return { ok: true, subscriptionId: sub.id, status: normalizedStatus, therapistId };
}
export async function syncTherapistSubscriptionFromStripeId(subscriptionId) {
    const stripe = getStripe();
    const sub = (await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['items.data.price'],
    }));
    return syncTherapistSubscriptionFromStripeObject(sub);
}
/**
 * Reconciles state on Stripe Checkout completion: retrieves the session with
 * the subscription expanded (so we make one API call instead of two), verifies
 * it's in a finalized state, then upserts our subscription row.
 *
 * Returns `ok:false` if the session isn't in a usable state. Caller should
 * surface the reason to the therapist.
 */
export async function syncTherapistSubscriptionFromCheckoutSession(checkoutSessionId) {
    const stripe = getStripe();
    let session;
    try {
        session = (await stripe.checkout.sessions.retrieve(checkoutSessionId, {
            expand: ['subscription', 'subscription.items.data.price'],
        }));
    }
    catch (err) {
        const reason = `Failed to retrieve Checkout Session ${checkoutSessionId}: ${err instanceof Error ? err.message : String(err)}`;
        console.error('[subscription-sync]', reason);
        return { ok: false, reason };
    }
    // The session must be in `complete` status (Stripe finished collecting + creating the sub).
    if (session.status !== 'complete') {
        return { ok: false, reason: `Checkout session not complete (status=${session.status})` };
    }
    if (!session.subscription || typeof session.subscription === 'string') {
        // Expand didn't return the subscription inline — fetch by ID as a fallback.
        if (typeof session.subscription === 'string') {
            return syncTherapistSubscriptionFromStripeId(session.subscription);
        }
        return { ok: false, reason: 'No subscription attached to checkout session' };
    }
    return syncTherapistSubscriptionFromStripeObject(session.subscription);
}
