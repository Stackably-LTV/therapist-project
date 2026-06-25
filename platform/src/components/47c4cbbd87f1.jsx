import { createClient } from '@/components/9a6b39502e62';
import { redirect } from 'next/navigation';
export default async function TherapistNotesPage({ searchParams, }) {
    const { patient: preselectedPatientId } = await searchParams;
    const supabase = await createClient();
    const { data: { user }, } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }
    if (preselectedPatientId) {
        redirect(`/therapist/clients/${encodeURIComponent(preselectedPatientId)}?tab=notes`);
    }
    redirect('/therapist/records?tab=patients');
}
