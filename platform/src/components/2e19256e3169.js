import 'server-only';
import { createClient } from '@/components/9a6b39502e62';
import { ok, fail } from '@/components/7ff049787825';
/**
 * Load the calling payer's billing transactions, joined with the appointment +
 * therapist profile, and flatten the therapist name / session date onto each row.
 */
export async function getBillingHistory(userId) {
    const supabase = await createClient();
    const { data: rows, error } = await supabase
        .from('billing_transactions')
        .select(`
      *,
      appointment:appointments(
        id,
        scheduled_at,
        therapist_id,
        therapist:user_profiles!user_profiles_user_id_fkey(full_name)
      )
    `)
        .eq('payer_id', userId)
        .order('created_at', { ascending: false });
    if (error) {
        console.error('[api/billing/history] error', error);
        return fail(500, 'Failed to load billing history');
    }
    const records = (rows ?? []).map((row) => {
        const appointment = row.appointment ?? null;
        const therapistRel = appointment?.therapist ?? null;
        const therapistProfile = Array.isArray(therapistRel) ? therapistRel[0] : therapistRel;
        return {
            ...row,
            therapistName: therapistProfile?.full_name ?? 'Therapist',
            sessionDate: appointment?.scheduled_at ?? null,
        };
    });
    return ok({ records });
}
