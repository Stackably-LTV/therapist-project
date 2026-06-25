import 'server-only';
import { createServiceRoleClient } from '@/components/9a6b39502e62';
import { getStripe } from '@/components/d43e063edf4e';
import { finalizeSessionBooking } from '@/components/127cbf6acd66';
import { syncTherapistSubscriptionFromStripeId } from '@/components/e3acad965c66';
function getConnectOnboardingStatus(account) {
    if (account.charges_enabled && account.payouts_enabled)
        return 'completed';
    if (account.requirements?.disabled_reason)
        return 'restricted';
    if ((account.requirements?.currently_due?.length || 0) > 0)
        return 'in_progress';
    return 'pending';
}
async function completeSessionBookingCheckout(session) {
    const billingId = session.metadata?.billingId;
    const sessionId = session.metadata?.sessionId;
    if (!billingId || !sessionId)
        return;
    if (session.payment_status !== 'paid') {
        return;
    }
    const supabase = createServiceRoleClient();
    const paymentIntentId = typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id;
    let chargeId = typeof session.payment_intent === 'object' && typeof session.payment_intent?.latest_charge === 'string'
        ? session.payment_intent.latest_charge
        : null;
    if (paymentIntentId && !chargeId) {
        const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId);
        chargeId =
            typeof paymentIntent.latest_charge === 'string'
                ? paymentIntent.latest_charge
                : paymentIntent.latest_charge?.id ?? null;
    }
    await supabase
        .from('billing_transactions')
        .update({
        payment_status: 'completed',
        payment_method: 'stripe',
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: paymentIntentId,
        stripe_charge_id: chargeId,
    })
        .eq('id', billingId);
    const { data: localSession } = await supabase
        .from('appointments')
        .select('status')
        .eq('id', sessionId)
        .maybeSingle();
    if (localSession?.status === 'pending_payment') {
        await finalizeSessionBooking(sessionId);
    }
}
async function failSessionBookingCheckout(payload) {
    const supabase = createServiceRoleClient();
    let query = supabase
        .from('billing_transactions')
        .select('id, session_id')
        .not('session_id', 'is', null);
    if (payload.stripeCheckoutSessionId) {
        query = query.eq('stripe_checkout_session_id', payload.stripeCheckoutSessionId);
    }
    else if (payload.stripePaymentIntentId) {
        query = query.eq('stripe_payment_intent_id', payload.stripePaymentIntentId);
    }
    else {
        return;
    }
    const { data: billing } = await query.maybeSingle();
    if (!billing)
        return;
    await supabase
        .from('billing_transactions')
        .update({ payment_status: 'failed' })
        .eq('id', billing.id);
    if (billing.session_id) {
        const { data: appointment } = await supabase
            .from('appointments')
            .select('session_data_json')
            .eq('id', billing.session_id)
            .maybeSingle();
        await supabase
            .from('appointments')
            .update({
            session_data_json: {
                ...((appointment?.session_data_json || {})),
                payment_status: 'failed',
            },
        })
            .eq('id', billing.session_id);
    }
}
async function refundBilling(chargeId) {
    const stripe = getStripe();
    const charge = await stripe.charges.retrieve(chargeId);
    if (!charge.payment_intent)
        return;
    const supabase = createServiceRoleClient();
    const paymentIntentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent.id;
    const { data: billing } = await supabase
        .from('billing_transactions')
        .select('id, session_id')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .maybeSingle();
    if (!billing)
        return;
    // Update billing transaction
    await supabase
        .from('billing_transactions')
        .update({
        payment_status: 'refunded',
        stripe_charge_id: charge.id,
    })
        .eq('id', billing.id);
    // If this is a session booking, also record in appointment metadata
    if (billing.session_id) {
        const { data: appointment } = await supabase
            .from('appointments')
            .select('session_data_json')
            .eq('id', billing.session_id)
            .maybeSingle();
        if (appointment) {
            await supabase
                .from('appointments')
                .update({
                session_data_json: {
                    ...((appointment.session_data_json || {})),
                    refund_status: 'completed',
                    refunded_via_webhook: true,
                    refunded_at: new Date().toISOString(),
                },
            })
                .eq('id', billing.session_id);
        }
    }
}
async function syncConnectAccount(account) {
    const supabase = createServiceRoleClient();
    const { data: record } = await supabase
        .from('billing_connect_accounts')
        .select('therapist_id')
        .eq('stripe_account_id', account.id)
        .maybeSingle();
    if (!record)
        return;
    await supabase
        .from('billing_connect_accounts')
        .update({
        onboarding_status: getConnectOnboardingStatus(account),
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
    })
        .eq('therapist_id', record.therapist_id);
}
/**
 * Process a Stripe webhook event whose signature the route handler has already
 * verified. Owns idempotency (check-then-record) and event dispatch. Returns the
 * status + body the handler should respond with.
 */
export async function handleStripeWebhookEvent(event) {
    const supabase = createServiceRoleClient();
    // Idempotency guard: check first, then record only after handler success.
    try {
        const { data: processed, error: idempErr } = await supabase
            .from('stripe_events_processed')
            .select('id')
            .eq('id', event.id)
            .maybeSingle();
        if (idempErr) {
            console.error('[stripe-webhook] idempotency log failed', idempErr);
            // Still return 200 to avoid Stripe retries on a non-handler error
            return { status: 200, body: { received: true, idempLogFailed: true } };
        }
        if (processed) {
            return { status: 200, body: { received: true, duplicate: true } };
        }
    }
    catch (error) {
        console.error('[stripe-webhook] idempotency check exception', error);
        // Still return 200 to avoid Stripe retries
        return { status: 200, body: { received: true, idempCheckFailed: true } };
    }
    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const checkoutKind = session.metadata?.checkoutKind;
                if (checkoutKind === 'therapist_subscription' && typeof session.subscription === 'string') {
                    await syncTherapistSubscriptionFromStripeId(session.subscription);
                }
                if (checkoutKind === 'session_booking') {
                    await completeSessionBookingCheckout(session);
                }
                break;
            }
            case 'checkout.session.async_payment_succeeded': {
                const session = event.data.object;
                if (session.metadata?.checkoutKind === 'session_booking') {
                    await completeSessionBookingCheckout(session);
                }
                break;
            }
            case 'checkout.session.async_payment_failed': {
                const session = event.data.object;
                await failSessionBookingCheckout({
                    stripeCheckoutSessionId: session.id,
                    stripePaymentIntentId: typeof session.payment_intent === 'string'
                        ? session.payment_intent
                        : session.payment_intent?.id,
                });
                break;
            }
            case 'charge.refunded': {
                const charge = event.data.object;
                await refundBilling(charge.id);
                break;
            }
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                await syncTherapistSubscriptionFromStripeId(subscription.id);
                break;
            }
            case 'account.updated': {
                const account = event.data.object;
                await syncConnectAccount(account);
                break;
            }
            default:
                break;
        }
        const { error: insertProcessedError } = await supabase
            .from('stripe_events_processed')
            .insert({ id: event.id, type: event.type });
        if (insertProcessedError && insertProcessedError.code !== '23505') {
            console.error('[stripe-webhook] idempotency insert failed', insertProcessedError);
            return { status: 500, body: { error: 'Webhook idempotency insert failed' } };
        }
        return { status: 200, body: { received: true } };
    }
    catch (error) {
        console.error('[api/payments/webhook] handler error', error);
        return { status: 500, body: { error: 'Webhook handling failed' } };
    }
}
