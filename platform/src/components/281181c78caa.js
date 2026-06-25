import 'server-only';
import { createClient } from '@/components/9a6b39502e62';
import { ok, fail } from '@/components/7ff049787825';
/** List the active-membership groups for a therapist, enriched with counts/role. */
export async function listMyGroups(userId) {
    const supabase = await createClient();
    const { data: memberships } = await supabase
        .from('community_group_members')
        .select('group_id, role, status')
        .eq('user_id', userId)
        .eq('status', 'active');
    const groupIds = (memberships || []).map((m) => m.group_id);
    if (groupIds.length === 0)
        return ok({ groups: [] });
    const roleByGroup = new Map((memberships || []).map((m) => [m.group_id, { role: m.role, status: m.status }]));
    const [{ data: groups }, { data: allMembers }] = await Promise.all([
        supabase
            .from('community_groups')
            .select('*')
            .in('id', groupIds)
            .order('created_at', { ascending: false }),
        supabase
            .from('community_group_members')
            .select('group_id')
            .in('group_id', groupIds)
            .eq('status', 'active'),
    ]);
    const memberCounts = new Map();
    for (const m of allMembers || []) {
        memberCounts.set(m.group_id, (memberCounts.get(m.group_id) || 0) + 1);
    }
    const enriched = (groups || []).map((g) => {
        const mine = roleByGroup.get(g.id);
        return {
            ...g,
            coverImageUrl: g.cover_image_url ?? null,
            memberCount: memberCounts.get(g.id) || 0,
            myRole: mine?.role ?? null,
            myStatus: mine?.status ?? null,
        };
    });
    return ok({ groups: enriched });
}
/** Create a community group and add the creator as owner. */
export async function createGroup(userId, body) {
    const supabase = await createClient();
    const name = String(body?.name || '').trim();
    const description = typeof body?.description === 'string' ? body.description.trim() : null;
    const coverImageUrl = typeof body?.coverImageUrl === 'string' ? body.coverImageUrl.trim() || null : null;
    const visibility = typeof body?.visibility === 'string' ? body.visibility : 'public';
    const locationRaw = typeof body?.location === 'string' ? body.location.trim() : '';
    const location = !locationRaw || locationRaw.toLowerCase() === 'optional' ? null : locationRaw;
    if (!name)
        return fail(400, 'Name is required');
    const { data: group, error } = await supabase
        .from('community_groups')
        .insert({
        created_by: userId,
        name,
        description,
        cover_image_url: coverImageUrl,
        visibility,
        location,
    })
        .select('*')
        .single();
    if (error || !group) {
        console.error('[api/community/groups] POST insert error', error);
        return fail(500, 'Failed to create group');
    }
    // Add creator as owner
    await supabase.from('community_group_members').insert({
        group_id: group.id,
        user_id: userId,
        role: 'owner',
        status: 'active',
    });
    return ok({ group });
}
/** Discover public groups: popular + suggestions, annotated for the current user. */
export async function discoverGroups(userId, params) {
    const supabase = await createClient();
    const { q, popularLimit, suggestionsLimit } = params;
    let baseQuery = supabase.from('community_groups').select('*').eq('visibility', 'public');
    if (q)
        baseQuery = baseQuery.ilike('name', `%${q}%`);
    const { data: allGroups } = await baseQuery
        .order('created_at', { ascending: false })
        .limit(Math.max(popularLimit, suggestionsLimit) * 2);
    const groupIds = (allGroups || []).map((g) => g.id);
    const [{ data: myMemberships }, { data: allMemberRows }] = await Promise.all([
        supabase
            .from('community_group_members')
            .select('group_id, role, status')
            .eq('user_id', userId)
            .in('group_id', groupIds.length ? groupIds : ['00000000-0000-0000-0000-000000000000']),
        supabase
            .from('community_group_members')
            .select('group_id')
            .eq('status', 'active')
            .in('group_id', groupIds.length ? groupIds : ['00000000-0000-0000-0000-000000000000']),
    ]);
    const myByGroup = new Map((myMemberships || []).map((m) => [m.group_id, { role: m.role, status: m.status }]));
    const memberCounts = new Map();
    for (const m of allMemberRows || []) {
        memberCounts.set(m.group_id, (memberCounts.get(m.group_id) || 0) + 1);
    }
    const annotate = (g) => {
        const mine = myByGroup.get(g.id);
        return {
            ...g,
            coverImageUrl: g.cover_image_url ?? null,
            memberCount: memberCounts.get(g.id) || 0,
            myRole: mine?.role ?? null,
            myStatus: mine?.status ?? null,
        };
    };
    const popular = [...(allGroups || [])]
        .sort((a, b) => (memberCounts.get(b.id) || 0) - (memberCounts.get(a.id) || 0))
        .slice(0, popularLimit)
        .map(annotate);
    const popularIds = new Set(popular.map((g) => g.id));
    const suggestions = (allGroups || [])
        .filter((g) => !popularIds.has(g.id))
        .slice(0, suggestionsLimit)
        .map(annotate);
    return ok({ popular, suggestions });
}
/** Fetch a group's detail view plus the caller's membership. */
export async function getGroup(userId, groupId) {
    const supabase = await createClient();
    const { data: group } = await supabase
        .from('community_groups')
        .select('*')
        .eq('id', groupId)
        .maybeSingle();
    if (!group)
        return fail(404, 'Group not found');
    const { count: memberCount } = await supabase
        .from('community_group_members')
        .select('user_id', { count: 'exact', head: true })
        .eq('group_id', groupId)
        .eq('status', 'active');
    const { data: recentMembers } = await supabase
        .from('community_group_members')
        .select('user_id, joined_at')
        .eq('group_id', groupId)
        .eq('status', 'active')
        .order('joined_at', { ascending: false })
        .limit(8);
    const { data: membership } = await supabase
        .from('community_group_members')
        .select('role, status')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .maybeSingle();
    return ok({
        group: {
            id: group.id,
            name: group.name,
            description: group.description,
            coverImageUrl: group.cover_image_url ?? null,
            visibility: group.visibility ?? 'public',
            location: group.location ?? null,
            createdBy: group.created_by,
            createdAt: group.created_at,
            memberCount: memberCount || 0,
            recentMembers: recentMembers || [],
        },
        membership: membership ? { role: membership.role, status: membership.status } : null,
    });
}
/** Update a group's editable fields. Owner/mod only. */
export async function updateGroup(userId, groupId, body) {
    const supabase = await createClient();
    const { data: membership } = await supabase
        .from('community_group_members')
        .select('role, status')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .maybeSingle();
    if (!membership || membership.status !== 'active') {
        return fail(403, 'Not a group member');
    }
    if (membership.role !== 'owner' && membership.role !== 'mod') {
        return fail(403, 'Insufficient permissions');
    }
    const name = String(body?.name || '').trim();
    if (!name)
        return fail(400, 'Name is required');
    if (name.length > 120)
        return fail(400, 'Name is too long');
    const update = { name };
    if (body?.description !== undefined) {
        const d = body.description === null ? null : String(body.description).trim() || null;
        if (typeof d === 'string' && d.length > 2000) {
            return fail(400, 'Description is too long');
        }
        update.description = d;
    }
    if (body?.location !== undefined) {
        const l = String(body.location).trim() || null;
        if (typeof l === 'string' && l.length > 120) {
            return fail(400, 'Location is too long');
        }
        update.location = l;
    }
    if (body?.visibility !== undefined) {
        const v = String(body.visibility).trim().toLowerCase();
        if (v !== 'public' && v !== 'private') {
            return fail(400, 'Invalid visibility');
        }
        update.visibility = v;
    }
    const { data: updated, error } = await supabase
        .from('community_groups')
        .update(update)
        .eq('id', groupId)
        .select('*')
        .single();
    if (error || !updated)
        return fail(404, 'Group not found');
    return ok({ group: updated });
}
/** Delete a group. Owner only. */
export async function deleteGroup(userId, groupId) {
    const supabase = await createClient();
    const { data: membership } = await supabase
        .from('community_group_members')
        .select('role, status')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .maybeSingle();
    if (!membership || membership.status !== 'active') {
        return fail(403, 'Not a group member');
    }
    if (membership.role !== 'owner') {
        return fail(403, 'Only the owner can delete this group');
    }
    const { error } = await supabase.from('community_groups').delete().eq('id', groupId);
    if (error) {
        console.error('[api/community/groups/[groupId]] DELETE error', error);
        return fail(500, 'Failed to delete');
    }
    return ok({ ok: true });
}
/** Join a group (idempotent). Returns whether the caller was already a member. */
export async function joinGroup(userId, groupId) {
    const supabase = await createClient();
    const { data: group } = await supabase
        .from('community_groups')
        .select('id, visibility')
        .eq('id', groupId)
        .maybeSingle();
    if (!group)
        return fail(404, 'Group not found');
    // Idempotent: if a membership row already exists, return it; otherwise insert.
    // We avoid `upsert` because the RLS UPDATE policy requires owner/mod, which
    // makes ON CONFLICT DO UPDATE fail for regular members re-joining.
    const { data: existing } = await supabase
        .from('community_group_members')
        .select('group_id, user_id, role, status, joined_at')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .maybeSingle();
    if (existing) {
        return ok({ membership: existing, alreadyMember: true });
    }
    const { data: inserted, error } = await supabase
        .from('community_group_members')
        .insert({
        group_id: groupId,
        user_id: userId,
        role: 'member',
        status: 'active',
    })
        .select('*')
        .single();
    if (error) {
        console.error('[api/community/groups/[groupId]/join] error', error);
        return fail(500, 'Failed to join');
    }
    return ok({ membership: inserted });
}
/** Leave a group. Owners cannot leave. */
export async function leaveGroup(userId, groupId) {
    const supabase = await createClient();
    const { data: membership } = await supabase
        .from('community_group_members')
        .select('role, status')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .maybeSingle();
    if (!membership) {
        return fail(404, 'Not a group member');
    }
    if (membership.role === 'owner') {
        return fail(400, 'Owners cannot leave their own group. Transfer ownership to another member or delete the group instead.');
    }
    const { error } = await supabase
        .from('community_group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);
    if (error) {
        console.error('[api/community/groups/[groupId]/leave] error', error);
        return fail(500, 'Failed to leave');
    }
    return ok({ ok: true });
}
/** Remove a member from a group. Owner/mod only; owners cannot be removed. */
export async function removeGroupMember(userId, groupId, targetUserId) {
    const supabase = await createClient();
    const { data: membership } = await supabase
        .from('community_group_members')
        .select('role, status')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .maybeSingle();
    if (!membership || membership.status !== 'active') {
        return fail(403, 'Not a group member');
    }
    if (membership.role !== 'owner' && membership.role !== 'mod') {
        return fail(403, 'Insufficient permissions');
    }
    if (targetUserId === userId) {
        return fail(400, 'Use leave group to remove yourself');
    }
    const { data: target } = await supabase
        .from('community_group_members')
        .select('role, status')
        .eq('group_id', groupId)
        .eq('user_id', targetUserId)
        .maybeSingle();
    if (!target || target.status !== 'active') {
        return fail(404, 'Member not found');
    }
    if (target.role === 'owner') {
        return fail(403, 'Owner cannot be removed');
    }
    const { error } = await supabase
        .from('community_group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', targetUserId);
    if (error) {
        console.error('[api/community/groups/[groupId]/members/[userId]] DELETE error', error);
        return fail(500, 'Failed to remove');
    }
    return ok({ ok: true });
}
