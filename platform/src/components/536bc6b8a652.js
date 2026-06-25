import 'server-only';
import { createClient } from '@/components/9a6b39502e62';
import { ok, fail } from '@/components/7ff049787825';
/**
 * Send a password-reset (recovery) email. Recovery uses OTP only (a 6-digit
 * code in the email); the Supabase email template must include `{{ .Token }}`.
 * No magic-link redirect is needed — users finish the flow on /login.
 *
 * Surfaces Supabase rate-limiting: a 429 is preserved as 429, any other
 * provider error becomes a 500.
 */
export async function sendPasswordResetEmail(email) {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (error) {
        const status = typeof error?.status === 'number' ? error.status : 500;
        console.error('[api/auth/reset-password] resetPasswordForEmail error', {
            message: error.message,
            status,
        });
        return fail(status === 429 ? 429 : 500, error.message || 'Failed to send reset email');
    }
    return ok({ success: true, message: 'Password reset email sent' });
}
