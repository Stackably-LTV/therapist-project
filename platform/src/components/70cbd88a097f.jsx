import { createClient } from '@/components/9a6b39502e62';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getTherapistSubscriptionSummary } from '@/components/c5276438fd9f';
import { isTherapistPayoutReady } from '@/components/73ba0fd5210e';
import { LocalTime, LocalDateCard } from '@/components/0ccac75fc96c';
export default async function TherapistDashboard() {
    const supabase = await createClient();
    const { data: { user }, } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }
    // Get therapist role + profile
    const [{ data: roleRow }, { data: profileRow }] = await Promise.all([
        supabase.from('user_roles').select('role, status').eq('id', user.id).single(),
        supabase
            .from('user_profiles')
            .select('full_name, onboarding_completed')
            .eq('user_id', user.id)
            .single(),
    ]);
    // STRICT: Verify user is a therapist
    if (!roleRow || roleRow.role !== 'therapist') {
        redirect('/login?mode=signup&');
    }
    if (!profileRow?.onboarding_completed) {
        redirect('/login');
    }
    // STRICT: Only allow dashboard access if status is 'active' (approved by admin)
    if (roleRow.status !== 'active') {
        redirect('/status');
    }
    const profile = { name: profileRow?.full_name ?? '' };
    // Get subscription summary
    const subscription = await getTherapistSubscriptionSummary(user.id);
    const hasActiveSubscription = subscription.status === 'active' || subscription.status === 'trialing';
    // Check payout readiness
    const payoutCheck = await isTherapistPayoutReady(user.id);
    const TIER_DISPLAY = {
        T1: { name: 'Starter', color: 'text-slate-700', bg: 'bg-slate-100' },
        T2: { name: 'Professional', color: 'text-indigo-700', bg: 'bg-indigo-100' },
        T3: { name: 'Enterprise', color: 'text-violet-700', bg: 'bg-violet-100' },
    };
    const tierDisplay = TIER_DISPLAY[subscription.tierCode ?? ''] ?? { name: subscription.tierName, color: 'text-gray-700', bg: 'bg-gray-100' };
    // Get all sessions; fetch seeker display names from user_profiles separately
    const { data: rawAllSessions } = await supabase
        .from('appointments')
        .select('*')
        .eq('therapist_id', user.id)
        .order('scheduled_at', { ascending: false });
    const seekerIds = Array.from(new Set((rawAllSessions ?? []).map((s) => s.seeker_id).filter(Boolean)));
    const { data: seekerProfilesForSessions } = seekerIds.length
        ? await supabase
            .from('user_profiles')
            .select('user_id, full_name')
            .in('user_id', seekerIds)
        : { data: [] };
    const seekerNameById = new Map();
    seekerProfilesForSessions?.forEach((p) => seekerNameById.set(p.user_id, p.full_name));
    const allSessions = (rawAllSessions ?? []).map((s) => ({
        ...s,
        client_id: s.seeker_id,
        client: { id: s.seeker_id, name: seekerNameById.get(s.seeker_id) ?? '', email: '' },
    }));
    // Get upcoming sessions (next 7 days) and today's sessions with strict guards
    const now = new Date();
    const nowMs = now.getTime();
    const nextWeekMs = nowMs + 7 * 24 * 60 * 60 * 1000;
    const safeSessions = (allSessions || []).filter((s) => {
        const scheduledAt = new Date(String(s.scheduled_at || ''));
        return !Number.isNaN(scheduledAt.getTime());
    });
    const ACTIVE_STATUSES = new Set(['scheduled', 'in_progress']);
    const upcomingSessions = safeSessions
        .filter((s) => {
        const sessionMs = new Date(String(s.scheduled_at)).getTime();
        return ACTIVE_STATUSES.has(s.status) && sessionMs > nowMs && sessionMs <= nextWeekMs;
    })
        .sort((a, b) => new Date(String(a.scheduled_at)).getTime() - new Date(String(b.scheduled_at)).getTime());
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    const todayStartMs = todayStart.getTime();
    const todayEndMs = todayEnd.getTime();
    const todaySessions = safeSessions.filter((s) => {
        const sessionMs = new Date(String(s.scheduled_at)).getTime();
        return sessionMs >= todayStartMs && sessionMs <= todayEndMs;
    });
    // Calculate stats
    const totalClients = new Set(safeSessions.map((s) => s.client_id)).size || 0;
    const completedSessions = safeSessions.filter((s) => {
        const sessionMs = new Date(String(s.scheduled_at)).getTime();
        return s.status === 'completed' && sessionMs <= nowMs;
    }).length;
    const scheduledSessions = upcomingSessions.length;
    // Get unread messages count
    // Past sessions needing notes (no signed session_note yet)
    const pastSessions = safeSessions
        .filter((s) => new Date(String(s.scheduled_at)).getTime() <= nowMs)
        .slice(0, 20);
    const pastSessionIds = pastSessions.map((s) => s.id);
    let signedIds = new Set();
    if (pastSessionIds.length) {
        const { data: signedNotes } = await supabase
            .from('clinical_session_notes')
            .select('session_id,status')
            .in('session_id', pastSessionIds)
            .eq('status', 'signed');
        signedIds = new Set((signedNotes || []).map((row) => String(row.session_id)));
    }
    const notesToWrite = pastSessions
        .filter((s) => !signedIds.has(s.id))
        .slice(0, 5);
    const { count: unreadMessages } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .is('read_at', null);
    const { data: latestIncomingMessage } = await supabase
        .from('messages')
        .select('created_at')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    const unreadCount = unreadMessages || 0;
    const messageStatus = unreadCount > 0
        ? `${unreadCount} unread`
        : latestIncomingMessage?.created_at
            ? `Last message ${new Date(latestIncomingMessage.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
            })}`
            : 'No messages yet';
    return (<div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {profile?.name}
        </h1>
        <p className="mt-2 text-gray-600">Here&apos;s what&apos;s happening in your practice today</p>
      </div>

      {/* Payout Readiness Banner */}
      {!payoutCheck.ready && (<div className="flex items-center justify-between rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-orange-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100">
              <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 0v2m0-6h0m0 0h0M7 20H5a2 2 0 01-2-2V9.414a1 1 0 00-.293-.707l-.914-.914A1 1 0 005.414 2h13.172a1 1 0 01.707.293l.914.914A1 1 0 0120 9.414V18a2 2 0 01-2 2h-2m0 0H9m0 0h0m0-6V7a2 2 0 012-2h2a2 2 0 012 2v2m0 0V9m0 0h0m0 6h0"/></svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Payment setup incomplete</p>
              <p className="text-xs text-gray-600">Set up your Stripe Connect account to start receiving bookings</p>
            </div>
          </div>
          <Link href="/therapist/billing" className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700">
            Complete setup
          </Link>
        </div>)}

      {/* Subscription Banner */}
      {hasActiveSubscription ? (<div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100">
              <svg className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold mr-2 ${tierDisplay.bg} ${tierDisplay.color}`}>
                  {tierDisplay.name}
                </span>
                plan active
              </p>
              <p className="text-xs text-gray-500">
                {subscription.features.length} features unlocked
                {subscription.currentPeriodEnd && (<> &middot; Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</>)}
              </p>
            </div>
          </div>
          <Link href="/therapist/billing" className="text-sm font-medium text-emerald-700 hover:text-emerald-800 transition">
            Manage plan &rarr;
          </Link>
        </div>) : (<div className="flex items-center justify-between rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100">
              <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">You&apos;re on the free tier</p>
              <p className="text-xs text-gray-500">Subscribe to unlock video sessions, notes, courses, and more</p>
            </div>
          </div>
          <Link href="/therapist/billing" className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700">
            View plans
          </Link>
        </div>)}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Clients</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{totalClients}</p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-full">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
            </div>
          </div>
          <Link href="/therapist/records?tab=patients" className="mt-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            View all clients →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Completed Sessions</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{completedSessions}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
          <Link href="/therapist/records?tab=patients" className="mt-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            Open patient charts →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Upcoming Sessions</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{scheduledSessions}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
          </div>
          <Link href="/therapist/schedule" className="mt-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            Open schedule →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Unread Messages</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{unreadMessages || 0}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
          <Link href="/chat" className="mt-4 inline-block text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            Go to messages →
          </Link>
        </div>
      </div>

      {/* Today's Sessions */}
      {todaySessions.length > 0 && (<div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Today&apos;s Sessions</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {todaySessions.map((session) => (<div key={session.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {session.client?.name || 'Client'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      <LocalTime dateStr={session.scheduled_at} variant="time"/> • {Number(session.duration_minutes || 50)} minutes
                    </p>
                  </div>
                  <Link href={`/therapist/sessions/${session.id}`} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm">
                    View Session
                  </Link>
                </div>
              </div>))}
          </div>
        </div>)}

      {/* Notes to write */}
      {notesToWrite.length > 0 && (<div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Notes to write</h2>
            <span className="text-xs text-gray-500">{notesToWrite.length} pending</span>
          </div>
          <div className="divide-y divide-gray-200">
            {notesToWrite.map((session) => (<Link key={session.id} href={`/therapist/clients/${session.seeker_id}?tab=notes&session=${session.id}`} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {session.client?.name || 'Client'}
                  </p>
                  <p className="text-sm text-gray-500">
                    <LocalTime dateStr={session.scheduled_at} variant="datetime"/> · {Number(session.duration_minutes || 50)} min · {String(session.session_type || 'therapy')}
                  </p>
                </div>
                <span className="text-sm font-medium text-indigo-600 shrink-0 ml-4">Write note →</span>
              </Link>))}
          </div>
        </div>)}

      {/* Quick Actions & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link href="/chat" className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
                <div>
                  <p className="font-medium text-gray-900">Messages</p>
                  <p className="text-xs text-gray-500">{messageStatus}</p>
                </div>
              </div>
              {unreadCount > 0 ? (<span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full">
                  {unreadCount}
                </span>) : (<span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                  Up to date
                </span>)}
            </Link>

            <Link href="/therapist/profile?tab=availability" className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <span className="font-medium text-gray-900">Manage Schedule</span>
            </Link>

            <Link href="/therapist/records?tab=patients" className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
              </svg>
              <span className="font-medium text-gray-900">View Clients</span>
            </Link>

            <Link href="/therapist/records?tab=patients" className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              <span className="font-medium text-gray-900">Progress Notes</span>
            </Link>
          </div>
        </div>

        {/* Upcoming This Week */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">This Week</h2>
          {upcomingSessions.length === 0 ? (<p className="text-gray-500 text-center py-8">No upcoming sessions this week</p>) : (<div className="space-y-3">
              {upcomingSessions.slice(0, 5).map((session) => (<Link key={session.id} href={`/therapist/sessions/${session.id}`} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <LocalDateCard dateStr={session.scheduled_at} className="flex-shrink-0 text-center"/>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {session.client?.name || 'Client'}
                    </p>
                    <p className="text-sm text-gray-500">
                      <LocalTime dateStr={session.scheduled_at} variant="time"/>
                    </p>
                  </div>
                  <span className="text-xs font-medium text-indigo-600 shrink-0">View</span>
                </Link>))}
            </div>)}
        </div>
      </div>
    </div>);
}
