import { redirect } from 'next/navigation';
import { createClient } from '@/components/9a6b39502e62';
import { SidebarProvider, SidebarInset, DashboardSidebar } from '@/components/6dca437e8f95';
import { DashboardHeader } from '@/components/6bb1cacc807e';
import { getTherapistFeatures } from '@/components/c5276438fd9f';
import ConsultationRealtimeBootstrap from '@/components/00b9d57ff28d';
export default async function DashboardLayout({ children, }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }
    if (!user.email_confirmed_at) {
        redirect('/login?mode=signup&');
    }
    const { data: roleRow } = await supabase
        .from('user_roles')
        .select('role, status')
        .eq('id', user.id)
        .single();
    if (!roleRow) {
        redirect('/login?mode=signup&');
    }
    const { data: profileRow } = await supabase
        .from('user_profiles')
        .select('full_name, profile_image_url')
        .eq('user_id', user.id)
        .single();
    const userRole = roleRow.role;
    const userName = profileRow?.full_name || 'User';
    const userEmail = user.email || '';
    const authMetadata = user.user_metadata;
    const authAvatar = authMetadata?.avatar_url ||
        authMetadata?.picture ||
        null;
    const profileImageUrl = profileRow?.profile_image_url || authAvatar || null;
    const therapistFeatures = userRole === 'therapist' ? Array.from(await getTherapistFeatures(user.id)) : null;
    return (<SidebarProvider defaultOpen>
      <ConsultationRealtimeBootstrap currentUserId={user.id} currentUserRole={userRole}/>
      <DashboardSidebar userRole={userRole} userName={userName} userEmail={userEmail} profileImageUrl={profileImageUrl} therapistFeatures={therapistFeatures}/>
      <SidebarInset>
        <DashboardHeader userRole={userRole}/>
        <div className="flex flex-1 min-h-0 flex-col gap-4 p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>);
}
