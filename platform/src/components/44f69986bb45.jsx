import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/components/9a6b39502e62';
import { TherapistNoteEditorClient } from '@/components/d4d313019a44';
export default async function TherapistNoteEditorPage({ params }) {
    const { noteId } = await params;
    const supabase = await createClient();
    const { data: { user }, } = await supabase.auth.getUser();
    if (!user)
        redirect('/login');
    const [{ data: roleRow }, { data: profileRow }] = await Promise.all([
        supabase.from('user_roles').select('role').eq('id', user.id).single(),
        supabase.from('user_profiles').select('full_name').eq('user_id', user.id).single(),
    ]);
    const userRow = roleRow ? { role: roleRow.role, name: profileRow?.full_name ?? '' } : null;
    if (!userRow || userRow.role !== 'therapist')
        notFound();
    const { data: rawNote, error } = await supabase
        .from('clinical_provider_notes')
        .select('*')
        .eq('id', noteId)
        .eq('therapist_id', user.id)
        .single();
    if (error || !rawNote)
        notFound();
    const patientId = rawNote?.seeker_id;
    let patientDob = null;
    let patientName = '';
    if (patientId) {
        const [{ data: patientRecord }, { data: patientProfile }] = await Promise.all([
            supabase.from('patient_records').select('dob').eq('seeker_id', patientId).maybeSingle(),
            supabase.from('user_profiles').select('full_name').eq('user_id', patientId).single(),
        ]);
        patientDob = patientRecord?.dob ? String(patientRecord.dob).slice(0, 10) : null;
        patientName = patientProfile?.full_name ?? '';
    }
    const note = { ...rawNote, patient: { id: patientId, name: patientName, email: '' } };
    return (<TherapistNoteEditorClient initialNote={note} currentTherapistName={userRow?.name || undefined} patientDob={patientDob}/>);
}
