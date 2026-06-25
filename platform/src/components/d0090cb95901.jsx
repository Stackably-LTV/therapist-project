import { createClient } from '@/components/9a6b39502e62';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ChatInterface from '@/components/ae6f7f7bd0eb';
import { getMessagePreview } from '@/components/a6e7ef5e01c9';
export default async function ChatPage({ searchParams, }) {
    const supabase = await createClient();
    const { data: { user }, } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }
    const params = await searchParams;
    const selectedUserId = params.with || null;
    const endedSessionId = params.endedSessionId || null;
    // Get current user's role + profile (split across user_roles + user_profiles)
    const [{ data: currentRole }, { data: currentProfileRow }] = await Promise.all([
        supabase.from('user_roles').select('role').eq('id', user.id).single(),
        supabase
            .from('user_profiles')
            .select('full_name, profile_image_url')
            .eq('user_id', user.id)
            .single(),
    ]);
    const currentProfile = currentRole
        ? {
            role: currentRole.role,
            name: currentProfileRow?.full_name ?? '',
            profile_json: currentProfileRow?.profile_image_url
                ? { profile_image_url: currentProfileRow.profile_image_url }
                : undefined,
        }
        : null;
    // If trying to message someone specific, check if they can chat
    let targetUser = null;
    let restrictionReason = '';
    let consultationRequest = null;
    let consultationLocked = false;
    if (selectedUserId) {
        // Get target user details (include image for avatar)
        const [{ data: targetRole }, { data: targetProfile }] = await Promise.all([
            supabase.from('user_roles').select('id, role').eq('id', selectedUserId).single(),
            supabase
                .from('user_profiles')
                .select('user_id, full_name, profile_image_url')
                .eq('user_id', selectedUserId)
                .single(),
        ]);
        const target = targetRole
            ? {
                id: targetRole.id,
                name: targetProfile?.full_name ?? '',
                role: targetRole.role,
                profile_json: targetProfile?.profile_image_url
                    ? { profile_image_url: targetProfile.profile_image_url }
                    : undefined,
            }
            : null;
        targetUser = target;
        // Seeker -> therapist: messaging is always open. The therapist's self-book toggle
        // only controls whether bookings can happen without a prior consultation; it does
        // not gate DMs. The detail-page sidebar surfaces booking when available.
        if (currentProfile?.role === 'seeker' && target?.role === 'therapist') {
            const { data: req } = await supabase
                .from('connection_requests')
                .select('id, status, initial_message, created_at, seeker_id, therapist_id, initiated_by')
                .eq('seeker_id', user.id)
                .eq('therapist_id', selectedUserId)
                .limit(1)
                .maybeSingle();
            consultationRequest = req || null;
            // Chat is never locked. The consultation request is purely a banner-with-actions
            // ("Therapist X invited you to become a client"). Both sides can keep messaging.
            consultationLocked = false;
        }
        // Therapist → seeker: only allowed if seeker has already messaged them (relationship
        // established by the seeker) OR they share a booking.
        if (currentProfile?.role === 'therapist' && target?.role === 'seeker') {
            const [{ data: sessions }, { data: priorMessage }] = await Promise.all([
                supabase
                    .from('appointments')
                    .select('id')
                    .eq('therapist_id', user.id)
                    .eq('seeker_id', selectedUserId)
                    .limit(1),
                supabase
                    .from('messages')
                    .select('id')
                    .eq('sender_id', selectedUserId)
                    .eq('recipient_id', user.id)
                    .limit(1),
            ]);
            const hasRelationship = (sessions && sessions.length > 0) || (priorMessage && priorMessage.length > 0);
            if (!hasRelationship) {
                restrictionReason = 'no_client';
            }
            else {
                // Relationship exists — load any consultation request for context (e.g. for the UI panel)
                const { data: req } = await supabase
                    .from('connection_requests')
                    .select('id, status, initial_message, created_at, seeker_id, therapist_id, initiated_by')
                    .eq('seeker_id', selectedUserId)
                    .eq('therapist_id', user.id)
                    .limit(1)
                    .maybeSingle();
                consultationRequest = req || null;
                consultationLocked = false;
            }
        }
    }
    // Get user's conversations
    const { data: rawMessages } = await supabase
        .from('messages')
        .select(`
      id,
      sender_id,
      recipient_id,
      content,
      read_at,
      created_at
    `)
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(100);
    // Fetch participant role + profile data separately, since FKs land on user_roles
    // (which lacks display fields) and there is no FK from messages to user_profiles.
    const partnerIds = new Set();
    rawMessages?.forEach((m) => {
        if (m.sender_id !== user.id)
            partnerIds.add(m.sender_id);
        if (m.recipient_id !== user.id)
            partnerIds.add(m.recipient_id);
    });
    const partnerIdList = Array.from(partnerIds);
    const [{ data: partnerRoles }, { data: partnerProfiles }] = await Promise.all([
        partnerIdList.length
            ? supabase.from('user_roles').select('id, role').in('id', partnerIdList)
            : Promise.resolve({ data: [] }),
        partnerIdList.length
            ? supabase
                .from('user_profiles')
                .select('user_id, full_name, profile_image_url')
                .in('user_id', partnerIdList)
            : Promise.resolve({
                data: [],
            }),
    ]);
    const roleById = new Map();
    partnerRoles?.forEach((r) => roleById.set(r.id, r.role));
    const profileById = new Map();
    partnerProfiles?.forEach((p) => profileById.set(p.user_id, { full_name: p.full_name, profile_image_url: p.profile_image_url }));
    const buildPartner = (id) => {
        const profile = profileById.get(id);
        return {
            id,
            name: profile?.full_name ?? 'Unknown',
            role: roleById.get(id) ?? 'seeker',
            profile_json: profile?.profile_image_url
                ? { profile_image_url: profile.profile_image_url }
                : undefined,
        };
    };
    const messages = rawMessages?.map((m) => ({
        ...m,
        sender: buildPartner(m.sender_id),
        recipient: buildPartner(m.recipient_id),
    }));
    // Build conversation list with previews + unread counts (exclude self)
    const conversationPartners = new Map();
    const unreadCounts = new Map();
    messages?.forEach((msg) => {
        // Count unread messages addressed to current user, grouped by partner
        if (msg.recipient_id === user.id && !msg.read_at) {
            const partnerId = msg.sender_id;
            if (partnerId !== user.id) {
                unreadCounts.set(partnerId, (unreadCounts.get(partnerId) || 0) + 1);
            }
        }
    });
    messages?.forEach((msg) => {
        const isCurrentUserSender = msg.sender_id === user.id;
        const partnerId = isCurrentUserSender ? msg.recipient_id : msg.sender_id;
        const partner = isCurrentUserSender ? msg.recipient : msg.sender;
        // Exclude current user from conversation list
        if (partnerId !== user.id && !conversationPartners.has(partnerId)) {
            conversationPartners.set(partnerId, {
                id: partnerId,
                name: partner?.name || 'Unknown',
                role: partner?.role || 'seeker',
                profile_json: partner?.profile_json,
                last_message: getMessagePreview(msg.content || ''),
                last_message_at: msg.created_at,
                unread_count: unreadCounts.get(partnerId) || 0,
            });
        }
    });
    // Include consultation requests in the sidebar even before any messages exist.
    // This lets therapists accept/deny directly from chat, and lets seekers track pending requests.
    if (currentProfile?.role === 'therapist') {
        const { data: reqs } = await supabase
            .from('connection_requests')
            .select(`
        id,
        status,
        initial_message,
        created_at,
        seeker_id
      `)
            .eq('therapist_id', user.id)
            .in('status', ['pending', 'accepted'])
            .order('created_at', { ascending: false })
            .limit(50);
        const seekerIds = Array.from(new Set((reqs ?? []).map((r) => r.seeker_id).filter(Boolean)));
        const { data: seekerProfiles } = seekerIds.length
            ? await supabase
                .from('user_profiles')
                .select('user_id, full_name, profile_image_url')
                .in('user_id', seekerIds)
            : { data: [] };
        const seekerProfileById = new Map();
        seekerProfiles?.forEach((p) => seekerProfileById.set(p.user_id, { full_name: p.full_name, profile_image_url: p.profile_image_url }));
        reqs?.forEach((r) => {
            const status = r.status || '';
            const seekerId = r.seeker_id;
            const seeker = seekerProfileById.get(seekerId)
                ? {
                    name: seekerProfileById.get(seekerId).full_name,
                    role: 'seeker',
                    profile_json: seekerProfileById.get(seekerId).profile_image_url
                        ? { profile_image_url: seekerProfileById.get(seekerId).profile_image_url }
                        : undefined,
                }
                : undefined;
            if (!seekerId || seekerId === user.id)
                return;
            if (conversationPartners.has(seekerId))
                return;
            conversationPartners.set(seekerId, {
                id: seekerId,
                name: seeker?.name || 'Unknown',
                role: seeker?.role || 'seeker',
                profile_json: seeker?.profile_json,
                last_message: status === 'accepted' ? 'Consultation accepted' : r.initial_message || 'Consultation request',
                last_message_at: r.created_at,
                unread_count: status === 'pending' ? 1 : 0,
            });
        });
    }
    if (currentProfile?.role === 'seeker') {
        const { data: reqs } = await supabase
            .from('connection_requests')
            .select(`
        id,
        status,
        initial_message,
        created_at,
        therapist_id
      `)
            .eq('seeker_id', user.id)
            .in('status', ['pending', 'accepted'])
            .order('created_at', { ascending: false })
            .limit(50);
        const therapistIds = Array.from(new Set((reqs ?? []).map((r) => r.therapist_id).filter(Boolean)));
        const { data: therapistProfiles } = therapistIds.length
            ? await supabase
                .from('user_profiles')
                .select('user_id, full_name, profile_image_url')
                .in('user_id', therapistIds)
            : { data: [] };
        const therapistProfileById = new Map();
        therapistProfiles?.forEach((p) => therapistProfileById.set(p.user_id, { full_name: p.full_name, profile_image_url: p.profile_image_url }));
        reqs?.forEach((r) => {
            const status = r.status || '';
            const therapistId = r.therapist_id;
            const profile = therapistProfileById.get(therapistId);
            if (!therapistId || therapistId === user.id)
                return;
            if (conversationPartners.has(therapistId))
                return;
            conversationPartners.set(therapistId, {
                id: therapistId,
                name: profile?.full_name || 'Unknown',
                role: 'therapist',
                profile_json: profile?.profile_image_url
                    ? { profile_image_url: profile.profile_image_url }
                    : undefined,
                last_message: status === 'accepted' ? 'Consultation accepted' : r.initial_message || 'Consultation request',
                last_message_at: r.created_at,
                unread_count: 0,
            });
        });
    }
    const conversations = Array.from(conversationPartners.values());
    // If messaging a specific user but they're not in conversations yet, add them
    if (selectedUserId && targetUser && !conversations.find(c => c.id === selectedUserId)) {
        conversations.unshift({
            id: targetUser.id,
            name: targetUser.name,
            role: targetUser.role,
            profile_json: targetUser.profile_json,
            last_message: '',
            last_message_at: new Date().toISOString(),
            unread_count: 0,
        });
    }
    // Ensure consistent sorting (newest activity first)
    conversations.sort((a, b) => new Date(b.last_message_at).getTime() -
        new Date(a.last_message_at).getTime());
    // If user can't chat, show an appropriate restriction message
    if (restrictionReason === 'no_client' && selectedUserId) {
        return (<div className="min-h-0 flex flex-1 items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-indigo-100">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Relationship Yet</h2>
            <p className="text-gray-600 mb-4">
              You can only message a client after they&apos;ve reached out to you first or booked a session with you.
            </p>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-left mb-6">
              <p className="text-sm font-semibold text-amber-800 mb-1">How messaging works</p>
              <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                <li>Clients reach out from your marketplace profile or after booking a session.</li>
                <li>Once a client texts or books with you, you can reply freely.</li>
              </ul>
            </div>
            <div className="space-y-3">
              <Link href="/therapist/records" className="block w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold">
                View Your Patients
              </Link>
              <Link href="/chat" className="block w-full px-6 py-3 text-gray-600 hover:text-gray-900 transition">
                &larr; Back to Messages
              </Link>
            </div>
          </div>
        </div>
      </div>);
    }
    let endedQuickSessionOverview = null;
    if (endedSessionId) {
        const { data: endedSession } = await supabase
            .from('appointments')
            .select('id, therapist_id, seeker_id, scheduled_at, duration_minutes, status, session_type, session_data_json')
            .eq('id', endedSessionId)
            .single();
        if (endedSession && (endedSession.therapist_id === user.id || endedSession.seeker_id === user.id)) {
            const sessionData = endedSession.session_data_json || {};
            const isQuickSession = endedSession.session_type === 'quick_session' ||
                sessionData.origin === 'dm_video_call' ||
                sessionData.quick_session === true;
            if (isQuickSession) {
                // Best-effort: when the therapist exits, treat it as ended (so active-call UI clears).
                // We avoid forcing completion when the client exits first, since the therapist may still be in the call.
                if (endedSession.therapist_id === user.id &&
                    (endedSession.status === 'in_progress' || endedSession.status === 'scheduled')) {
                    await supabase
                        .from('appointments')
                        .update({
                        status: 'completed',
                        session_data_json: {
                            ...sessionData,
                            quick_session_ended_at: new Date().toISOString(),
                            quick_session_ended_by: 'therapist',
                        },
                    })
                        .eq('id', endedSessionId);
                    endedSession.status = 'completed';
                }
                endedQuickSessionOverview = {
                    sessionId: endedSession.id,
                    otherUserId: endedSession.therapist_id === user.id ? endedSession.seeker_id : endedSession.therapist_id,
                    startedAt: endedSession.scheduled_at,
                    durationMinutes: endedSession.duration_minutes,
                    status: endedSession.status,
                };
            }
        }
    }
    const currentUserProfileImageUrl = currentProfile?.profile_json?.profile_image_url || null;
    return (<div className="flex-1 flex flex-col min-h-0 -m-4 md:-m-6 lg:-m-8 h-[calc(100vh-65px)] md:h-[calc(100vh-65px)] lg:h-[calc(100vh-65px)] w-[calc(100%+2rem)] md:w-[calc(100%+3rem)] lg:w-[calc(100%+4rem)] overflow-hidden">
      <ChatInterface initialConversations={conversations} selectedUserId={selectedUserId} currentUserId={user.id} currentUserName={currentProfile?.name || 'User'} currentUserProfileImageUrl={currentUserProfileImageUrl} currentUserRole={currentProfile?.role || 'seeker'} consultationRequest={consultationRequest} consultationLocked={consultationLocked} endedQuickSessionOverview={endedQuickSessionOverview}/>
    </div>);
}
