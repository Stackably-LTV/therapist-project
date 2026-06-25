import 'server-only';
import { createClient, createServiceRoleClient } from '@/components/9a6b39502e62';
import { getStripe, isStripeTestMode } from '@/components/d43e063edf4e';
import { ok, fail } from '@/components/7ff049787825';
const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing', 'past_due']);
function safeReturnPath(value, fallback) {
    if (!value)
        return fallback;
    // Only allow internal absolute paths to avoid open-redirect.
    return value.startsWith('/') && !value.startsWith('//') ? value : fallback;
}
/**
 * Onboarding-time subscription checkout for therapists. Resolves the tier +
 * Stripe price, reuses or creates a Stripe customer, upserts a placeholder
 * subscription row, then creates a Checkout Session (or Billing Portal session
 * if they already have a live subscription). Returns the URL to 303-redirect to.
 */
export async function createSubscriptionCheckout(userId, appUrl, input) {
    const { tierCode, successPath, cancelPath } = input;
    if (!tierCode) {
        return fail(400, 'Tier code is required');
    }
    const supabase = await createClient();
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('user_id', userId)
        .maybeSingle();
    const serviceClient = createServiceRoleClient();
    const { data: authResult } = await serviceClient.auth.admin.getUserById(userId);
    const therapistEmail = authResult?.user?.email;
    if (!therapistEmail) {
        return fail(404, 'Therapist email not found');
    }
    const testMode = isStripeTestMode();
    const { data: tier } = await supabase
        .from('billing_tiers')
        .select('id, code, name, is_active, trial_period_days, stripe_price_id, stripe_price_id_test')
        .eq('code', tierCode)
        .maybeSingle();
    if (!tier || !tier.is_active) {
        return fail(404, 'Subscription tier is unavailable');
    }
    const priceId = testMode ? tier.stripe_price_id_test : tier.stripe_price_id;
    if (!priceId) {
        return fail(500, `Subscription tier "${tier.code}" is missing a ${testMode ? 'test' : 'live'} Stripe price ID`);
    }
    const stripe = getStripe();
    const { data: existingSubscription } = await supabase
        .from('billing_subscriptions')
        .select('*')
        .eq('therapist_id', userId)
        .maybeSingle();
    // Validate any stored Stripe customer before reusing it. A customer created in
    // test mode (or one that was deleted) is unreachable under the live key, which
    // would make Checkout throw "No such customer" and surface as "Failed to start
    // checkout". If it's gone, drop it and create a fresh one — the same self-heal
    // the Connect flow uses for accounts after a test→live switch.
    let stripeCustomerId = existingSubscription?.stripe_customer_id ?? null;
    if (stripeCustomerId) {
        try {
            const existingCustomer = await stripe.customers.retrieve(stripeCustomerId);
            if (existingCustomer.deleted)
                stripeCustomerId = null;
        }
        catch {
            stripeCustomerId = null;
        }
    }
    // If the therapist already has a live, reachable subscription, push them to the
    // Billing Portal to change plan instead of starting a new Checkout. If the
    // stored subscription is stale (e.g. a test-mode id), fall through to a fresh
    // Checkout rather than erroring.
    if (stripeCustomerId &&
        existingSubscription?.stripe_subscription_id &&
        ACTIVE_SUBSCRIPTION_STATUSES.has(existingSubscription.status)) {
        try {
            await stripe.subscriptions.retrieve(existingSubscription.stripe_subscription_id);
            const portal = await stripe.billingPortal.sessions.create({
                customer: stripeCustomerId,
                return_url: `${appUrl}${safeReturnPath(successPath, '/therapist/billing')}`,
            });
            return ok({ redirectUrl: portal.url });
        }
        catch {
            // Stale/unreachable subscription — start a clean Checkout below.
        }
    }
    if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
            email: therapistEmail,
            name: profile?.full_name || undefined,
            metadata: {
                therapistId: userId,
                role: 'therapist',
            },
        });
        stripeCustomerId = customer.id;
    }
    // Reaching this point means there's no active, reachable subscription to manage,
    // so write a clean placeholder. The checkout return handler / webhook fills in
    // the real subscription id, status, and period once payment completes — keeping
    // any prior (possibly stale) values here would mislabel the row.
    const svc = createServiceRoleClient();
    await svc.from('billing_subscriptions').upsert({
        therapist_id: userId,
        tier_id: tier.id,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: null,
        status: 'incomplete',
        cancel_at_period_end: false,
        current_period_end: null,
    }, { onConflict: 'therapist_id' });
    const trialDays = tier.trial_period_days ?? 0;
    // For the onboarding flow, route success through our /return handler so we
    // can verify + sync the subscription before showing step 3. Other callers
    // (e.g. upgrade from dashboard) pass an explicit successPath and skip this.
    const isOnboardingFlow = successPath?.startsWith('/login?step=3') ?? false;
    const successUrl = isOnboardingFlow
        ? `${appUrl}/api/billing/subscription/checkout/return?session_id={CHECKOUT_SESSION_ID}`
        : `${appUrl}${safeReturnPath(successPath, '/therapist/billing?checkout=success')}`;
    const cancelUrl = `${appUrl}${safeReturnPath(cancelPath, '/therapist/billing?checkout=cancelled')}`;
    const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: stripeCustomerId,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        allow_promotion_codes: true,
        client_reference_id: userId,
        // Card is captured up-front even though we apply a trial. Standard SaaS pattern:
        // higher conversion to paid + protects against trial abuse.
        payment_method_collection: 'always',
        metadata: {
            therapistId: userId,
            tierCode: tier.code,
            subscriptionTierId: tier.id,
            checkoutKind: 'therapist_subscription',
        },
        subscription_data: {
            ...(trialDays > 0 ? { trial_period_days: trialDays } : {}),
            metadata: {
                therapistId: userId,
                tierCode: tier.code,
                subscriptionTierId: tier.id,
            },
        },
    });
    if (!session.url) {
        return fail(500, 'Stripe checkout URL missing');
    }
    return ok({ redirectUrl: session.url });
}
