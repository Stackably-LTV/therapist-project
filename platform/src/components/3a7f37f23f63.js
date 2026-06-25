import 'server-only';
import { createClient } from '@/components/9a6b39502e62';
import { ok, fail } from '@/components/7ff049787825';
async function requireActiveMember(groupId, userId) {
    const supabase = await createClient();
    const { data: membership } = await supabase
        .from('community_group_members')
        .select('role, status')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .maybeSingle();
    if (!membership || membership.status !== 'active') {
        return { ok: false, status: 403, error: 'Not a group member' };
    }
    return { ok: true, supabase };
}
/** List recent messages for a group (oldest-first), capped by `limit`. */
export async function listGroupMessages(userId, groupId, limit) {
    const gate = await requireActiveMember(groupId, userId);
    if (!gate.ok)
        return fail(gate.status, gate.error);
    const { data: messages } = await gate.supabase
        .from('community_group_messages')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
        .limit(limit);
    const transformed = (messages || []).reverse().map((m) => ({
        id: m.id,
        groupId: m.group_id,
        senderId: m.sender_id,
        content: m.content,
        createdAt: m.created_at,
    }));
    return ok({ messages: transformed });
}
/** Post a message to a group. */
export async function createGroupMessage(userId, groupId, body) {
    const gate = await requireActiveMember(groupId, userId);
    if (!gate.ok)
        return fail(gate.status, gate.error);
    const content = String(body?.content || '').trim();
    if (!content)
        return fail(400, 'Content is required');
    const { data: message, error } = await gate.supabase
        .from('community_group_messages')
        .insert({
        group_id: groupId,
        sender_id: userId,
        content,
    })
        .select('*')
        .single();
    if (error) {
        console.error('[api/community/groups/[groupId]/messages] insert error', error);
        return fail(500, 'Failed to send');
    }
    return ok({
        message: {
            id: message.id,
            groupId: message.group_id,
            senderId: message.sender_id,
            content: message.content,
            createdAt: message.created_at,
        },
    });
}
