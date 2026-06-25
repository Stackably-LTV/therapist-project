import { createClient, createServiceRoleClient } from '@/components/9a6b39502e62';
import { redirect } from 'next/navigation';
import TherapistManagementTable from '@/components/1afb2a717b35';
export default async function AdminDashboard() {
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
    const { count: totalTherapists } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'therapist')
        .eq('status', 'active');
    const { count: pendingCount } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'therapist')
        .eq('status', 'pending');
    const { count: suspendedCount } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'therapist')
        .eq('status', 'suspended');
    const { count: rejectedCount } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'therapist')
        .eq('status', 'rejected');
    const admin = createServiceRoleClient();
    // user_roles and user_profiles both FK to auth.users but NOT to each other, so
    // PostgREST can't embed them. Fetch separately and merge by user id — this is
    // why the Review Queue was empty (the embedded query failed and returned null).
    const { data: roles } = await admin
        .from('user_roles')
        .select('id, status, created_at')
        .eq('role', 'therapist')
        .order('created_at', { ascending: false });
    const therapistIds = (roles ?? []).map((r) => r.id);
    const { data: profiles } = therapistIds.length
        ? await admin
            .from('user_profiles')
            .select('user_id, full_name, bio, profile_image_url, specialties, rate, license_number, licensed_states')
            .in('user_id', therapistIds)
        : { data: [] };
    const profileByUserId = new Map((profiles ?? []).map((p) => [p.user_id, p]));
    const emailById = new Map();
    try {
        const { data: authList } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        for (const u of authList?.users ?? []) {
            if (u.email)
                emailById.set(u.id, u.email);
        }
    }
    catch (e) {
        console.error('[AdminDashboard] listUsers error', e);
    }
    const therapists = (roles ?? []).map((r) => {
        const p = profileByUserId.get(r.id);
        return {
            id: r.id,
            name: p?.full_name ?? '',
            email: emailById.get(r.id) ?? '',
            status: r.status,
            created_at: r.created_at,
            profile_json: p
                ? {
                    bio: p.bio,
                    profile_image_url: p.profile_image_url,
                    specialties: p.specialties,
                    rate: p.rate,
                    license_number: p.license_number,
                    licensed_states: p.licensed_states,
                }
                : null,
        };
    });
    const { data: logs } = await admin
        .from('moderation_logs')
        .select('id, therapist_id, action, reason, created_at, admin_id')
        .order('created_at', { ascending: false });
    const adminIds = Array.from(new Set((logs ?? []).map((l) => l.admin_id).filter(Boolean)));
    const adminNameById = new Map();
    if (adminIds.length > 0) {
        const { data: adminProfiles } = await admin
            .from('user_profiles')
            .select('user_id, full_name')
            .in('user_id', adminIds);
        adminProfiles?.forEach((p) => adminNameById.set(p.user_id, p.full_name));
    }
    const normalizedLogs = logs?.map((log) => ({
        id: log.id,
        therapist_id: log.therapist_id,
        action: log.action,
        reason: log.reason,
        created_at: log.created_at,
        admin: log.admin_id ? { name: adminNameById.get(log.admin_id) ?? null } : null,
    })) ?? [];
    return (<div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">Platform overview and management</p>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Therapists</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{totalTherapists || 0}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Approvals</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{pendingCount || 0}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
               <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Suspended Accounts</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{suspendedCount || 0}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Rejected Applications</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{rejectedCount || 0}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Therapist Management Suite */}
      <div className="bg-white rounded-lg shadow p-6">
        <TherapistManagementTable therapists={therapists ?? []} logs={normalizedLogs}/>
      </div>
    </div>);
}
