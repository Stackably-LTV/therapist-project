import { createServiceRoleClient } from '@/components/9a6b39502e62';
import { getAppUrl, getStripe } from '@/components/d43e063edf4e';
export async function createSessionPaymentCheckout(input) {
    const service = createServiceRoleClient();
    const stripe = getStripe();
    const { data: seekerProfile } = await service
        .from('user_profiles')
        .select('stripe_customer_id')
        .eq('user_id', input.seekerId)
        .maybeSingle();
    let seekerStripeCustomerId = typeof seekerProfile?.stripe_customer_id === 'string' ? seekerProfile.stripe_customer_id : '';
    if (!seekerStripeCustomerId) {
        const customer = await stripe.customers.create({
            email: input.seekerEmail,
            name: input.seekerName,
            metadata: {
                userId: input.seekerId,
                role: 'seeker',
            },
        });
        seekerStripeCustomerId = customer.id;
        await service
            .from('user_profiles')
            .update({ stripe_customer_id: customer.id })
            .eq('user_id', input.seekerId);
    }
    const { data: billing, error: billingError } = await service
        .from('billing_transactions')
        .insert({
        session_id: input.sessionId,
        kind: 'session',
        payer_id: input.seekerId,
        seller_id: input.therapistId,
        charge_amount: input.therapistRate.toFixed(2),
        currency: 'USD',
        payment_status: 'pending',
        payment_method: 'stripe',
        insurance_json: {},
    })
        .select('*')
        .single();
    if (billingError || !billing) {
        throw new Error(billingError?.message ?? 'Failed to create billing record');
    }
    const { data: connectAccount } = await service
        .from('billing_connect_accounts')
        .select('*')
        .eq('therapist_id', input.therapistId)
        .maybeSingle();
    const hasConnectPayout = Boolean(connectAccount?.charges_enabled && connectAccount?.stripe_account_id);
    const platformFeePercent = Number(process.env.STRIPE_PLATFORM_FEE_PERCENT ?? 15);
    const amountInCents = Math.round(input.therapistRate * 100);
    const platformFeeAmount = Math.round(amountInCents * (platformFeePercent / 100));
    const appUrl = getAppUrl(input.origin);
    const metadata = {
        billingId: billing.id,
        sessionId: input.sessionId,
        therapistId: input.therapistId,
        seekerId: input.seekerId,
        checkoutKind: 'session_booking',
    };
    const checkoutSession = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer: seekerStripeCustomerId,
        client_reference_id: input.sessionId,
        success_url: `${appUrl}${input.successPath}`,
        cancel_url: `${appUrl}${input.cancelPath}`,
        metadata,
        payment_intent_data: {
            metadata,
            ...(hasConnectPayout && {
                transfer_data: {
                    destination: connectAccount.stripe_account_id,
                },
                application_fee_amount: platformFeeAmount,
            }),
        },
        line_items: [
            {
                quantity: 1,
                price_data: {
                    currency: 'usd',
                    unit_amount: amountInCents,
                    product_data: {
                        name: `Session with ${input.therapistName}`,
                        description: `${input.durationMinutes} minute therapy session`,
                    },
                },
            },
        ],
    });
    await service
        .from('billing_transactions')
        .update({ stripe_checkout_session_id: checkoutSession.id })
        .eq('id', billing.id);
    await service
        .from('appointments')
        .update({
        session_data_json: {
            ...(input.baseSessionData ?? {}),
            billing_id: billing.id,
            stripe_checkout_session_id: checkoutSession.id,
            stripe_checkout_url: checkoutSession.url,
            payment_pending_at: new Date().toISOString(),
        },
    })
        .eq('id', input.sessionId);
    return {
        billingId: billing.id,
        checkoutSessionId: checkoutSession.id,
        url: checkoutSession.url,
    };
}
