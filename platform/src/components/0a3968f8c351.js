import 'server-only';
import { createServiceRoleClient } from '@/components/9a6b39502e62';
export async function listPublicTherapists() {
    const supabase = createServiceRoleClient();
    const { data: roles, error: roleError } = await supabase
        .from('user_roles')
        .select('id')
        .eq('role', 'therapist')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
    if (roleError) {
        console.error('listPublicTherapists roles error:', roleError);
        return [];
    }
    const therapistIds = (roles ?? []).map((r) => r.id);
    if (therapistIds.length === 0)
        return [];
    const { data: profiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, bio, profile_image_url, specialties, rate, license_number, licensed_states, show_rate_publicly, years_experience, approach')
        .in('user_id', therapistIds);
    if (profileError) {
        console.error('listPublicTherapists profiles error:', profileError);
        return [];
    }
    const profileById = new Map((profiles ?? []).map((p) => [p.user_id, p]));
    // Preserve the role ordering (newest active therapists first).
    return therapistIds.map((id) => {
        const p = profileById.get(id);
        return {
            id,
            full_name: p?.full_name ?? '',
            bio: p?.bio ?? null,
            profile_image_url: p?.profile_image_url ?? null,
            specialties: p?.specialties ?? null,
            rate: p?.rate ?? null,
            license_number: p?.license_number ?? null,
            licensed_states: p?.licensed_states ?? null,
            show_rate_publicly: p?.show_rate_publicly ?? null,
            years_experience: p?.years_experience ?? null,
            approach: p?.approach ?? null,
        };
    });
}
