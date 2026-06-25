import { createClient } from '@/components/9a6b39502e62';
import { redirect, notFound } from 'next/navigation';
import { therapistHasFeature } from '@/components/c5276438fd9f';
export default async function TherapistSessionNotesPage({ params, }) {
    const supabase = await createClient();
    const { sessionId } = await params;
    const { data: { user }, } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }
    const canUseNotes = await therapistHasFeature(user.id, 'session_notes');
    if (!canUseNotes) {
        redirect('/therapist/subscription');
    }
    const { data: session, error } = await supabase
        .from('appointments')
        .select(`
      id,
      therapist_id,
      seeker_id,
      scheduled_at,
      duration_minutes,
      status,
      session_type,
      location_type,
      location_label,
      telehealth_url,
      session_data_json
    `)
        .eq('id', sessionId)
        .single();
    if (error || !session) {
        notFound();
    }
    if (session.therapist_id !== user.id) {
        redirect('/therapist/schedule');
    }
    redirect(`/therapist/clients/${session.seeker_id}?tab=notes&session=${sessionId}`);
}
