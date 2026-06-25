import { createClient } from '@/components/9a6b39502e62';
import { redirect } from 'next/navigation';
export default async function TherapistClientsPage() {
    const supabase = await createClient();
    const { data: { user }, } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }
    redirect('/therapist/records?tab=patients');
}
