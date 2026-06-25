'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient, getUser } from '@/components/9a6b39502e62';
export async function completeTherapistOnboarding(formData) {
    const user = await getUser();
    if (!user) {
        redirect('/login');
    }
    const supabase = await createClient();
    // Verify user has therapist role
    const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
    if (!userRole || userRole.role !== 'therapist') {
        redirect('/login');
    }
    const specialties = formData.getAll('specialties').map((value) => String(value));
    const licensedStates = formData
        .getAll('licensedStates')
        .map((value) => String(value))
        .filter((v) => v.trim().length > 0);
    const profileImageUrl = String(formData.get('profileImageUrl') || '') || null;
    const normalizedRate = Math.round(Number(formData.get('rate') || 0) * 100) / 100;
    const phoneE164 = String(formData.get('phone') || '') || null;
    const bio = String(formData.get('bio') || '') || null;
    const licenseNumber = String(formData.get('licenseNumber') || '') || null;
    const displayName = String(formData.get('displayName') || '') ||
        user.user_metadata?.name ||
        user.email ||
        'Therapist';
    const allowSelfBooking = String(formData.get('allowSelfBooking') || 'true') !== 'false';
    const calendarVisible = String(formData.get('calendarVisible') || 'true') !== 'false';
    const allowedDurations = [30, 45, 50, 60, 90];
    const rawDuration = parseInt(String(formData.get('sessionDuration') || '60'), 10);
    const sessionDuration = allowedDurations.includes(rawDuration) ? rawDuration : 60;
    const yearsExperienceRaw = parseInt(String(formData.get('yearsExperience') || ''), 10);
    const yearsExperience = Number.isFinite(yearsExperienceRaw) && yearsExperienceRaw >= 0 && yearsExperienceRaw <= 80 ? yearsExperienceRaw : null;
    const approach = String(formData.get('approach') || '').trim() || null;
    const education = String(formData.get('education') || '').trim() || null;
    const availabilityRaw = formData.get('availability');
    let availability = [];
    if (typeof availabilityRaw === 'string' && availabilityRaw.trim().length > 0) {
        try {
            const parsed = JSON.parse(availabilityRaw);
            if (Array.isArray(parsed)) {
                availability = parsed
                    .map((s) => {
                    const r = (s ?? {});
                    return {
                        dayOfWeek: Number(r.dayOfWeek),
                        startTime: String(r.startTime || ''),
                        endTime: String(r.endTime || ''),
                    };
                })
                    .filter((s) => Number.isInteger(s.dayOfWeek) &&
                    s.dayOfWeek >= 0 &&
                    s.dayOfWeek <= 6 &&
                    /^\d{2}:\d{2}$/.test(s.startTime) &&
                    /^\d{2}:\d{2}$/.test(s.endTime));
            }
        }
        catch {
            availability = [];
        }
    }
    const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
        full_name: displayName,
        bio,
        phone_e164: phoneE164,
        profile_image_url: profileImageUrl,
        license_number: licenseNumber,
        licensed_states: licensedStates,
        specialties,
        rate: Number.isFinite(normalizedRate) && normalizedRate > 0 ? normalizedRate : null,
        allow_self_booking: allowSelfBooking,
        calendar_visible: calendarVisible,
        session_duration: sessionDuration,
        availability,
        years_experience: yearsExperience,
        approach,
        education,
        onboarding_completed: true,
    })
        .eq('user_id', user.id);
    if (profileError) {
        console.error('[completeTherapistOnboarding] Failed to update user_profiles', profileError);
        throw new Error('Unable to save your onboarding details. Please try again.');
    }
    // Status stays 'pending' — admin must approve before therapist gets dashboard access.
    revalidatePath('/therapist');
    revalidatePath('/therapist/profile');
    revalidatePath('/login');
    redirect('/status');
}
