import { redirect } from 'next/navigation';
import { createClient } from '@/components/9a6b39502e62';
export default async function CoursesPage() {
    const supabase = await createClient();
    const { data: { user }, } = await supabase.auth.getUser();
    if (!user)
        redirect('/login?redirect=/courses');
    const { data: profile } = await supabase.from('user_roles').select('role').eq('id', user.id).single();
    if (!profile)
        redirect('/login');
    if (profile.role === 'seeker')
        redirect('/seeker/courses');
    if (profile.role === 'therapist')
        redirect('/therapist/courses');
    redirect('/login');
}
