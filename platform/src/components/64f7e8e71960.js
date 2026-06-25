import 'server-only';
import { createClient } from '@/components/9a6b39502e62';
import { logAuditEvent } from '@/components/0be57ea0c568';
import { ok, fail } from '@/components/7ff049787825';
/** Fetch the current progress note + all current notes for a session the therapist owns. */
export async function getSessionNotes(args) {
    const { therapistId, sessionId } = args;
    const supabase = await createClient();
    const { data: session } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', sessionId)
        .maybeSingle();
    if (!session)
        return fail(404, 'Session not found');
    if (session.therapist_id !== therapistId) {
        return fail(403, 'Forbidden');
    }
    const { data: note } = await supabase
        .from('clinical_session_notes')
        .select('*')
        .eq('session_id', sessionId)
        .eq('note_type', 'progress')
        .eq('is_current', true)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();
    const { data: notes } = await supabase
        .from('clinical_session_notes')
        .select('id, note_type, status, version, is_current, content_json, updated_at, signed_at, signature_method')
        .eq('session_id', sessionId)
        .eq('is_current', true)
        .order('updated_at', { ascending: false });
    const sessionData = session.session_data_json || {};
    const fallback = sessionData.notes || null;
    return ok({
        note: note?.content_json ?? fallback,
        notes: notes ?? [],
        status: note?.status ?? null,
    });
}
/**
 * Upsert a draft note for a session. Signed notes are immutable — mutating one
 * returns 409. Also mirrors the note into the appointment's session_data_json.
 */
export async function saveSessionNotes(args) {
    const { therapistId, sessionId } = args;
    const supabase = await createClient();
    const { data: session } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', sessionId)
        .maybeSingle();
    if (!session)
        return fail(404, 'Session not found');
    if (session.therapist_id !== therapistId) {
        return fail(403, 'Forbidden');
    }
    const incomingNotes = args.notes;
    if (!incomingNotes || typeof incomingNotes !== 'object') {
        return fail(400, 'notes payload is required');
    }
    const noteType = args.noteType === 'intake' || args.noteType === 'termination' ? args.noteType : 'progress';
    // Upsert draft note. If the current note is signed, refuse to mutate — clinical
    // record integrity requires signed notes to be immutable. Therapist must create a
    // new version (handled by a separate amend flow).
    const { data: existing } = await supabase
        .from('clinical_session_notes')
        .select('id, version, status')
        .eq('session_id', sessionId)
        .eq('note_type', noteType)
        .eq('is_current', true)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();
    if (existing?.status === 'signed') {
        return fail(409, 'This note has been signed and is locked. Create a new version to amend.');
    }
    if (existing) {
        await supabase
            .from('clinical_session_notes')
            .update({
            content_json: incomingNotes,
            status: 'draft',
            updated_at: new Date().toISOString(),
        })
            .eq('id', existing.id);
    }
    else {
        await supabase.from('clinical_session_notes').insert({
            session_id: sessionId,
            therapist_id: therapistId,
            seeker_id: session.seeker_id,
            note_type: noteType,
            content_json: incomingNotes,
            status: 'draft',
            is_current: true,
            version: 1,
        });
    }
    const existingSessionData = session.session_data_json || {};
    const updatedSessionData = {
        ...existingSessionData,
        notes: {
            ...incomingNotes,
            isAiGenerated: Boolean(incomingNotes.isAiGenerated),
            createdAt: incomingNotes.createdAt || new Date().toISOString(),
            createdBy: incomingNotes.createdBy || therapistId,
            updatedAt: new Date().toISOString(),
            updatedBy: therapistId,
        },
    };
    const { error: updateError } = await supabase
        .from('appointments')
        .update({ session_data_json: updatedSessionData })
        .eq('id', sessionId);
    if (updateError) {
        return fail(500, 'Failed to update notes');
    }
    return ok({ success: true });
}
/** Sign the current draft note for a session and write an audit-log entry. */
export async function signSessionNote(args) {
    const { therapistId, sessionId, signatureMethod, signatureDataUrl, ipAddress, userAgent } = args;
    const supabase = await createClient();
    const { data: session } = await supabase
        .from('appointments')
        .select('id, therapist_id')
        .eq('id', sessionId)
        .maybeSingle();
    if (!session)
        return fail(404, 'Session not found');
    if (session.therapist_id !== therapistId)
        return fail(403, 'Forbidden');
    const noteType = args.noteType === 'intake' || args.noteType === 'termination' ? args.noteType : 'progress';
    if (signatureMethod !== 'typed' && signatureMethod !== 'drawn') {
        return fail(400, 'signatureMethod must be typed or drawn');
    }
    const validSignatureDataUrl = typeof signatureDataUrl === 'string' && signatureDataUrl.startsWith('data:image/')
        ? signatureDataUrl
        : null;
    if (signatureMethod === 'drawn' && !validSignatureDataUrl) {
        return fail(400, 'signatureDataUrl is required for drawn signatures');
    }
    const { data: current } = await supabase
        .from('clinical_session_notes')
        .select('*')
        .eq('session_id', sessionId)
        .eq('note_type', noteType)
        .eq('is_current', true)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();
    if (!current)
        return fail(404, 'No draft note found');
    const { data: signed, error } = await supabase
        .from('clinical_session_notes')
        .update({
        status: 'signed',
        signed_at: new Date().toISOString(),
        signed_by: therapistId,
        signature_method: signatureMethod,
        signature_data_url: validSignatureDataUrl,
        updated_at: new Date().toISOString(),
    })
        .eq('id', current.id)
        .select('*')
        .maybeSingle();
    if (error || !signed)
        return fail(500, error?.message || 'Failed to sign note');
    // Log audit event
    await logAuditEvent({
        userId: therapistId,
        action: 'session_note.sign',
        tableName: 'clinical_session_notes',
        recordId: current.id,
        newData: { status: 'signed', signed_at: signed.signed_at, note_type: signed.note_type },
        ipAddress,
        userAgent,
    });
    return ok({ note: signed });
}
