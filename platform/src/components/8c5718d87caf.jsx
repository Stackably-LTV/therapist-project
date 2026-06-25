import { createClient } from '@/components/9a6b39502e62';
import { redirect, notFound } from 'next/navigation';
import { Calendar, Clock, User, FileText, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/c0ebd3fbafc6';
import { Button } from '@/components/2795b661f080';
import { Badge } from '@/components/30348591d689';
import Link from 'next/link';
import VideoSessionCard from '@/components/c437e896c122';
import { LocalTime } from '@/components/0ccac75fc96c';
export default async function TherapistSessionPage({ params, }) {
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
    const { data: clientProfile } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, profile_image_url')
        .eq('user_id', rawSession.seeker_id)
        .single();
    const session = {
        ...rawSession,
        client: {
            id: rawSession.seeker_id,
            name: clientProfile?.full_name ?? '',
            email: '',
            profile_json: clientProfile?.profile_image_url
                ? { profile_image_url: clientProfile.profile_image_url }
                : {},
        },
    };
    if (session.therapist_id !== user.id) {
        return (<div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don&apos;t have permission to view this session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/therapist/schedule">
              <Button>Go to My Schedule</Button>
            </Link>
          </CardContent>
        </Card>
      </div>);
    }
    const client = session.client;
    const sessionData = session.session_data_json || {};
    const notes = sessionData.notes && typeof sessionData.notes === 'object'
        ? sessionData.notes
        : null;
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
            {isQuickSession ? `Quick session with ${client?.name}` : `Manage your session with ${client?.name}`}
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
                <CardTitle>Awaiting Payment</CardTitle>
                <CardDescription>
                  The client must pay before video access unlocks for this session.
                </CardDescription>
              </CardHeader>
              {checkoutUrl && (<CardContent>
                  <Button asChild variant="outline">
                    <Link href={checkoutUrl}>Open payment link</Link>
                  </Button>
                </CardContent>)}
            </Card>)}

          {(session.status === 'scheduled' || session.status === 'in_progress') && (<VideoSessionCard sessionId={sessionId} canJoin={canJoin} isUpcoming={isUpcoming} isQuickSession={isQuickSession} sessionStatus={session.status} openInNewTab timeUntilSession={isUpcoming && !isQuickSession
                ? `${Math.floor((scheduledAt.getTime() - new Date().getTime()) / (1000 * 60 * 60))} hours ${Math.floor(((scheduledAt.getTime() - new Date().getTime()) / (1000 * 60)) % 60)} minutes until session`
                : undefined}/>)}

          {(<Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5"/>
                  Session Notes
                </CardTitle>
                <CardDescription>
                  Tied to this session on{' '}
                  <LocalTime dateStr={session.scheduled_at} variant="datetime"/>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {notes ? (<div className="space-y-4">
                    {notes.summary && (<div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Summary</p>
                        <p className="text-gray-800 whitespace-pre-wrap">{notes.summary}</p>
                      </div>)}
                    {Array.isArray(notes.keyTopics) && notes.keyTopics.length > 0 && (<div>
                        <p className="text-sm font-medium text-gray-500 mb-2">Key topics</p>
                        <div className="flex flex-wrap gap-2">
                          {notes.keyTopics.map((t, idx) => (<span key={idx} className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                              {t}
                            </span>))}
                        </div>
                      </div>)}
                    {notes.observations && (<div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Observations</p>
                        <p className="text-gray-800 whitespace-pre-wrap">{notes.observations}</p>
                      </div>)}
                    <div className="pt-2">
                      <Link href={`/therapist/clients/${client?.id}?tab=notes&session=${sessionId}`}>
                        <Button variant="outline" size="sm">
                          <Sparkles className="h-4 w-4 mr-2"/>
                          Edit Notes
                        </Button>
                      </Link>
                    </div>
                  </div>) : (<div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3"/>
                    <p className="text-gray-500 mb-4">No notes added yet</p>
                    <Link href={`/therapist/clients/${client?.id}?tab=notes&session=${sessionId}`}>
                      <Button variant="outline">Add Session Notes</Button>
                    </Link>
                  </div>)}
              </CardContent>
            </Card>)}
        </div>

        <div className="space-y-6">
          {client && (<Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5"/>
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold text-gray-900">{client.name}</p>
                    <p className="text-sm text-gray-500">{client.email}</p>
                  </div>
                  
                  {client.profile_json && (<div className="pt-3 border-t">
                      {client.profile_json.concerns && (<div className="mb-2">
                          <p className="text-sm text-gray-500 mb-1">Primary Concerns</p>
                          <div className="flex flex-wrap gap-1">
                            {client.profile_json.concerns.map((concern, idx) => (<Badge key={idx} variant="secondary" className="text-xs">
                                {concern}
                              </Badge>))}
                          </div>
                        </div>)}
                    </div>)}

                  <Link href={`/chat?with=${client.id}`} className="block">
                    <Button variant="outline" size="sm" className="w-full">
                      Message Client
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
              <Link href="/therapist/schedule" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  View Schedule
                </Button>
              </Link>
              <Link href={`/therapist/clients/${client?.id}`} className="block">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Client Profile
                </Button>
              </Link>
              <Link href={`/therapist/clients/${client?.id}?tab=notes`} className="block">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Progress Notes
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>);
}
