import 'server-only';
import { createClient } from '@/components/9a6b39502e62';
import { refundService } from '@/components/4345701d22e6';
import { ok, fail } from '@/components/7ff049787825';
/**
 * Cancel a seeker's session booking and process a refund if applicable.
 * Refund failures are swallowed (logged) so the cancellation still succeeds.
 */
export async function cancelSeekerSession(seekerId, sessionId) {
    const supabase = await createClient();
    // Fetch appointment
    const { data: appointment, error: fetchError } = await supabase
        .from('appointments')
        .select('id, seeker_id, status, scheduled_at')
        .eq('id', sessionId)
        .maybeSingle();
    if (fetchError || !appointment) {
        return fail(404, 'Session not found');
    }
    // Verify ownership
    if (appointment.seeker_id !== seekerId) {
        return fail(403, 'Forbidden');
    }
    // Prevent cancelling already cancelled/completed sessions
    if (appointment.status === 'cancelled' || appointment.status === 'completed') {
        return fail(409, `Cannot cancel session with status ${appointment.status}`);
    }
    // Update appointment status
    const { data: updated, error: updateError } = await supabase
        .from('appointments')
        .update({
        status: 'cancelled',
        session_data_json: {
            cancellationReason: 'cancelled_by_seeker',
            cancellationInitiatedBy: 'seeker',
            cancelledAt: new Date().toISOString(),
        },
    })
        .eq('id', sessionId)
        .select('*')
        .single();
    if (updateError || !updated) {
        return fail(500, 'Failed to cancel session');
    }
    // Process refund (async, non-blocking)
    let refundResult = null;
    try {
        refundResult = await refundService.processRefundForCancelledAppointment(sessionId);
    }
    catch (refundError) {
        console.error('[api/seeker/sessions/:sessionId/cancel] refund error', refundError);
        // Don't fail the cancellation if refund errors; log and continue
    }
    return ok({ session: updated, refund: refundResult });
}
