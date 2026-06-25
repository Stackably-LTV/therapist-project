import { createClient, createServiceRoleClient } from '@/components/9a6b39502e62';
import { getStripe } from '@/components/d43e063edf4e';
/**
 * Refund policy configuration.
 * Only auto-refund if cancelled >= 24 hours before scheduled_at.
 * Within 24 hours, mark as 'cancelled' (no refund) for admin review.
 */
const REFUND_GRACE_PERIOD_HOURS = 24;
export class RefundService {
    /**
     * Process refund for a cancelled appointment.
     *
     * - If cancelled >= 24 hours before scheduled_at: issue Stripe refund immediately
     * - If cancelled < 24 hours before scheduled_at: mark payment_status as 'cancelled' for admin review
     * - Returns early if no paid appointment found
     */
    async processRefundForCancelledAppointment(sessionId) {
        try {
            const supabase = await createClient();
            // Fetch appointment and billing info
            const { data: appointment, error: appointmentError } = await supabase
                .from('appointments')
                .select('id, scheduled_at, status, session_data_json')
                .eq('id', sessionId)
                .maybeSingle();
            if (appointmentError || !appointment) {
                return {
                    refunded: false,
                    status: 'failed',
                    reason: `Appointment not found: ${appointmentError?.message}`,
                };
            }
            // Find billing transaction
            const { data: billing, error: billingError } = await supabase
                .from('billing_transactions')
                .select('id, payment_status, stripe_payment_intent_id, stripe_charge_id')
                .eq('session_id', sessionId)
                .maybeSingle();
            if (billingError) {
                return {
                    refunded: false,
                    status: 'failed',
                    reason: `Billing lookup failed: ${billingError.message}`,
                };
            }
            // No billing record = no payment to refund
            if (!billing) {
                return {
                    refunded: false,
                    status: 'cancelled',
                    reason: 'No billing transaction found',
                };
            }
            // Already refunded
            if (billing.payment_status === 'refunded') {
                return {
                    refunded: true,
                    status: 'refunded',
                    reason: 'Already refunded',
                };
            }
            // Only completed payments hit the refund pipeline below.
            if (billing.payment_status !== 'completed') {
                return {
                    refunded: false,
                    status: 'cancelled',
                    reason: `Payment status is ${billing.payment_status}, not refundable`,
                };
            }
            // Check if cancellation is within grace period
            const scheduledAt = new Date(appointment.scheduled_at);
            const now = new Date();
            const hoursUntilSession = (scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60);
            if (hoursUntilSession < REFUND_GRACE_PERIOD_HOURS) {
                // Within grace period: mark as cancelled for manual admin review
                await supabase
                    .from('billing_transactions')
                    .update({ payment_status: 'cancelled' })
                    .eq('id', billing.id);
                // Record in appointment metadata
                await supabase
                    .from('appointments')
                    .update({
                    session_data_json: {
                        ...((appointment.session_data_json || {})),
                        refund_status: 'pending_manual_review',
                        refund_reason: `Cancelled within ${REFUND_GRACE_PERIOD_HOURS}h of session`,
                    },
                })
                    .eq('id', sessionId);
                return {
                    refunded: false,
                    status: 'cancelled',
                    reason: `Cancelled within ${REFUND_GRACE_PERIOD_HOURS}h window; marked for manual review`,
                };
            }
            // >= 24 hours before: issue refund
            const paymentIntentId = billing.stripe_payment_intent_id;
            const chargeId = billing.stripe_charge_id;
            if (!paymentIntentId && !chargeId) {
                return {
                    refunded: false,
                    status: 'failed',
                    reason: 'No Stripe payment intent or charge ID found',
                };
            }
            try {
                const stripe = getStripe();
                let refund;
                if (paymentIntentId) {
                    // Refund via payment intent (preferred)
                    refund = await stripe.refunds.create({
                        payment_intent: paymentIntentId,
                        reason: 'requested_by_customer',
                    });
                }
                else if (chargeId) {
                    // Fallback to charge-based refund
                    refund = await stripe.refunds.create({
                        charge: chargeId,
                        reason: 'requested_by_customer',
                    });
                }
                // Update billing transaction with refund status
                await supabase
                    .from('billing_transactions')
                    .update({
                    payment_status: 'refunded',
                    stripe_charge_id: refund.charge || chargeId,
                })
                    .eq('id', billing.id);
                // Record in appointment metadata
                await supabase
                    .from('appointments')
                    .update({
                    session_data_json: {
                        ...((appointment.session_data_json || {})),
                        refund_status: 'completed',
                        refund_id: refund.id,
                        refunded_at: new Date().toISOString(),
                    },
                })
                    .eq('id', sessionId);
                return {
                    refunded: true,
                    refundId: refund.id,
                    status: 'refunded',
                };
            }
            catch (stripeError) {
                console.error('[RefundService] Stripe refund error:', stripeError);
                // Record failed refund attempt
                await supabase
                    .from('appointments')
                    .update({
                    session_data_json: {
                        ...((appointment.session_data_json || {})),
                        refund_status: 'failed',
                        refund_error: stripeError.message,
                    },
                })
                    .eq('id', sessionId);
                return {
                    refunded: false,
                    status: 'failed',
                    reason: `Stripe refund failed: ${stripeError.message}`,
                };
            }
        }
        catch (error) {
            console.error('[RefundService] Unexpected error:', error);
            return {
                refunded: false,
                status: 'failed',
                reason: `Unexpected error: ${error.message}`,
            };
        }
    }
    /**
     * Mark an appointment as refunded in the database when a refund is detected
     * from the Stripe webhook. Use this when charge.refunded event is received.
     */
    async recordRefundFromWebhook(paymentIntentId) {
        const supabase = createServiceRoleClient();
        const { data: billing, error: billingError } = await supabase
            .from('billing_transactions')
            .select('id, session_id')
            .eq('stripe_payment_intent_id', paymentIntentId)
            .maybeSingle();
        if (billingError || !billing) {
            console.warn(`[RefundService] No billing record found for payment intent ${paymentIntentId}`);
            return;
        }
        // Update billing transaction
        await supabase
            .from('billing_transactions')
            .update({ payment_status: 'refunded' })
            .eq('id', billing.id);
        // Update appointment metadata if session exists
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
}
export const refundService = new RefundService();
