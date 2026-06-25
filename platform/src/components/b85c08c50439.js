/**
 * Decide where to send a freshly-authenticated user based on their
 * `user_roles` row + their `user_profiles` row.
 *
 * /login is the unified auth + onboarding entry. Users without a role
 * row, mid-onboarding therapists, and mid-onboarding seekers all go
 * back to /login — the page itself renders the right next step.
 *
 * - No role row → /login (role picker)
 * - Therapist incomplete → /login (therapist onboarding form)
 * - Therapist not active → /status
 * - Therapist active → /therapist
 * - Seeker not onboarded → /login (seeker onboarding form)
 * - Seeker → /seeker
 * - Admin → /admin
 */
export function getPostAuthRedirectPath(role, profile) {
    if (!role)
        return '/login';
    if (role.role === 'therapist') {
        const onboardingCompleted = Boolean(profile?.onboarding_completed);
        const licensedStates = Array.isArray(profile?.licensed_states) ? profile.licensed_states : [];
        const hasLicense = Boolean(profile?.license_number);
        const hasState = licensedStates.length > 0;
        const hasSpecialties = Array.isArray(profile?.specialties) && profile.specialties.length > 0;
        const hasRate = profile?.rate !== null && profile?.rate !== undefined;
        const isProfileComplete = hasLicense && hasState && hasSpecialties && hasRate;
        if (!onboardingCompleted || !isProfileComplete)
            return '/login';
        if (role.status !== 'active')
            return '/status';
        return '/therapist';
    }
    if (role.role === 'seeker') {
        if (!profile?.onboarding_completed)
            return '/login';
        return '/seeker';
    }
    if (role.role === 'admin') {
        return '/admin';
    }
    return '/login';
}
