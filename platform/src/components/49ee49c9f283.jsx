import { createClient, createServiceRoleClient } from '@/components/9a6b39502e62';
import { redirect } from 'next/navigation';
import { TherapistRecordsClient } from '@/components/fc71efdc2022';
export default async function TherapistRecordsPage({ searchParams, }) {
    const { patient, action } = await searchParams;
    // Notes are patient-scoped (inside the patient profile). If a patient is provided, go there directly.
    if (patient) {
        redirect(`/therapist/clients/${encodeURIComponent(patient)}?tab=notes`);
    }
    const supabase = await createClient();
    const { data: { user }, } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }
    const { data: therapistProfile } = await supabase
        .from('user_profiles')
        .select('full_name, profile_image_url')
        .eq('user_id', user.id)
        .single();
    const authMetadata = user.user_metadata;
    const authAvatar = authMetadata?.avatar_url ||
        authMetadata?.picture ||
        null;
    const profileImageUrl = therapistProfile?.profile_image_url || authAvatar || null;
    const therapist = {
        id: user.id,
        name: therapistProfile?.full_name || 'Therapist',
        email: user.email || '',
        profileImageUrl,
    };
    const { data: rawCharts } = await supabase
        .from('clinical_charts')
        .select('*')
        .eq('therapist_id', user.id)
        .order('created_at', { ascending: false });
    const { data: rawNotes } = await supabase
        .from('clinical_provider_notes')
        .select('*')
        .eq('therapist_id', user.id)
        .order('created_at', { ascending: false });
    const { data: rawAssignedClients } = await supabase
        .from('patient_records')
        .select('seeker_id')
        .eq('primary_therapist_id', user.id);
    const { data: rawSessionClients } = await supabase
        .from('appointments')
        .select('seeker_id')
        .eq('therapist_id', user.id);
    const serviceRole = createServiceRoleClient();
    const { data: pendingInvites } = await serviceRole
        .from('connection_requests')
        .select('id,seeker_id,seeker_email,seeker_name,status,created_at')
        .eq('therapist_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
    const { data: rawTasks } = await supabase
        .from('shared_tasks')
        .select('id, seeker_id, title, status, priority, source, due_date, assigned_at')
        .eq('therapist_id', user.id)
        .order('assigned_at', { ascending: false });
    // Resolve display names for every referenced patient/seeker in one batch.
    const referencedIds = new Set();
    rawCharts?.forEach((c) => c.seeker_id && referencedIds.add(c.seeker_id));
    rawNotes?.forEach((n) => n.seeker_id && referencedIds.add(n.seeker_id));
    rawAssignedClients?.forEach((a) => a.seeker_id && referencedIds.add(a.seeker_id));
    rawSessionClients?.forEach((s) => s.seeker_id && referencedIds.add(s.seeker_id));
    rawTasks?.forEach((t) => t.seeker_id && referencedIds.add(t.seeker_id));
    const referencedIdList = Array.from(referencedIds);
    const { data: referencedProfiles } = referencedIdList.length
        ? await supabase
            .from('user_profiles')
            .select('user_id, full_name')
            .in('user_id', referencedIdList)
        : { data: [] };
    const nameByUserId = new Map();
    referencedProfiles?.forEach((p) => nameByUserId.set(p.user_id, p.full_name));
    const buildPatientRef = (id) => id ? { id, name: nameByUserId.get(id) ?? '', email: '' } : null;
    const charts = (rawCharts ?? []).map((c) => ({
        ...c,
        patient: buildPatientRef(c.seeker_id),
    }));
    const notes = (rawNotes ?? []).map((n) => ({
        ...n,
        patient: buildPatientRef(n.seeker_id),
    }));
    const clients = (rawAssignedClients ?? []).map((a) => ({
        patient_id: a.seeker_id,
        patient: buildPatientRef(a.seeker_id),
    }));
    const sessionClients = (rawSessionClients ?? []).map((s) => ({
        client_id: s.seeker_id,
        client: buildPatientRef(s.seeker_id),
    }));
    const tasks = (rawTasks ?? []).map((t) => ({
        ...t,
        seeker: buildPatientRef(t.seeker_id),
    }));
    const clientMap = new Map();
    clients?.forEach((row) => {
        const p = Array.isArray(row.patient) ? row.patient[0] ?? null : row.patient;
        if (p)
            clientMap.set(row.patient_id, p);
    });
    sessionClients?.forEach((row) => {
        const c = Array.isArray(row.client) ? row.client[0] ?? null : row.client;
        if (c && !clientMap.has(row.client_id))
            clientMap.set(row.client_id, c);
    });
    // Email-invite path: seeker_id is null until they accept. Key by email so the invite
    // still appears in the patient list as "Not accepted".
    pendingInvites?.forEach((invite) => {
        const key = invite.seeker_id || (invite.seeker_email ? `invite:${invite.seeker_email}` : null);
        if (!key || clientMap.has(key))
            return;
        clientMap.set(key, {
            id: key,
            name: invite.seeker_name || invite.seeker_email || 'Pending patient',
            email: invite.seeker_email || '',
            acceptanceStatus: 'not_accepted',
            pendingInviteId: invite.id,
        });
    });
    const allClients = Array.from(clientMap.values());
    return (<TherapistRecordsClient initialCharts={charts || []} initialNotes={notes || []} initialTasks={tasks || []} clients={allClients} therapist={therapist} action={action}/>);
}
