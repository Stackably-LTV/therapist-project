import { createClient, createServiceRoleClient } from '@/components/9a6b39502e62';
import { notFound, redirect } from 'next/navigation';
import TherapistProfileTabs from '@/components/a0b28aa8981a';
import Link from 'next/link';
export default async function AdminTherapistProfilePage({ params, }) {
    const supabase = await createClient();
    const { therapistId } = await params;
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
        redirect('/login');
    }
    const [{ data: therapistRole }, { data: therapistProfile }, { data: credentials }] = await Promise.all([
        supabase
            .from('user_roles')
            .select('id, role, status, created_at')
            .eq('id', therapistId)
            .eq('role', 'therapist')
            .single(),
        supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', therapistId)
            .single(),
        supabase
            .from('file_uploads')
            .select('id, file_name, file_url, credential_kind')
            .eq('owner_id', therapistId)
            .eq('type', 'credential')
            .order('credential_kind', { ascending: true })
            .order('created_at', { ascending: false }),
    ]);
    if (!therapistRole) {
        notFound();
    }
    // Fetch email from auth.users via service-role admin API
    const serviceClient = createServiceRoleClient();
    let email = '';
    try {
        const { data: authUser } = await serviceClient.auth.admin.getUserById(therapistId);
        email = authUser?.user?.email ?? '';
    }
    catch (e) {
        console.error('[AdminTherapistProfilePage] getUserById error', e);
    }
    const therapist = {
        id: therapistRole.id,
        role: therapistRole.role,
        status: therapistRole.status,
        created_at: therapistRole.created_at,
        name: therapistProfile?.full_name ?? '',
        email,
        profile_json: therapistProfile ?? {},
        credentials: credentials ?? [],
    };
    return (<div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-blue-800 rounded-2xl p-8 text-white shadow-xl border border-indigo-500/40">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-indigo-200">Admin Insight</p>
            <h1 className="text-3xl md:text-4xl font-black mt-2 mb-2">Therapist Profile Review</h1>
            <p className="text-indigo-100 text-base md:text-lg max-w-3xl">
              Review public profile details plus confidential credential uploads. Use the management tools to approve,
              reject, terminate, or reinstate access.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/admin/therapists#therapist-${therapistId}`} className="px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-lg transition">
              Open in Review Queue
            </Link>
            <Link href="/admin/users" className="px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-lg transition">
              User Directory
            </Link>
          </div>
        </div>
      </div>

      <TherapistProfileTabs user={null} profile={therapist} canEdit={false} showConfidentialDocuments/>
    </div>);
}
