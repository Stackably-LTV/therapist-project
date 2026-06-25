import { createClient } from '@/components/9a6b39502e62';
import { redirect, notFound } from 'next/navigation';
import { Calendar, Clock, User, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/c0ebd3fbafc6';
import { Button } from '@/components/2795b661f080';
import { Badge } from '@/components/30348591d689';
import Link from 'next/link';
import VideoSessionCard from '@/components/c437e896c122';
import { LocalTime } from '@/components/0ccac75fc96c';
export default async function ClientSessionPage({ params, }) {
    const supabase = await createClient();
    const { sessionId } = await params;
    const { data: { user }, } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }
    const { data: rawSession, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', sessionId)
        .single();
    if (error || !rawSession) {
        notFound();
    }
    const { data: therapistProfile } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, profile_image_url, specialties')
        .eq('user_id', rawSession.therapist_id)
        .single();
    const session = {
        ...rawSession,
        therapist: {
            id: rawSession.therapist_id,
            name: therapistProfile?.full_name ?? '',
            email: '',
            profile_json: {
                profile_image_url: therapistProfile?.profile_image_url ?? undefined,
                specialties: therapistProfile?.specialties ?? undefined,
            },
        },
    };
    if (session.seeker_id !== user.id) {
        return (<div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don&apos;t have permission to view this session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/seeker/bookings">
              <Button>Go to My Bookings</Button>
            </Link>
          </CardContent>
        </Card>
      </div>);
    }
    const therapist = session.therapist;
    const sessionData = session.session_data_json || {};
    const isQuickSession = session.session_type === 'quick_session' ||
        sessionData.origin === 'dm_video_call' ||
        sessionData.quick_session === true;
    const scheduledAt = new Date(session.scheduled_at);
    const now = new Date();
    const isUpcoming = scheduledAt > new Date();
    const prejoinAt = new Date(scheduledAt.getTime() - 30 * 60 * 1000);
    const sessionEndsAt = new Date(scheduledAt.getTime() + Math.max(session.duration_minutes, 15) * 60 * 1000);
    const canJoinByTime = isQuickSession ? now <= sessionEndsAt : now >= prejoinAt && now <= sessionEndsAt;
    const canJoin = (session.status === 'scheduled' || session.status === 'in_progress') &&
        canJoinByTime;
    const checkoutUrl = typeof sessionData.stripe_checkout_url === 'string' ? sessionData.stripe_checkout_url : null;
    const statusColors = {
        scheduled: 'bg-blue-100 text-blue-800',
        completed: 'bg-green-100 text-green-800',
        cancelled: 'bg-red-100 text-red-800',
        pending_payment: 'bg-yellow-100 text-yellow-800',
    };
    return (<div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Session Details</h1>
          <p className="text-gray-600 mt-2">
            {isQuickSession
            ? 'Quick session is active and can be joined immediately'
            : 'View your session information and join when it&apos;s time'}
          </p>
        </div>
        <Badge className={statusColors[session.status] || 'bg-gray-100 text-gray-800'}>
          {session.status.replace('_', ' ').toUpperCase()}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Session Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-indigo-600"/>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium text-gray-900">
                    <LocalTime dateStr={session.scheduled_at} variant="date"/>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600"/>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Time</p>
                  <p className="font-medium text-gray-900">
                    <LocalTime dateStr={session.scheduled_at} variant="time"/>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Clock className="h-5 w-5 text-purple-600"/>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-medium text-gray-900">{session.duration_minutes} minutes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {session.status === 'pending_payment' && (<Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle>Payment Required</CardTitle>
                <CardDescription>
                  Pay for this session before it starts to unlock video access.
                </CardDescription>
              </CardHeader>
              {checkoutUrl && (<CardContent>
                  <Button asChild>
                    <Link href={checkoutUrl}>Pay with Stripe</Link>
                  </Button>
                </CardContent>)}
            </Card>)}

          {(session.status === 'scheduled' || session.status === 'in_progress') && (<VideoSessionCard sessionId={sessionId} canJoin={canJoin} isUpcoming={isUpcoming} isQuickSession={isQuickSession} sessionStatus={session.status} timeUntilSession={isUpcoming && !isQuickSession
                ? `${Math.floor((scheduledAt.getTime() - new Date().getTime()) / (1000 * 60 * 60))} hours ${Math.floor(((scheduledAt.getTime() - new Date().getTime()) / (1000 * 60)) % 60)} minutes until session`
                : undefined}/>)}

          {session.status === 'completed' && sessionData.notes && (<Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5"/>
                  Session Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {sessionData.notes}
                </p>
              </CardContent>
            </Card>)}
        </div>

        <div className="space-y-6">
          {therapist && (<Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5"/>
                  Your Therapist
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold text-gray-900">{therapist.name}</p>
                    <p className="text-sm text-gray-500">{therapist.email}</p>
                  </div>
                  
                  {therapist.profile_json && (<div className="pt-3 border-t">
                      {therapist.profile_json.specialties && (<div className="mb-2">
                          <p className="text-sm text-gray-500 mb-1">Specialties</p>
                          <div className="flex flex-wrap gap-1">
                            {therapist.profile_json.specialties.map((specialty, idx) => (<Badge key={idx} variant="secondary" className="text-xs">
                                {specialty}
                              </Badge>))}
                          </div>
                        </div>)}
                      
                      {therapist.profile_json.approach && (<div>
                          <p className="text-sm text-gray-500 mb-1">Approach</p>
                          <p className="text-sm text-gray-700">{therapist.profile_json.approach}</p>
                        </div>)}
                    </div>)}

                  <Link href={`/chat?with=${therapist.id}`} className="block">
                    <Button variant="outline" size="sm" className="w-full">
                      Message Therapist
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>)}

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/seeker/bookings" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  View All Bookings
                </Button>
              </Link>
              <Link href="/seeker/documents" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  My Documents
                </Button>
              </Link>
              <Link href="/seeker/chart" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  View My Chart
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>);
}
