import { createServiceRoleClient } from '@/components/9a6b39502e62';
import { getTherapistSubscriptionSummary } from '@/components/c5276438fd9f';
import { refreshConnectAccountStatus } from '@/components/6383a59c9ee0';
/**
 * Check if a therapist's Stripe Connect account is ready to receive payouts.
 * A therapist is "payout ready" only when:
 * - A billing_connect_accounts row exists
 * - charges_enabled = true
 * - payouts_enabled = true
 */
export async function isTherapistPayoutReady(therapistId) {
    const supabase = createServiceRoleClient();
    const { data: connectAccount } = await supabase
        .from('billing_connect_accounts')
        .select('charges_enabled, payouts_enabled')
        .eq('therapist_id', therapistId)
        .maybeSingle();
    // No Connect account row
    if (!connectAccount) {
        return { ready: false, reason: 'not_connected' };
    }
    // Charges not enabled
    if (!connectAccount.charges_enabled) {
        return { ready: false, reason: 'charges_disabled' };
    }
    // Payouts not enabled
    if (!connectAccount.payouts_enabled) {
        return { ready: false, reason: 'payouts_disabled' };
    }
    // All conditions met
    return { ready: true };
}
/**
 * Decide whether Stripe Connect payout setup should block booking this therapist.
 *
 * Payout setup only matters for therapists who actually take a card payment — i.e.
 * they're on a billing-enabled tier AND have a non-zero session rate. Free therapists
 * (no `billing` feature, or a $0 rate) never run a charge, so they must stay bookable
 * even without a Connect account. When the therapist does charge but our stored Connect
 * row looks not-ready, re-sync from Stripe once before blocking, so a stale row doesn't
 * wrongly stop a ready therapist.
 */
export async function resolveBookingPayoutGate(therapistId, therapistRate) {
    const summary = await getTherapistSubscriptionSummary(therapistId);
    const charges = summary.features.includes('billing') && Number(therapistRate ?? 0) > 0;
    // Free therapists never need a payout account — booking is always allowed.
    if (!charges)
        return { blocked: false, message: '' };
    let payoutCheck = await isTherapistPayoutReady(therapistId);
    if (!payoutCheck.ready && payoutCheck.reason !== 'not_connected') {
        // Stored row looks stale — pull live status from Stripe once before blocking.
        await refreshConnectAccountStatus(therapistId);
        payoutCheck = await isTherapistPayoutReady(therapistId);
    }
    if (payoutCheck.ready)
        return { blocked: false, message: '' };
    return { blocked: true, message: getPayoutReadinessMessage(payoutCheck.reason) };
}
/**
 * Convert a payout readiness reason to a user-facing message.
 */
export function getPayoutReadinessMessage(reason) {
    switch (reason) {
        case 'not_connected':
            return "This therapist hasn't completed payment setup yet.";
        case 'charges_disabled':
            return "This therapist isn't currently accepting payments. Please check back soon.";
        case 'payouts_disabled':
            return "This therapist's payment account needs review. Please check back soon.";
        default:
            return "Payment setup is incomplete. Please try again later.";
    }
}
