import { createClient } from '@/components/9a6b39502e62';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LocalTime } from '@/components/0ccac75fc96c';
export default async function ClientDashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }
    // Fetch user profile (split across user_roles + user_profiles)
    const [{ data: roleRow }, { data: profileRow }] = await Promise.all([
        supabase.from('user_roles').select('role, status').eq('id', user.id).single(),
        supabase.from('user_profiles').select('*').eq('user_id', user.id).single(),
    ]);
    const profile = roleRow
        ? {
            role: roleRow.role,
            name: profileRow?.full_name ?? '',
            profile_json: (profileRow ?? {}),
        }
        : null;
    // Fetch all sessions; therapist display data fetched separately
    const { data: rawAllSessions } = await supabase
        .from('appointments')
        .select('*')
        .eq('seeker_id', user.id)
        .order('scheduled_at', { ascending: false });
    const therapistIdsAll = Array.from(new Set((rawAllSessions ?? []).map((s) => s.therapist_id).filter(Boolean)));
    const { data: therapistProfilesAll } = therapistIdsAll.length
        ? await supabase
            .from('user_profiles')
            .select('user_id, full_name, profile_image_url')
            .in('user_id', therapistIdsAll)
        : { data: [] };
    const therapistByIdAll = new Map();
    therapistProfilesAll?.forEach((p) => therapistByIdAll.set(p.user_id, { full_name: p.full_name, profile_image_url: p.profile_image_url }));
    const allSessions = (rawAllSessions ?? []).map((s) => {
        const tp = therapistByIdAll.get(s.therapist_id);
        return {
            ...s,
            therapist: {
                id: s.therapist_id,
                name: tp?.full_name ?? '',
                email: '',
                profile_json: tp?.profile_image_url
                    ? { profile_image_url: tp.profile_image_url }
                    : {},
            },
        };
    });
    // Calculate stats with strict time/status guards
    const now = new Date();
    const nowMs = now.getTime();
    const safeSessions = (allSessions || []).filter((s) => {
        const scheduledAt = new Date(String(s.scheduled_at || ''));
        return !Number.isNaN(scheduledAt.getTime());
    });
    const ACTIVE_SESSION_STATUSES = new Set(['scheduled', 'in_progress', 'pending_payment']);
    const upcomingSessions = safeSessions
        .filter((s) => {
        const scheduledAtMs = new Date(String(s.scheduled_at)).getTime();
        return ACTIVE_SESSION_STATUSES.has(s.status) && scheduledAtMs > nowMs;
    })
        .sort((a, b) => new Date(String(a.scheduled_at)).getTime() - new Date(String(b.scheduled_at)).getTime());
    const completedSessions = safeSessions.filter((s) => {
        const scheduledAtMs = new Date(String(s.scheduled_at)).getTime();
        return s.status === 'completed' && scheduledAtMs <= nowMs;
    }).length;
    const nextSession = upcomingSessions[0];
    // Get treatment plan progress from canonical treatment_plans rows.
    const { data: treatmentPlans } = await supabase
        .from('treatment_plans')
        .select('id, goals_json, status')
        .eq('seeker_id', user.id)
        .in('status', ['sent', 'active']);
    const { data: tasks } = await supabase
        .from('shared_tasks')
        .select('id, title, status, due_date')
        .eq('seeker_id', user.id);
    const safeTasks = tasks || [];
    const goals = (treatmentPlans ?? []).flatMap((plan) => Array.isArray(plan.goals_json) ? plan.goals_json : []);
    const totalGoals = goals.length;
    const achievedGoals = goals.filter((g) => g.status === 'achieved' || g.status === 'completed').length;
    const totalTasks = safeTasks.length;
    const completedTasks = safeTasks.filter((t) => t.status === 'completed').length;
    const overallProgress = totalGoals > 0 || totalTasks > 0
        ? Math.round(((achievedGoals / Math.max(totalGoals, 1)) * 50) + ((completedTasks / Math.max(totalTasks, 1)) * 50))
        : 0;
    // Get unread messages
    const { count: unreadMessages } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .is('read_at', null);
    // Get pending tasks
    const pendingTasks = safeTasks.filter((t) => t.status !== 'completed' && (!t.due_date || new Date(t.due_date) >= now));
    return (<div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {profile?.name}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here&apos;s your progress and upcoming sessions
        </p>
      </div>

      {/* Progress & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-500">Overall Progress</p>
            <svg aria-hidden="true" className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
            </svg>
          </div>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold text-gray-900">{overallProgress}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: `${overallProgress}%` }}/>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-500">Completed Sessions</p>
            <svg aria-hidden="true" className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900">{completedSessions}</p>
          <p className="text-sm text-gray-500 mt-1">sessions attended</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-500">Active Goals</p>
            <svg aria-hidden="true" className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900">{achievedGoals}/{totalGoals}</p>
          <p className="text-sm text-gray-500 mt-1">goals achieved</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-500">Pending Tasks</p>
            <svg aria-hidden="true" className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900">{pendingTasks.length}</p>
          <p className="text-sm text-gray-500 mt-1">tasks to complete</p>
        </div>
      </div>

      {/* Next Session Alert */}
      {nextSession && (<div className="bg-indigo-50 border-l-4 border-indigo-600 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <svg aria-hidden="true" className="w-6 h-6 text-indigo-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-indigo-900">Next Session</h3>
              <p className="text-sm text-indigo-700 mt-1">
                <LocalTime dateStr={nextSession.scheduled_at} variant="datetime"/>
                {' '}with{' '}
                {nextSession.therapist?.name}
              </p>
            </div>
            <Link href={`/seeker/sessions/${nextSession.id}`} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2">
              View Details
            </Link>
          </div>
        </div>)}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link href="/seeker/therapists" className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-4 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <svg aria-hidden="true" className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Book a Session</p>
                <p className="text-sm text-gray-500">Find and schedule with a therapist</p>
              </div>
              <svg aria-hidden="true" className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
              </svg>
            </Link>

            <Link href="/chat" className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-4 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg aria-hidden="true" className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Messages</p>
                <p className="text-sm text-gray-500">Chat with your therapist</p>
              </div>
              {unreadMessages && unreadMessages > 0 && (<span className="rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-800" aria-label={`${unreadMessages} unread messages`}>
                  {unreadMessages}
                </span>)}
            </Link>

            <Link href="/seeker/chart?tab=tasks" className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-4 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <svg aria-hidden="true" className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Care Hub</p>
                <p className="text-sm text-gray-500">Open charts and complete assignments</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Upcoming Sessions</h2>
            <Link href="/seeker/bookings" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              View all →
            </Link>
          </div>

          {upcomingSessions.length === 0 ? (<div className="text-center py-8">
              <svg aria-hidden="true" className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <p className="mt-2 text-sm text-gray-500">No upcoming sessions</p>
              <Link href="/seeker/therapists" className="mt-3 inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium">
                Book a Session
              </Link>
            </div>) : (<div className="space-y-3">
              {upcomingSessions.slice(0, 3).map((session) => (<div key={session.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900">
                        {session.therapist?.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        <LocalTime dateStr={session.scheduled_at} variant="short-date"/>
                        {' '}at{' '}
                        <LocalTime dateStr={session.scheduled_at} variant="time"/>
                      </p>
                    </div>
                    <span className="text-xs font-medium text-gray-600">
                      {Number(session.duration_minutes || 50)} min
                    </span>
                  </div>
                  <Link href={`/seeker/sessions/${session.id}`} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                    View Details →
                  </Link>
                </div>))}
            </div>)}
        </div>
      </div>

      {/* Pending Tasks */}
      {pendingTasks.length > 0 && (<div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Pending Tasks</h2>
          <div className="space-y-3">
            {pendingTasks.slice(0, 3).map((task) => (<div key={task.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="w-5 h-5 rounded border-2 border-gray-300"/>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{task.title}</p>
                  {Boolean(task.due_date) && (<p className="text-sm text-gray-500">
                      Due: {new Date(task.due_date).toLocaleDateString()}
                    </p>)}
                </div>
              </div>))}
          </div>
          {pendingTasks.length > 3 && (<Link href="/seeker/chart?tab=tasks" className="mt-4 block text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              View all {pendingTasks.length} tasks →
            </Link>)}
        </div>)}
    </div>);
}
