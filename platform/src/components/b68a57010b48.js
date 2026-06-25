import 'server-only';
import { createClient } from '@/components/9a6b39502e62';
import { getPostAuthRedirectPath } from '@/components/b85c08c50439';
import { ok } from '@/components/7ff049787825';
/**
 * Handle the email-verification / OAuth / magic-link callback. Verifies the
 * incoming OTP token or exchanges the code for a session (both mutate the
 * cookie-bound session via the request-scoped supabase client), then resolves
 * the absolute URL the handler should redirect to.
 *
 * Always returns a success result carrying `redirectUrl` — the various error
 * cases are themselves expressed as redirect URLs (matching the original
 * handler), not HTTP error responses.
 */
export async function handleAuthCallback(params) {
    const { baseUrl, code, token_hash, token, type, next } = params;
    const supabase = await createClient();
    // Handle PKCE flow (email verification uses token_hash or token)
    if ((token_hash || token) && type) {
        const { error } = await supabase.auth.verifyOtp({
            token_hash: token_hash || token,
            type: type,
        });
        if (error) {
            console.error('Token verification error:', error);
            return ok({
                redirectUrl: `${baseUrl}/login?error=verification_failed&message=${encodeURIComponent(error.message)}`,
            });
        }
    }
    // Handle OAuth/magic link flow (uses code)
    else if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
            console.error('Auth callback error:', error);
            return ok({ redirectUrl: `${baseUrl}/login?error=auth_failed` });
        }
    }
    else {
        return ok({ redirectUrl: `${baseUrl}/login?error=missing_params` });
    }
    const { data: { user }, } = await supabase.auth.getUser();
    if (!user) {
        return ok({ redirectUrl: `${baseUrl}${next}` });
    }
    // Recovery (fallback magic-link path — primary recovery uses OTP on /login).
    // The verifyOtp above already activated the recovery session; send the user
    // to /login where the shell will detect the session and show the reset form.
    if (type === 'recovery') {
        return ok({ redirectUrl: `${baseUrl}/login?mode=reset-verify` });
    }
    // Look up role + profile
    const { data: roleRow } = await supabase
        .from('user_roles')
        .select('role, status')
        .eq('id', user.id)
        .maybeSingle();
    if (!roleRow) {
        return ok({ redirectUrl: `${baseUrl}/login` });
    }
    const { data: profileRow } = await supabase
        .from('user_profiles')
        .select('full_name, profile_image_url, onboarding_completed, license_number, licensed_states, specialties, rate')
        .eq('user_id', user.id)
        .maybeSingle();
    // Sync OAuth avatar into user_profiles if missing/dicebear placeholder.
    const authMetadata = user.user_metadata;
    const authAvatar = authMetadata?.avatar_url ||
        authMetadata?.picture ||
        null;
    const existingAvatar = profileRow?.profile_image_url || '';
    const shouldSyncAvatar = authAvatar &&
        (!existingAvatar ||
            existingAvatar.includes('dicebear.com') ||
            existingAvatar.includes('api.dicebear.com'));
    if (shouldSyncAvatar && profileRow) {
        await supabase
            .from('user_profiles')
            .update({ profile_image_url: authAvatar })
            .eq('user_id', user.id);
    }
    const path = getPostAuthRedirectPath(roleRow, profileRow);
    return ok({ redirectUrl: `${baseUrl}${path}` });
}
