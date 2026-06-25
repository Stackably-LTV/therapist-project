import { createClient } from '@/components/9a6b39502e62';
import AuthShell from '@/components/f482d1dd606c';
import AuthLayout from '@/components/df16290c7838';
import SignupRoleSelection from '@/components/9d71a505a631';
import SeekerOnboardingForm from '@/components/20844f4866e5';
import TherapistSignupForm from '@/components/0af9dfdeb10a';
import { listActiveTiers } from '@/components/9c79cbbfa8a8';
const ERROR_MESSAGES = {
    role_update_failed: "We couldn't save your role selection. Please try again — if this keeps happening, contact support.",
    role_mismatch: "That onboarding path doesn't match your account role. Pick the right option below.",
    session_expired: 'Your session expired. Please sign in again.',
};
export default async function LoginPage({ searchParams, }) {
    const params = await searchParams;
    const supabase = await createClient();
    const { data: { user }, } = await supabase.auth.getUser();
    if (!user) {
        const requestedMode = typeof params.mode === 'string' ? params.mode : '';
        const initialMode = requestedMode === 'signup'
            ? 'signup'
            : requestedMode === 'reset'
                ? 'reset-request'
                : 'login';
        return (<AuthLayout>
        <AuthShell initialMode={initialMode}/>
      </AuthLayout>);
    }
    const { data: roleRow } = await supabase
        .from('user_roles')
        .select('role, status')
        .eq('id', user.id)
        .maybeSingle();
    const errorKey = typeof params.error === 'string' ? params.error : '';
    const errorMessage = errorKey && ERROR_MESSAGES[errorKey] ? ERROR_MESSAGES[errorKey] : '';
    if (!roleRow) {
        return (<AuthLayout wide>
        {errorMessage && (<div role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 max-w-3xl mx-auto">
            {errorMessage}
          </div>)}
        <SignupRoleSelection />
      </AuthLayout>);
    }
    const redirectToRaw = params.redirect || '';
    const redirectTo = redirectToRaw.startsWith('/') && !redirectToRaw.startsWith('//') ? redirectToRaw : '';
    if (roleRow.role === 'seeker') {
        const { data: profileRow } = await supabase
            .from('user_profiles')
            .select('full_name, preferred_name, pronouns, onboarding_completed')
            .eq('user_id', user.id)
            .maybeSingle();
        if (profileRow?.onboarding_completed) {
            return (<AuthLayout>
          <AuthShell initialMode="login"/>
        </AuthLayout>);
        }
        const authMetadata = user.user_metadata;
        return (<AuthLayout>
        <SeekerOnboardingForm defaultValues={{
                displayName: profileRow?.preferred_name ||
                    profileRow?.full_name ||
                    authMetadata?.name ||
                    user.email?.split('@')[0] ||
                    '',
                pronouns: profileRow?.pronouns || '',
                goals: '',
                preferences: '',
            }} redirectTo={redirectTo}/>
      </AuthLayout>);
    }
    if (roleRow.role === 'therapist') {
        const [{ data: profileRow }, { data: subRow }, tiers] = await Promise.all([
            supabase
                .from('user_profiles')
                .select('full_name, onboarding_completed, phone_e164, profile_image_url, bio, license_number, licensed_states, specialties, years_experience, rate, allow_self_booking, calendar_visible, availability')
                .eq('user_id', user.id)
                .maybeSingle(),
            supabase
                .from('billing_subscriptions')
                .select('status')
                .eq('therapist_id', user.id)
                .maybeSingle(),
            listActiveTiers(),
        ]);
        if (profileRow?.onboarding_completed) {
            return (<AuthLayout>
          <AuthShell initialMode="login"/>
        </AuthLayout>);
        }
        const authMetadata = user.user_metadata;
        // A row exists in any post-checkout state. `paid` means Stripe has actually
        // confirmed the subscription (trial counts because the card was captured).
        const subStatus = subRow?.status ?? null;
        const hasSubscription = Boolean(subStatus);
        const PAID_STATUSES = new Set(['trialing', 'active', 'past_due']);
        const isPaymentVerified = subStatus !== null && PAID_STATUSES.has(subStatus);
        const availability = Array.isArray(profileRow?.availability)
            ? profileRow.availability
            : null;
        const initialProfile = {
            fullName: profileRow?.full_name ?? null,
            phoneE164: profileRow?.phone_e164 ?? null,
            profileImageUrl: profileRow?.profile_image_url ?? null,
            bio: profileRow?.bio ?? null,
            licenseNumber: profileRow?.license_number ?? null,
            licensedStates: profileRow?.licensed_states ?? null,
            specialties: profileRow?.specialties ?? null,
            yearsExperience: profileRow?.years_experience ?? null,
            rate: profileRow?.rate ?? null,
            allowSelfBooking: profileRow?.allow_self_booking ?? null,
            calendarVisible: profileRow?.calendar_visible ?? null,
            availability,
        };
        return (<div className="min-h-screen bg-gray-50/80 py-12 sm:py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Therapist Onboarding</h1>
            <p className="text-muted-foreground">
              Complete your profile to start accepting clients.
            </p>
          </div>
          <TherapistSignupForm userEmail={user.email || ''} userName={profileRow?.full_name || authMetadata?.name || ''} tiers={tiers} hasSubscription={hasSubscription} isPaymentVerified={isPaymentVerified} initialProfile={initialProfile}/>
        </div>
      </div>);
    }
    return (<AuthLayout>
      <AuthShell initialMode="login"/>
    </AuthLayout>);
}
