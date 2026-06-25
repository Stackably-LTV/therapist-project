/**
 * Audit Log Service
 *
 * Writes HIPAA-relevant audit logs for sensitive actions.
 * Uses service-role client to bypass RLS.
 * Failures are logged but not thrown — never fail user-facing actions
 * because of an audit log failure.
 */
import { createServiceRoleClient } from '@/components/9a6b39502e62';
export async function logAuditEvent(opts) {
    try {
        const supabase = createServiceRoleClient();
        await supabase.from('audit_logs').insert({
            user_id: opts.userId,
            action: opts.action,
            table_name: opts.tableName,
            record_id: opts.recordId,
            old_data: opts.oldData ?? null,
            new_data: opts.newData ?? null,
            ip_address: opts.ipAddress ?? null,
            user_agent: opts.userAgent ?? null,
            created_at: new Date().toISOString(),
        });
    }
    catch (err) {
        // Log the error but don't throw — audit failures must not break user-facing actions
        console.error('[audit-log.service] Failed to write audit log:', {
            action: opts.action,
            error: err instanceof Error ? err.message : String(err),
        });
    }
}
/**
 * Extract client IP from request.
 * Checks x-forwarded-for, x-real-ip, then cf-connecting-ip headers.
 */
export function getRequestIP(headers) {
    const forwarded = headers.get('x-forwarded-for')?.split(',')[0];
    if (forwarded?.trim())
        return forwarded.trim();
    const realIp = headers.get('x-real-ip');
    if (realIp?.trim())
        return realIp.trim();
    const cfConnecting = headers.get('cf-connecting-ip');
    if (cfConnecting?.trim())
        return cfConnecting.trim();
    return null;
}
/**
 * Extract user agent from request.
 */
export function getRequestUserAgent(headers) {
    const ua = headers.get('user-agent');
    return ua?.trim() ?? null;
}
