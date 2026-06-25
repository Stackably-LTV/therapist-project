import { createClient, createServiceRoleClient } from '@/components/9a6b39502e62';
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/c0ebd3fbafc6';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/2318256b5648';
import { Badge } from '@/components/30348591d689';
import { Button } from '@/components/2795b661f080';
import { ArrowLeft, Mail, Calendar, Shield, User, Phone, FileText, Clock } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/93bde5168d2a';
export default async function AdminUserDetailsPage({ params, }) {
    const supabase = await createClient();
    const { data: { user }, } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }
    // Check admin role
    const { data: adminProfile } = await supabase
        .from('user_roles')
        .select('role')
        .eq('id', user.id)
        .single();
    if (adminProfile?.role !== 'admin') {
        redirect('/');
    }
    const { userId } = await params;
    // Fetch target user details (role + profile)
    const [{ data: targetRole, error }, { data: targetProfileRow }] = await Promise.all([
        supabase.from('user_roles').select('id, role, status, created_at').eq('id', userId).single(),
        supabase
            .from('user_profiles')
            .select('full_name, bio, phone_e164, time_zone, profile_image_url')
            .eq('user_id', userId)
            .single(),
    ]);
    if (error || !targetRole) {
        notFound();
    }
    // Fetch email from auth.users via service-role admin API
    const serviceClient = createServiceRoleClient();
    let email = '';
    try {
        const { data: authUser } = await serviceClient.auth.admin.getUserById(userId);
        email = authUser?.user?.email ?? '';
    }
    catch (e) {
        console.error('[AdminUserDetailsPage] getUserById error', e);
    }
    const targetUser = {
        id: targetRole.id,
        role: targetRole.role,
        status: targetRole.status,
        created_at: targetRole.created_at,
        name: targetProfileRow?.full_name ?? '',
        email,
        last_seen_at: null,
    };
    const profile = {
        bio: targetProfileRow?.bio ?? undefined,
        phone: targetProfileRow?.phone_e164 ?? undefined,
        timezone: targetProfileRow?.time_zone ?? undefined,
        profile_image_url: targetProfileRow?.profile_image_url ?? undefined,
    };
    const isTherapist = targetUser.role === 'therapist';
    const profileTitle = isTherapist ? 'Therapist Profile Overview' : 'Client Profile Overview';
    const profileDescription = isTherapist
        ? 'View detailed therapist information, application status, credentials, and account history.'
        : 'View detailed client information, account status, and history. Manage their access and support their journey.';
    const detailsTabLabel = isTherapist ? 'Therapist Details' : 'Client Details';
    const initials = targetUser.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    return (<div className="space-y-6">
      {/* Admin Insight Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-blue-800 rounded-2xl p-8 text-white shadow-xl border border-indigo-500/40 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" asChild className="text-indigo-200 hover:text-white hover:bg-white/10 -ml-2">
              <Link href="/admin/users">
                <ArrowLeft className="w-4 h-4 mr-2"/>
                Back to Users
              </Link>
            </Button>
            <span className="text-sm uppercase tracking-[0.3em] text-indigo-200 font-semibold">Admin Insight</span>
          </div>
          <h1 className="text-4xl font-black mb-2">{profileTitle}</h1>
          <p className="text-indigo-100 text-lg max-w-3xl">
            {profileDescription}
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Card */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-2 bg-gradient-to-br from-white to-blue-50/30">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                  {profile.profile_image_url ? (<AvatarImage src={profile.profile_image_url} alt={targetUser.name}/>) : (<AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-3xl font-bold">
                      {initials}
                    </AvatarFallback>)}
                </Avatar>

                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-bold text-gray-900">{targetUser.name}</h2>
                    <Badge className={`capitalize px-3 py-1 text-sm ${targetUser.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
            targetUser.status === 'pending' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' :
                'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                      {targetUser.status}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4"/>
                      <span>{targetUser.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4"/>
                      <span>Joined {new Date(targetUser.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="details" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">{detailsTabLabel}</TabsTrigger>
              <TabsTrigger value="activity">Activity & History</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600"/>
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">Phone Number</p>
                      <div className="flex items-center gap-2 text-gray-900">
                        <Phone className="w-4 h-4 text-gray-400"/>
                        {profile.phone || 'Not provided'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                      <div className="flex items-center gap-2 text-gray-900">
                        <Calendar className="w-4 h-4 text-gray-400"/>
                        {profile.date_of_birth || 'Not provided'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Bio / Notes</p>
                    <div className="bg-gray-50 p-4 rounded-lg text-gray-700 min-h-[100px]">
                      {profile.bio || 'No additional notes provided.'}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-600"/>
                    Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent>
                   <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">Communication Preference</p>
                      <p className="text-gray-900 capitalize">{profile.communication_preference || 'Email'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">Timezone</p>
                      <p className="text-gray-900">{profile.timezone || 'UTC'}</p>
                    </div>
                   </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>System logs and user actions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300"/>
                    <p>No recent activity logs found.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar / Actions */}
        <div className="space-y-6">
          <Card className="border-0 shadow-sm ring-1 ring-gray-200">
            <CardHeader>
              <CardTitle className="text-lg">Account Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Shield className="w-4 h-4 mr-2"/>
                Reset Password
              </Button>
              <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200">
                <Shield className="w-4 h-4 mr-2"/>
                Suspend Account
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm ring-1 ring-gray-200">
            <CardHeader>
              <CardTitle className="text-lg">System Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">User ID</span>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">{targetUser.id.split('-')[0]}...</code>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Role</span>
                <Badge variant="outline" className="capitalize">{targetUser.role}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Last Active</span>
                <span className="text-gray-900 font-medium">
                  {targetUser.last_seen_at
            ? formatDistanceToNow(new Date(targetUser.last_seen_at), { addSuffix: true })
            : 'Never'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>);
}
