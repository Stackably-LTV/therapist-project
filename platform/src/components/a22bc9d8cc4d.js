import 'server-only';
import { sendDueReminders } from '@/components/550c807f9a98';
/**
 * Authorize a cron invocation via the shared CRON_SECRET bearer token. Returns
 * false when the secret is unset or the Authorization header does not match.
 */
export function isCronAuthorized(headers) {
    const secret = process.env.CRON_SECRET;
    if (!secret)
        return false;
    const header = headers.get('authorization') || '';
    if (header === `Bearer ${secret}`)
        return true;
    // Vercel cron also supports the x-vercel-cron-signature header in newer versions,
    // but the standard pattern is the Authorization: Bearer CRON_SECRET header.
    return false;
}
/** Run the due-appointment reminder job. Delegates to the booking reminder service. */
export async function runDueReminders() {
    return sendDueReminders();
}
