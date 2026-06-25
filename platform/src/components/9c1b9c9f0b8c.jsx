import { createClient } from '@/components/9a6b39502e62';
import { redirect } from 'next/navigation';
import TherapistSchedule from '@/components/649ac7670965';
function asSingle(value) {
    if (Array.isArray(value))
        return value[0] ?? null;
    return value ?? null;
}
export default async function TherapistSchedulePage() {
    const supabase = await createClient();
    const { data: { user }, } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }
    // Keep past sessions visible so therapists can review calendar history after a session ends.
    // Bound both sides of the range for predictable schedule page performance.
    const now = new Date();
    const rangeStart = new Date(now);
    rangeStart.setDate(rangeStart.getDate() - 365);
    rangeStart.setHours(0, 0, 0, 0);
    const rangeEnd = new Date(now);
    rangeEnd.setDate(rangeEnd.getDate() + 90);
    rangeEnd.setHours(23, 59, 59, 999);
    const { data: rawSessions } = await supabase
        .from('appointments')
        .select(`
        id,
        scheduled_at,
        duration_minutes,
        status,
        session_type,
        location_type,
        location_label,
        telehealth_url,
        seeker_id
      `)
        .eq('therapist_id', user.id)
        .gte('scheduled_at', rangeStart.toISOString())
        .lte('scheduled_at', rangeEnd.toISOString())
        .order('scheduled_at', { ascending: true });
    const { data: blocks } = await supabase
        .from('calendar_blocks')
        .select('id, start_at, end_at, kind, title, notes')
        .eq('therapist_id', user.id)
        .gte('end_at', rangeStart.toISOString())
        .lte('end_at', rangeEnd.toISOString())
        .order('start_at', { ascending: true });
    const { data: assignedClientRecords } = await supabase
        .from('patient_records')
        .select('seeker_id')
        .eq('primary_therapist_id', user.id);
    const { data: rawMessagesSched } = await supabase
        .from('messages')
        .select('sender_id, recipient_id')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(300);
    // Resolve names + roles for all referenced participants in a single batch.
    const allParticipantIds = new Set();
    rawSessions?.forEach((s) => s.seeker_id && allParticipantIds.add(s.seeker_id));
    assignedClientRecords?.forEach((a) => a.seeker_id && allParticipantIds.add(a.seeker_id));
    rawMessagesSched?.forEach((m) => {
        if (m.sender_id !== user.id)
            allParticipantIds.add(m.sender_id);
        if (m.recipient_id !== user.id)
            allParticipantIds.add(m.recipient_id);
    });
    const participantIdList = Array.from(allParticipantIds);
    const [{ data: participantRoles }, { data: participantProfiles }] = await Promise.all([
        participantIdList.length
            ? supabase.from('user_roles').select('id, role').in('id', participantIdList)
            : Promise.resolve({ data: [] }),
        participantIdList.length
            ? supabase
                .from('user_profiles')
                .select('user_id, full_name')
                .in('user_id', participantIdList)
            : Promise.resolve({ data: [] }),
    ]);
    const roleByIdSched = new Map();
    participantRoles?.forEach((r) => roleByIdSched.set(r.id, r.role));
    const nameByIdSched = new Map();
    participantProfiles?.forEach((p) => nameByIdSched.set(p.user_id, p.full_name));
    const sessions = (rawSessions ?? []).map((s) => ({
        id: s.id,
        scheduled_at: s.scheduled_at,
        duration_minutes: s.duration_minutes,
        status: s.status,
        session_type: s.session_type,
        location_type: s.location_type,
        location_label: s.location_label,
        telehealth_url: s.telehealth_url,
        client: {
            id: s.seeker_id,
            name: nameByIdSched.get(s.seeker_id) ?? 'Client',
            email: '',
            role: roleByIdSched.get(s.seeker_id) ?? null,
        },
    }));
    const assignedClients = (assignedClientRecords ?? []).map((a) => ({
        patient_id: a.seeker_id,
        patient: {
            id: a.seeker_id,
            name: nameByIdSched.get(a.seeker_id) ?? 'Client',
            email: '',
            role: roleByIdSched.get(a.seeker_id) ?? null,
        },
    }));
    const messages = (rawMessagesSched ?? []).map((m) => ({
        sender_id: m.sender_id,
        recipient_id: m.recipient_id,
        sender: {
            id: m.sender_id,
            name: nameByIdSched.get(m.sender_id) ?? '',
            email: '',
            role: roleByIdSched.get(m.sender_id) ?? null,
        },
        recipient: {
            id: m.recipient_id,
            name: nameByIdSched.get(m.recipient_id) ?? '',
            email: '',
            role: roleByIdSched.get(m.recipient_id) ?? null,
        },
    }));
    const sessionRows = (sessions || []);
    const blockRows = (blocks || []);
    const assignedClientRows = (assignedClients || []);
    const messageRows = (messages || []);
    const clientMap = new Map();
    for (const row of sessionRows) {
        const client = asSingle(row.client);
        if (!client?.id)
            continue;
        clientMap.set(String(client.id), {
            id: String(client.id),
            name: String(client.name || 'Client'),
            email: String(client.email || ''),
            source: 'client',
        });
    }
    for (const row of assignedClientRows) {
        const patient = asSingle(row.patient);
        if (!patient?.id)
            continue;
        clientMap.set(String(patient.id), {
            id: String(patient.id),
            name: String(patient.name || 'Client'),
            email: String(patient.email || ''),
            source: 'client',
        });
    }
    const messageContactMap = new Map();
    for (const msg of messageRows) {
        const isCurrentSender = msg.sender_id === user.id;
        const partner = isCurrentSender ? asSingle(msg.recipient) : asSingle(msg.sender);
        if (!partner?.id)
            continue;
        if (String(partner.id) === user.id)
            continue;
        if (String(partner.role) !== 'seeker')
            continue;
        messageContactMap.set(String(partner.id), {
            id: String(partner.id),
            name: String(partner.name || 'Seeker'),
            email: String(partner.email || ''),
            source: 'message_contact',
        });
    }
    const clients = [
        ...Array.from(clientMap.values()).map((client) => ({ ...client, isClient: true })),
        ...Array.from(messageContactMap.values())
            .filter((contact) => !clientMap.has(contact.id))
            .map((contact) => ({ ...contact, isClient: false })),
    ].sort((a, b) => a.name.localeCompare(b.name));
    return (<TherapistSchedule sessions={sessionRows.map((s) => {
            const client = asSingle(s.client);
            return {
                id: String(s.id),
                scheduledAt: String(s.scheduled_at),
                durationMinutes: Number(s.duration_minutes || 50),
                status: String(s.status || 'scheduled'),
                sessionType: String(s.session_type || 'therapy'),
                locationType: String(s.location_type || 'telehealth'),
                locationLabel: s.location_label ? String(s.location_label) : null,
                telehealthUrl: s.telehealth_url ? String(s.telehealth_url) : null,
                client: client
                    ? {
                        id: String(client.id),
                        name: String(client.name || 'Client'),
                        email: String(client.email || ''),
                    }
                    : null,
            };
        })} blocks={blockRows.map((b) => ({
            id: String(b.id),
            startAt: String(b.start_at),
            endAt: String(b.end_at),
            kind: String(b.kind || 'unavailable'),
            title: b.title ? String(b.title) : null,
            notes: b.notes ? String(b.notes) : null,
        }))} clients={clients}/>);
}
