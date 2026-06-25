import { createClient } from '@/components/9a6b39502e62';
import { redirect } from 'next/navigation';
import ClientProfileForm from '@/components/518361ae1b7d';
import PersonalInfoCard from '@/components/c8ff77b22582';
import { ChangePasswordCard } from '@/components/c93174eba105';
export default async function ClientProfilePage() {
    const supabase = await createClient();
    const { data: { user }, } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }
    // Fetch user profile (split across user_roles + user_profiles)
    const [{ data: roleRow }, { data: profileRow, error: profileError }] = await Promise.all([
        supabase.from('user_roles').select('role, status').eq('id', user.id).single(),
        supabase.from('user_profiles').select('*').eq('user_id', user.id).single(),
    ]);
    const profile = roleRow
        ? {
            id: user.id,
            role: roleRow.role,
            status: roleRow.status,
            name: profileRow?.full_name ?? '',
            email: user.email ?? '',
            profile_json: (profileRow ?? {}),
            ...(profileRow ?? {}),
        }
        : null;
    return (<div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your account information and preferences
        </p>
      </div>

      {profileError && (<div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">Some profile data could not be loaded.</p>
          <p className="mt-1 text-amber-800">You can still update fields and save changes.</p>
        </div>)}

      {/* Account Profile (display name, bio, phone, image, pronouns) */}
      <ClientProfileForm user={user} profile={profile}/>

      <ChangePasswordCard email={user.email ?? ''}/>

      {/* Personal Info — seeker-owned, therapist read-only */}
      {roleRow?.role === 'seeker' && <PersonalInfoCard />}
    </div>);
}
