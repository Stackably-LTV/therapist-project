import 'server-only';
import { createClient } from '@/components/9a6b39502e62';
import { ok, fail } from '@/components/7ff049787825';
/** Confirm the therapist owns the session; returns a scoped supabase client on success. */
async function ensureOwner(sessionId, therapistId) {
    const supabase = await createClient();
    const { data } = await supabase
        .from('appointments')
        .select('id, therapist_id')
        .eq('id', sessionId)
        .maybeSingle();
    if (!data)
        return { ok: false, status: 404, error: 'Not found' };
    if (data.therapist_id !== therapistId)
        return { ok: false, status: 403, error: 'Forbidden' };
    return { ok: true, supabase };
}
/** List billing/service codes attached to a session plus the active code catalog. */
export async function listSessionServiceCodes(args) {
    const { therapistId, sessionId } = args;
    const owner = await ensureOwner(sessionId, therapistId);
    if (!owner.ok)
        return fail(owner.status, owner.error);
    const [attached, catalog] = await Promise.all([
        owner.supabase.from('appointment_billing_codes').select('*').eq('session_id', sessionId),
        owner.supabase.from('billing_service_codes').select('*').eq('is_active', true).order('code'),
    ]);
    return ok({ attached: attached.data ?? [], catalog: catalog.data ?? [] });
}
/** Attach (upsert) a billing/service code to a session. */
export async function attachSessionServiceCode(args) {
    const { therapistId, sessionId, codeId } = args;
    const owner = await ensureOwner(sessionId, therapistId);
    if (!owner.ok)
        return fail(owner.status, owner.error);
    if (!codeId)
        return fail(400, 'codeId is required');
    const units = args.units;
    if (units != null && (!Number.isFinite(units) || units <= 0)) {
        return fail(400, 'units must be a positive number');
    }
    const payload = {
        session_id: sessionId,
        code_id: codeId,
    };
    if (units != null)
        payload.units = Math.round(units);
    if (Array.isArray(args.modifiers))
        payload.modifiers = args.modifiers;
    const dxPointer = args.diagnosisPointer;
    if (dxPointer)
        payload.diagnosis_pointer = dxPointer;
    if (args.feeOverride != null)
        payload.fee_override = String(args.feeOverride);
    const { data: link, error } = await owner.supabase
        .from('appointment_billing_codes')
        .upsert(payload, { onConflict: 'session_id,code_id' })
        .select('*')
        .single();
    if (error)
        return fail(500, error.message);
    return ok({ link });
}
/** Detach a billing/service code from a session by code id. */
export async function detachSessionServiceCode(args) {
    const { therapistId, sessionId, codeId } = args;
    const owner = await ensureOwner(sessionId, therapistId);
    if (!owner.ok)
        return fail(owner.status, owner.error);
    if (!codeId)
        return fail(400, 'codeId query param is required');
    const { error, count } = await owner.supabase
        .from('appointment_billing_codes')
        .delete({ count: 'exact' })
        .eq('session_id', sessionId)
        .eq('code_id', codeId);
    if (error)
        return fail(500, error.message);
    if (!count)
        return fail(404, 'Not found');
    return ok({ success: true });
}
