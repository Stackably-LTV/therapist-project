import { createClient } from '@/components/9a6b39502e62';
import { redirect } from 'next/navigation';
import { hasTherapistFeature } from '@/components/18f37321d6fb';
import { getTherapistFeatures } from '@/components/c5276438fd9f';
export default async function TherapistAddPatientPage() {
    const supabase = await createClient();
    const { data: { user }, } = await supabase.auth.getUser();
    if (!user)
        redirect('/login');
    const features = await getTherapistFeatures(user.id);
    if (!hasTherapistFeature(features, 'charts')) {
        redirect('/therapist');
    }
    redirect('/therapist/records?tab=patients&action=add');
}
