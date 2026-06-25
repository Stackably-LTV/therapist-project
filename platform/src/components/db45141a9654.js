import 'server-only';
import { createClient } from '@/components/9a6b39502e62';
import { ok } from '@/components/7ff049787825';
/**
 * Sign the current user out, clearing their session cookies via the
 * request-scoped supabase client. Errors are swallowed (logged) — the handler
 * redirects home regardless, matching the original behaviour.
 */
export async function signOutUser() {
    try {
        const supabase = await createClient();
        await supabase.auth.signOut();
    }
    catch (error) {
        console.error('Sign out error:', error);
    }
    return ok(null);
}
