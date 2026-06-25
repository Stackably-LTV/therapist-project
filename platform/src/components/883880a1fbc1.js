import 'server-only';
import { createClient } from '@/components/9a6b39502e62';
import { ok, fail } from '@/components/7ff049787825';
/** File a member report within a group. Reporter must be an active member. */
export async function createMemberReport(userId, groupId, body) {
    const supabase = await createClient();
    const { data: reporterMembership } = await supabase
        .from('community_group_members')
        .select('role, status')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .maybeSingle();
    if (!reporterMembership || reporterMembership.status !== 'active') {
        return fail(403, 'Not a group member');
    }
    const reportedUserId = String(body?.reportedUserId || '').trim();
    const reason = String(body?.reason || '').trim();
    if (!reportedUserId)
        return fail(400, 'reportedUserId is required');
    if (reason.length < 3 || reason.length > 2000) {
        return fail(400, 'reason must be between 3 and 2000 characters');
    }
    if (reportedUserId === userId) {
        return fail(400, 'You cannot report yourself');
    }
    const { data: target } = await supabase
        .from('community_group_members')
        .select('status')
        .eq('group_id', groupId)
        .eq('user_id', reportedUserId)
        .maybeSingle();
    if (!target || target.status !== 'active') {
        return fail(404, 'Reported user is not an active member');
    }
    const { error } = await supabase.from('community_member_reports').insert({
        group_id: groupId,
        reporter_id: userId,
        reported_user_id: reportedUserId,
        reason,
        status: 'open',
    });
    if (error) {
        console.error('[community report insert]', error);
        return fail(500, 'Failed to file report');
    }
    return ok({ ok: true });
}
