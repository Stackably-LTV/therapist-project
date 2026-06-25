import { createClient } from '@/components/9a6b39502e62';
import { redirect } from 'next/navigation';
export default async function AnalyticsPage() {
    const supabase = await createClient();
    const { data: { user }, } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }
    // Get user profile
    const { data: profile } = await supabase
        .from('user_roles')
        .select('role')
        .eq('id', user.id)
        .single();
    if (profile?.role !== 'admin') {
        redirect('/');
    }
    // Get platform statistics
    const { count: totalUsers } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true });
    const { count: totalTherapists } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'therapist')
        .eq('status', 'active');
    const { count: totalClients } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'seeker');
    const { count: totalSessions } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true });
    const { count: completedSessions } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');
    const { count: scheduledSessions } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'scheduled');
    const { count: totalMessages } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true });
    // Get recent sessions for revenue calculation; fetch therapist rates separately
    const { data: sessionsWithRate } = await supabase
        .from('appointments')
        .select('*')
        .eq('status', 'completed')
        .limit(1000);
    const therapistIdsForRevenue = Array.from(new Set((sessionsWithRate ?? []).map((s) => s.therapist_id).filter(Boolean)));
    const { data: therapistRatesAll } = therapistIdsForRevenue.length
        ? await supabase.from('user_profiles').select('user_id, rate').in('user_id', therapistIdsForRevenue)
        : { data: [] };
    const rateById = new Map();
    therapistRatesAll?.forEach((p) => rateById.set(p.user_id, p.rate ?? 0));
    // Calculate total revenue
    const totalRevenue = sessionsWithRate?.reduce((sum, session) => {
        const rate = rateById.get(session.therapist_id) ?? 0;
        const duration = session.duration_minutes || 0;
        return sum + (duration / 60) * rate;
    }, 0) || 0;
    // Get this month's data
    const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const { data: thisMonthUsers } = await supabase
        .from('user_roles')
        .select('created_at')
        .gte('created_at', thisMonthStart.toISOString());
    const { count: thisMonthSessions } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thisMonthStart.toISOString());
    const { data: thisMonthSessionsWithRate } = await supabase
        .from('appointments')
        .select('*')
        .eq('status', 'completed')
        .gte('scheduled_at', thisMonthStart.toISOString());
    const thisMonthRevenue = thisMonthSessionsWithRate?.reduce((sum, session) => {
        const rate = rateById.get(session.therapist_id) ?? 0;
        const duration = session.duration_minutes || 0;
        return sum + (duration / 60) * rate;
    }, 0) || 0;
    // Calculate growth rates
    const newUsersThisMonth = thisMonthUsers?.length || 0;
    const userGrowthRate = totalUsers ? ((newUsersThisMonth / (totalUsers || 1)) * 100).toFixed(1) : '0';
    return (<div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Platform Analytics</h1>
        <p className="mt-2 text-gray-600">Comprehensive platform metrics and insights</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{totalUsers || 0}</p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-full">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
              </svg>
            </div>
          </div>
          <p className="text-sm text-green-600 mt-2">+{newUsersThisMonth} this month</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Sessions</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{totalSessions || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">{completedSessions} completed</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                ${totalRevenue.toFixed(0)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">${thisMonthRevenue.toFixed(0)} this month</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Messages</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{totalMessages || 0}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">Platform communication</p>
        </div>
      </div>

      {/* This Month Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">This Month Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-500">New Users</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{newUsersThisMonth}</p>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-green-600 font-medium">+{userGrowthRate}%</span>
              <span className="text-gray-500 ml-2">growth rate</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Sessions Booked</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{thisMonthSessions || 0}</p>
            <p className="text-sm text-gray-500 mt-2">This month</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Revenue</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">${thisMonthRevenue.toFixed(0)}</p>
            <p className="text-sm text-gray-500 mt-2">This month</p>
          </div>
        </div>
      </div>

      {/* User Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">User Distribution</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>
                <span className="text-gray-700">Therapists</span>
              </div>
              <span className="font-semibold text-gray-900">{totalTherapists || 0}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${((totalTherapists || 0) / (totalUsers || 1)) * 100}%` }}></div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                <span className="text-gray-700">Clients</span>
              </div>
              <span className="font-semibold text-gray-900">{totalClients || 0}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: `${((totalClients || 0) / (totalUsers || 1)) * 100}%` }}></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Session Status</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                <span className="text-gray-700">Completed</span>
              </div>
              <span className="font-semibold text-gray-900">{completedSessions || 0}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: `${((completedSessions || 0) / (totalSessions || 1)) * 100}%` }}></div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <span className="text-gray-700">Scheduled</span>
              </div>
              <span className="font-semibold text-gray-900">{scheduledSessions || 0}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${((scheduledSessions || 0) / (totalSessions || 1)) * 100}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Key Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-500">Avg. Sessions per Therapist</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {totalTherapists ? ((totalSessions || 0) / totalTherapists).toFixed(1) : '0'}
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-500">Avg. Sessions per Client</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {totalClients ? ((totalSessions || 0) / totalClients).toFixed(1) : '0'}
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-500">Completion Rate</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {totalSessions ? (((completedSessions || 0) / totalSessions) * 100).toFixed(0) : '0'}%
            </p>
          </div>
        </div>
      </div>
    </div>);
}
