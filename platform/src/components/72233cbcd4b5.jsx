import { createClient } from '@/components/9a6b39502e62';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/c0ebd3fbafc6';
import { Button } from '@/components/2795b661f080';
import { MessageSquare } from 'lucide-react';
import { PatientChartTabs } from '@/components/dae691a5ecc4';
export default async function TherapistClientDetailPage({ params, searchParams, }) {
    const supabase = await createClient();
    const { data: { user }, } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }
    const { clientId } = await params;
    const { tab, session: selectedSessionId } = (await searchParams?.catch?.(() => ({}))) ?? {};
    // Get client details (role + profile, no embedded join)
    const [{ data: clientRole, error: clientError }, { data: clientProfileRow }] = await Promise.all([
        supabase
            .from('user_roles')
            .select('id, role, status, created_at')
            .eq('id', clientId)
            .eq('role', 'seeker')
            .single(),
        supabase.from('user_profiles').select('full_name').eq('user_id', clientId).single(),
    ]);
    if (clientError || !clientRole) {
        notFound();
    }
    const client = {
        id: clientRole.id,
        role: clientRole.role,
        status: clientRole.status,
        created_at: clientRole.created_at,
        name: clientProfileRow?.full_name ?? '',
        email: '',
    };
    // Therapist can view a seeker's chart page if there's any kind of relationship:
    // - patient_records assignment (formal client)
    // - any appointment (booked session)
    // - exchanged messages (active chat thread)
    // - connection_request (pending or accepted invite either direction)
    // The clinical tabs render empty states gracefully when there's no clinical data yet.
    const [{ data: patientProfileCheck }, { data: sessionCheck }, { data: messageCheck }, { data: requestCheck },] = await Promise.all([
        supabase
            .from('patient_records')
            .select('seeker_id')
            .eq('seeker_id', clientId)
            .eq('primary_therapist_id', user.id)
            .maybeSingle(),
        supabase
            .from('appointments')
            .select('id')
            .eq('therapist_id', user.id)
            .eq('seeker_id', clientId)
            .limit(1),
        supabase
            .from('messages')
            .select('id')
            .or(`and(sender_id.eq.${user.id},recipient_id.eq.${clientId}),and(sender_id.eq.${clientId},recipient_id.eq.${user.id})`)
            .limit(1),
        supabase
            .from('connection_requests')
            .select('id')
            .eq('therapist_id', user.id)
            .eq('seeker_id', clientId)
            .limit(1),
    ]);
    const hasPatientChart = !!patientProfileCheck;
    const hasSessions = !!(sessionCheck && sessionCheck.length > 0);
    const hasMessages = !!(messageCheck && messageCheck.length > 0);
    const hasInvite = !!(requestCheck && requestCheck.length > 0);
    if (!hasPatientChart && !hasSessions && !hasMessages && !hasInvite) {
        return (<div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No relationship yet</CardTitle>
            <CardDescription>
              You haven&apos;t messaged or booked with this person.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Once you start a chat or they accept your invite, you&apos;ll be able to see their chart here.
            </p>
            <Link href="/therapist/records?tab=patients">
              <Button>Back to Patients</Button>
            </Link>
          </CardContent>
        </Card>
      </div>);
    }
    const { data: allSessions } = await supabase
        .from('appointments')
        .select('*')
        .eq('therapist_id', user.id)
        .eq('seeker_id', clientId)
        .order('scheduled_at', { ascending: false });
    const { data: patientProfile } = await supabase
        .from('patient_records')
        .select('*')
        .eq('seeker_id', clientId)
        .maybeSingle();
    const { data: noteRows } = await supabase
        .from('clinical_session_notes')
        .select('id, session_id, note_type, status, version, content_json, updated_at, signed_at, signature_method')
        .eq('therapist_id', user.id)
        .eq('seeker_id', clientId)
        .eq('is_current', true)
        .order('updated_at', { ascending: false });
    const { data: standaloneNotes } = await supabase
        .from('clinical_provider_notes')
        .select('*')
        .eq('therapist_id', user.id)
        .eq('seeker_id', clientId)
        .order('created_at', { ascending: false });
    const { data: patientForms } = await supabase
        .from('clinical_charts')
        .select('*')
        .eq('therapist_id', user.id)
        .eq('seeker_id', clientId)
        .order('created_at', { ascending: false });
    const { data: patientTasks } = await supabase
        .from('shared_tasks')
        .select('id, title, description, status, priority, source, due_date, assigned_at, completed_at')
        .eq('therapist_id', user.id)
        .eq('seeker_id', clientId)
        .order('assigned_at', { ascending: false });
    const sessionsWithNotes = new Set((noteRows ?? []).map((n) => n.session_id));
    const totalNotes = sessionsWithNotes.size + (standaloneNotes?.length || 0);
    const totalForms = patientForms?.length || 0;
    const selectedSession = selectedSessionId
        ? (allSessions ?? []).find((s) => s.id === selectedSessionId) ?? null
        : null;
    const { data: selectedServiceCodes } = selectedSession
        ? await supabase
            .from('appointment_billing_codes')
            .select('units, code:billing_service_codes(code, description)')
            .eq('session_id', selectedSession.id)
        : { data: [] };
    // Calculate stats
    const totalSessions = allSessions?.length || 0;
    const completedSessions = allSessions?.filter((s) => s.status === 'completed').length || 0;
    const upcomingSessions = allSessions?.filter((s) => {
        const sessionDate = new Date(s.scheduled_at);
        return !Number.isNaN(sessionDate.getTime()) && sessionDate.getTime() > Date.now() && s.status === 'scheduled';
    }).length || 0;
    return (<div className="space-y-8">
      {/* Header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <Link href="/therapist/records?tab=patients" className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 hover:text-gray-700">
              Back to Patients
            </Link>
            <h1 className="mt-3 text-3xl font-semibold text-gray-900">{client.name}</h1>
            <p className="mt-2 text-sm text-gray-600">{client.email}</p>
          </div>
          <Link href={`/chat?with=${client.id}`}>
            <Button className="h-11 px-5">
              <MessageSquare className="mr-2 h-4 w-4"/>
              Message client
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-gray-200 bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
              Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-gray-900">{totalSessions}</div>
            <p className="mt-1 text-sm text-gray-500">{completedSessions} completed</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
              Upcoming
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-gray-900">{upcomingSessions}</div>
            <p className="mt-1 text-sm text-gray-500">Scheduled sessions</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-gray-900">{totalNotes}</div>
            <p className="mt-1 text-sm text-gray-500">Total notes</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
              Forms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-gray-900">{totalForms}</div>
            <p className="mt-1 text-sm text-gray-500">Patient forms</p>
          </CardContent>
        </Card>
      </div>

      <PatientChartTabs patient={{ id: client.id, name: client.name, email: client.email, created_at: client.created_at }} profile={patientProfile} sessions={allSessions || []} notes={noteRows || []} standaloneNotes={standaloneNotes || []} forms={patientForms || []} tasks={patientTasks || []} selectedSessionNotes={selectedSession
            ? {
                session: selectedSession,
                therapistName: user.user_metadata?.full_name || user.email || 'Clinician',
                existingNotes: (noteRows ?? []).filter((n) => n.session_id === selectedSession.id) || [],
                serviceCodes: selectedServiceCodes || [],
            }
            : null} initialTab={tab || undefined}/>
    </div>);
}
