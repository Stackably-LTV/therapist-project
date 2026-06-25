import 'server-only';
import { createClient } from '@/components/9a6b39502e62';
import { getPostAuthRedirectPath } from '@/components/b85c08c50439';
import { ok, fail } from '@/components/7ff049787825';
/**
 * Resolve the post-login redirect path for the currently-authenticated user by
 * reading their role + profile and delegating to `getPostAuthRedirectPath`.
 * Returns 401 when there is no valid session.
 */
export async function resolvePostLoginPath() {
    const supabase = await createClient();
    const { data: { user }, error, } = await supabase.auth.getUser();
    if (error || !user) {
        return fail(401, 'Unauthorized');
    }
    const { data: roleRow } = await supabase
        .from('user_roles')
        .select('role, status')
        .eq('id', user.id)
        .maybeSingle();
    const { data: profileRow } = await supabase
        .from('user_profiles')
        .select('onboarding_completed, license_number, licensed_states, specialties, rate')
        .eq('user_id', user.id)
        .maybeSingle();
    const path = getPostAuthRedirectPath(roleRow, profileRow);
    return ok({ path });
}
