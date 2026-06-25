import { notFound } from 'next/navigation';
import { createClient } from '@/components/9a6b39502e62';
import { CommunityGroupJoinButton } from '@/components/fe6ff4f82b98';
import { CommunityGroupLayout } from '@/components/ff199a7b53fd';
export default async function TherapistCommunityGroupPage({ params, }) {
    const { groupId } = await params;
    const supabase = await createClient();
    const { data: { user }, } = await supabase.auth.getUser();
    if (!user)
        return notFound();
    const { data: roleRow } = await supabase
        .from('user_roles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
    if (!roleRow || roleRow.role !== 'therapist')
        return notFound();
    const { data: group } = await supabase
        .from('community_groups')
        .select('id, name, description, cover_image_url, visibility, location')
        .eq('id', groupId)
        .maybeSingle();
    if (!group)
        return notFound();
    const { data: membership } = await supabase
        .from('community_group_members')
        .select('role, status')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .maybeSingle();
    const isActiveMember = membership?.status === 'active';
    const myRole = membership?.role ?? null;
    if (!isActiveMember) {
        return (<div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="rounded-2xl border bg-white p-8 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Join this group</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            You must be an active member to view posts and chat.
          </p>
          <div className="mt-5">
            <CommunityGroupJoinButton groupId={groupId}/>
          </div>
        </div>
      </div>);
    }
    // Member count
    const { count: memberCount } = await supabase
        .from('community_group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId)
        .eq('status', 'active');
    // Recent media (last 6 posts that have media)
    const { data: recentMedia } = await supabase
        .from('community_posts')
        .select('id, media_url, created_at')
        .eq('group_id', groupId)
        .not('media_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(6);
    // Members list (first 50 active)
    const { data: memberRows } = await supabase
        .from('community_group_members')
        .select('user_id, role, status, joined_at')
        .eq('group_id', groupId)
        .eq('status', 'active')
        .order('joined_at', { ascending: false })
        .limit(50);
    const memberIds = (memberRows ?? []).map((m) => m.user_id);
    const { data: memberProfiles } = memberIds.length
        ? await supabase
            .from('user_profiles')
            .select('user_id, full_name, profile_image_url')
            .in('user_id', memberIds)
        : { data: [] };
    const profileById = new Map((memberProfiles ?? []).map((p) => [p.user_id, p]));
    const members = (memberRows ?? []).map((m) => {
        const p = profileById.get(m.user_id);
        return {
            id: m.user_id,
            userId: m.user_id,
            role: m.role,
            status: m.status,
            joinedAt: m.joined_at,
            name: p?.full_name ?? 'Member',
            profileImageUrl: p?.profile_image_url ?? null,
        };
    });
    // Current user's profile
    const { data: meProfile } = await supabase
        .from('user_profiles')
        .select('full_name, profile_image_url')
        .eq('user_id', user.id)
        .maybeSingle();
    // Recent members preview (first 5)
    const recentMembers = members.slice(0, 5).map((m) => ({
        id: m.id,
        name: m.name,
        profileImageUrl: m.profileImageUrl ?? undefined,
    }));
    return (<CommunityGroupLayout group={{
            id: group.id,
            name: group.name,
            description: group.description ?? null,
            coverImageUrl: group.cover_image_url ?? null,
            visibility: group.visibility,
            location: group.location ?? null,
            memberCount: memberCount ?? 0,
            recentMembers,
        }} members={members} recentMedia={(recentMedia ?? []).map((rm) => ({
            id: rm.id,
            postId: rm.id,
            url: rm.media_url,
            created_at: rm.created_at,
        }))} groupId={groupId} isMember={true} myRole={myRole} currentUser={{
            name: meProfile?.full_name ?? 'You',
            profileImageUrl: meProfile?.profile_image_url ?? null,
        }} currentUserId={user.id}/>);
}
