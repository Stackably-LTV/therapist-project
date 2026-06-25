import { createClient } from '@/components/9a6b39502e62';
import { notFound, redirect } from 'next/navigation';
import TherapistProfileTabs from '@/components/a0b28aa8981a';
export default async function AdminTherapistProfilePage({ params }) {
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
    const [{ data: therapistRole }, { data: therapistProfile }] = await Promise.all([
        supabase
            .from('user_roles')
            .select('id, role, status, created_at')
            .eq('id', therapistId)
            .eq('role', 'therapist')
            .single(),
        supabase.from('user_profiles').select('*').eq('user_id', therapistId).single(),
    ]);
    if (!therapistRole) {
        notFound();
    }
    const therapist = {
        id: therapistRole.id,
        role: therapistRole.role,
        status: therapistRole.status,
        created_at: therapistRole.created_at,
        name: therapistProfile?.full_name ?? '',
        email: '',
        profile_json: therapistProfile ?? {},
        ...(therapistProfile ?? {}),
    };
    return (<div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-blue-800 rounded-2xl p-8 text-white shadow-xl border border-indigo-500/40">
        <p className="text-sm uppercase tracking-[0.3em] text-indigo-200">Admin Insight</p>
        <h1 className="text-4xl font-black mt-2 mb-2">Therapist Profile Overview</h1>
        <p className="text-indigo-100 text-lg max-w-3xl">
          You&apos;re viewing this therapist exactly how they appear to themselves. Use this page to audit their
          credentials, availability, and readiness before taking action in the management suite.
        </p>
      </div>

      <TherapistProfileTabs user={null} profile={therapist} canEdit={false}/>
    </div>);
}
