import { createServiceRoleClient } from '@/components/9a6b39502e62';
/**
 * Session payments are captured by Stripe Checkout before video access unlocks.
 * This remains as an idempotent compatibility hook for completion flows.
 */
export async function capturePaymentForSession(sessionId) {
    const supabase = createServiceRoleClient();
    const { data: billing, error: billingError } = await supabase
        .from('billing_transactions')
        .select('id, payment_status, stripe_payment_intent_id')
        .eq('session_id', sessionId)
        .maybeSingle();
    if (billingError) {
        return { ok: false, error: `Billing lookup failed: ${billingError.message}` };
    }
    if (!billing) {
        return { ok: true, captured: false, reason: 'No billing record (free session).' };
    }
    if (billing.payment_status === 'completed') {
        return { ok: true, captured: false, reason: 'Already captured.' };
    }
    return {
        ok: true,
        captured: false,
        reason: `Cannot capture: billing status is ${billing.payment_status}.`,
    };
}
/**
 * Legacy manual-capture compatibility hook. New paid sessions are charged by
 * Checkout immediately, so cancellations should use refund.service.ts.
 */
export async function voidAuthForSession(sessionId) {
    const supabase = createServiceRoleClient();
    const { data: billing, error: billingError } = await supabase
        .from('billing_transactions')
        .select('id, payment_status, stripe_payment_intent_id')
        .eq('session_id', sessionId)
        .maybeSingle();
    if (billingError) {
        return { ok: false, error: `Billing lookup failed: ${billingError.message}` };
    }
    if (!billing || billing.payment_status !== 'pending') {
        return { ok: true, captured: false, reason: 'No outstanding auth to void.' };
    }
    await supabase
        .from('billing_transactions')
        .update({ payment_status: 'cancelled' })
        .eq('id', billing.id);
    return { ok: true, captured: false, reason: 'Pending payment cancelled.' };
}
