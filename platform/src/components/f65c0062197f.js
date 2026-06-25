import 'server-only';
import { createClient } from '@/components/9a6b39502e62';
import { getStripe } from '@/components/d43e063edf4e';
import { ok } from '@/components/7ff049787825';
/**
 * Resolve the Stripe Billing Portal URL for the calling therapist. If they have
 * no Stripe customer yet, returns the in-app fallback redirect instead.
 */
export async function createBillingPortalSession(userId, appUrl) {
    const supabase = await createClient();
    const { data: subscription } = await supabase
        .from('billing_subscriptions')
        .select('stripe_customer_id')
        .eq('therapist_id', userId)
        .maybeSingle();
    if (!subscription?.stripe_customer_id) {
        return ok({ redirectUrl: `${appUrl}/therapist/billing?portal=unavailable` });
    }
    const stripe = getStripe();
    // A test-mode or deleted customer is unreachable under the live key and would
    // make the portal call throw. Treat it as "no portal yet" instead of 500ing.
    try {
        const customer = await stripe.customers.retrieve(subscription.stripe_customer_id);
        if (customer.deleted) {
            return ok({ redirectUrl: `${appUrl}/therapist/billing?portal=unavailable` });
        }
    }
    catch {
        return ok({ redirectUrl: `${appUrl}/therapist/billing?portal=unavailable` });
    }
    // Cancellation must NOT be self-serve: therapists cancel by submitting the
    // in-app cancellation questionnaire, which an admin then actions manually in
    // the Stripe dashboard. So we hand Stripe an explicit portal configuration
    // that exposes payment-method + invoice management but hides the "Cancel
    // plan" control entirely — regardless of the account's default portal config.
    const configuration = await stripe.billingPortal.configurations.create({
        business_profile: { headline: 'Manage your payment details' },
        features: {
            payment_method_update: { enabled: true },
            invoice_history: { enabled: true },
            customer_update: { enabled: true, allowed_updates: ['email', 'address', 'name'] },
            subscription_cancel: { enabled: false },
            subscription_update: { enabled: false },
        },
    });
    const portal = await stripe.billingPortal.sessions.create({
        customer: subscription.stripe_customer_id,
        configuration: configuration.id,
        return_url: `${appUrl}/therapist/billing`,
    });
    return ok({ redirectUrl: portal.url });
}
