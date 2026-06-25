import 'server-only';
import { createServiceRoleClient } from '@/components/9a6b39502e62';
import { ok, fail } from '@/components/7ff049787825';
/**
 * Remove the seeker's relationship with a therapist: clears the primary
 * therapist on the patient record and deletes the accepted connection request.
 */
export async function removeSeekerTherapist(seekerId, therapistId) {
    const admin = createServiceRoleClient();
    const { data: record } = await admin
        .from('patient_records')
        .select('seeker_id, primary_therapist_id')
        .eq('seeker_id', seekerId)
        .maybeSingle();
    if (!record || record.primary_therapist_id !== therapistId) {
        return fail(404, 'Relationship not found');
    }
    const { error } = await admin
        .from('patient_records')
        .update({ primary_therapist_id: null, updated_at: new Date().toISOString() })
        .eq('seeker_id', seekerId)
        .eq('primary_therapist_id', therapistId);
    if (error)
        return fail(500, error.message);
    await admin
        .from('connection_requests')
        .delete()
        .eq('therapist_id', therapistId)
        .eq('seeker_id', seekerId)
        .eq('status', 'accepted');
    return ok({ success: true });
}
