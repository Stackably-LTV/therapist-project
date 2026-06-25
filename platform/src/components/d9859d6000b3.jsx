import { createClient, createServiceRoleClient } from '@/components/9a6b39502e62';
import { redirect } from 'next/navigation';
import TherapistManagementTable from '@/components/1afb2a717b35';
import { Pagination } from '@/components/fb010e1125d7';
const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 25;
export default async function AdminTherapistsPage({ searchParams }) {
    const supabase = await createClient();
    const { data: { user }, } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }
    const { data: adminProfile } = await supabase
        .from('user_roles')
        .select('role')
        .eq('id', user.id)
        .single();
    if (adminProfile?.role !== 'admin') {
        redirect('/');
    }
    // Parse pagination params
    const page = Math.max(1, parseInt(searchParams.page ?? String(DEFAULT_PAGE), 10));
    const perPage = Math.max(1, parseInt(searchParams.perPage ?? String(DEFAULT_PER_PAGE), 10));
    const admin = createServiceRoleClient();
    // Get total count of therapists
    const { count: totalCount } = await admin
        .from('user_roles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'therapist');
    const totalPages = Math.ceil((totalCount ?? 0) / perPage);
    // Get paginated therapist roles
    const fromIdx = (page - 1) * perPage;
    const toIdx = fromIdx + perPage - 1;
    const { data: roles } = await admin
        .from('user_roles')
        .select('id, status, created_at, user_profiles(full_name, bio, profile_image_url, specialties, rate, license_number, licensed_states)')
        .eq('role', 'therapist')
        .order('created_at', { ascending: false })
        .range(fromIdx, toIdx);
    // Fetch auth users to attach emails
    const emailById = new Map();
    try {
        const { data: authList } = await admin.auth.admin.listUsers({ page, perPage });
        for (const u of authList?.users ?? []) {
            if (u.email)
                emailById.set(u.id, u.email);
        }
    }
    catch (e) {
        console.error('[AdminTherapistsPage] listUsers error', e);
    }
    const therapists = (roles ?? []).map((r) => {
        const p = Array.isArray(r.user_profiles) ? r.user_profiles[0] : r.user_profiles;
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
    // Resolve admin names from user_profiles
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
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black text-gray-900">Therapist Management</h1>
        <p className="text-gray-600 text-lg">
          Review every therapist profile, approve or reject in a click, and keep a full audit trail of your decisions.
        </p>
      </div>

      <TherapistManagementTable therapists={therapists ?? []} logs={normalizedLogs}/>

      {totalPages > 1 && (<Pagination currentPage={page} totalPages={totalPages} baseUrl="/admin/therapists"/>)}
    </div>);
}
