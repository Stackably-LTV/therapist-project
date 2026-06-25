import { createClient, getUser } from '@/components/9a6b39502e62';
/**
 * Guard for API routes. Verifies the request is from an authenticated user
 * with the required role and an allowed status.
 *
 *   const auth = await requireRole('therapist');
 *   if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
 */
export async function requireRole(role, options = {}) {
    const user = await getUser();
    if (!user)
        return { ok: false, status: 401, error: 'Unauthorized' };
    const supabase = await createClient();
    const { data: roleRow } = await supabase
        .from('user_roles')
        .select('role, status')
        .eq('id', user.id)
        .maybeSingle();
    if (!roleRow)
        return { ok: false, status: 403, error: 'Complete signup' };
    const allowed = Array.isArray(role) ? role : [role];
    if (!allowed.includes(roleRow.role)) {
        return { ok: false, status: 403, error: 'Forbidden' };
    }
    const allowedStatuses = options.allowStatuses ?? ['active'];
    if (!allowedStatuses.includes(roleRow.status)) {
        return {
            ok: false,
            status: 403,
            error: roleRow.status === 'pending' ? 'Account pending approval' : 'Account suspended',
        };
    }
    return {
        ok: true,
        userId: user.id,
        role: roleRow.role,
        accountStatus: roleRow.status,
    };
}
/**
 * Paywall guard. Composes with requireRole():
 *
 *   const auth = await requireRole('therapist');
 *   if (!auth.ok) return ...;
 *   const gate = await requireFeature(auth.userId, 'session_notes');
 *   if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });
 */
export async function requireFeature(userId, feature) {
    const { therapistHasFeature } = await import('@/components/c5276438fd9f');
    const has = await therapistHasFeature(userId, feature);
    if (!has) {
        return {
            ok: false,
            status: 403,
            error: `Your subscription does not include ${feature}`,
        };
    }
    return { ok: true };
}
