import 'server-only';
import { createClient } from '@/components/9a6b39502e62';
import { ok } from '@/components/7ff049787825';
async function canAccessSeeker(therapistId, seekerId, supabase) {
    const { data: record } = await supabase
        .from('patient_records')
        .select('primary_therapist_id')
        .eq('seeker_id', seekerId)
        .maybeSingle();
    if (record?.primary_therapist_id === therapistId)
        return true;
    const { data: appt } = await supabase
        .from('appointments')
        .select('id')
        .eq('therapist_id', therapistId)
        .eq('seeker_id', seekerId)
        .limit(1)
        .maybeSingle();
    return !!appt;
}
/**
 * Build the therapist's "shareable in chat" snapshot for a given seeker:
 * owned documents, progress/provider notes, and current treatment plans.
 * Returns an empty payload (with relationshipEstablished:false) if no
 * formal relationship exists yet.
 */
export async function getShareables(therapistId, recipientId) {
    const supabase = await createClient();
    // No formal relationship yet (no accepted invite / patient record / appointment) →
    // there's nothing meaningful to share, so return an empty list rather than 403.
    // The therapist's Quick Actions panel surfaces nothing until the seeker accepts.
    const allowed = await canAccessSeeker(therapistId, recipientId, supabase);
    if (!allowed) {
        return ok({
            documents: [],
            progressNotes: [],
            treatmentPlans: [],
            relationshipEstablished: false,
        });
    }
    const [{ data: docRows }, { data: progressRows }, { data: planRows }, { data: providerNoteRows },] = await Promise.all([
        supabase
            .from('file_uploads')
            .select('id, file_name, mime_type, file_size_bytes, shared_with, created_at')
            .eq('owner_id', therapistId)
            .order('created_at', { ascending: false })
            .limit(50),
        supabase
            .from('clinical_session_notes')
            .select('id, content_json, created_at, appointment:appointments!inner(scheduled_at)')
            .eq('therapist_id', therapistId)
            .eq('seeker_id', recipientId)
            .eq('note_type', 'progress')
            .eq('is_current', true)
            .order('created_at', { ascending: false })
            .limit(20),
        supabase
            .from('treatment_plans')
            .select('id, diagnosis_name, frequency, timeline, goals_json, interventions_json, version, updated_at, is_current')
            .eq('therapist_id', therapistId)
            .eq('seeker_id', recipientId)
            .eq('is_current', true)
            .order('updated_at', { ascending: false })
            .limit(10),
        supabase
            .from('clinical_provider_notes')
            .select('id, title, content, note_type, created_at')
            .eq('therapist_id', therapistId)
            .eq('seeker_id', recipientId)
            .eq('is_private', false)
            .order('created_at', { ascending: false })
            .limit(20),
    ]);
    const progressNotes = [
        ...(progressRows || []).map((row) => {
            const scheduled = row.appointment?.scheduled_at;
            return {
                id: row.id,
                title: scheduled ? `Session note ${new Date(scheduled).toLocaleDateString()}` : 'Session note',
                preview: typeof row.content_json === 'object' && row.content_json
                    ? String(row.content_json.summary || '')
                    : '',
                source: 'session_note',
            };
        }),
        ...(providerNoteRows || []).map((row) => ({
            id: row.id,
            title: row.title || `Note ${new Date(row.created_at).toLocaleDateString()}`,
            preview: row.content ? String(row.content).slice(0, 120) : '',
            source: 'patient_chart',
        })),
    ];
    function formatPreview(plan) {
        const lines = [];
        if (plan.diagnosis_name?.trim())
            lines.push(`Diagnosis: ${plan.diagnosis_name.trim()}`);
        if (plan.frequency?.trim())
            lines.push(`Frequency: ${plan.frequency.trim()}`);
        if (plan.timeline?.trim())
            lines.push(`Timeline: ${plan.timeline.trim()}`);
        const goals = Array.isArray(plan.goals_json) ? plan.goals_json : [];
        const interventions = Array.isArray(plan.interventions_json) ? plan.interventions_json : [];
        const goalTitles = goals
            .map((g) => String(g?.title || '').trim())
            .filter(Boolean)
            .slice(0, 3);
        lines.push(goalTitles.length > 0
            ? `Goals (${goals.length}): ${goalTitles.join(' | ')}`
            : `Goals: ${goals.length}`);
        const actionSteps = interventions
            .map((i) => String(i?.description || '').trim())
            .filter(Boolean)
            .slice(0, 2);
        lines.push(actionSteps.length > 0
            ? `Action steps (${interventions.length}): ${actionSteps.join(' | ')}`
            : `Action steps: ${interventions.length}`);
        return lines.join('\n');
    }
    const treatmentPlanSnapshots = (planRows || []).map((row) => ({
        id: row.id,
        title: row.diagnosis_name?.trim() || `Treatment plan v${row.version || 1}`,
        preview: formatPreview(row),
    }));
    return ok({
        documents: (docRows || []).map((d) => ({
            id: d.id,
            fileName: d.file_name,
            mimeType: d.mime_type,
            fileSizeBytes: d.file_size_bytes,
            sharedWith: d.shared_with,
            createdAt: d.created_at,
        })),
        progressNotes,
        treatmentPlans: treatmentPlanSnapshots,
    });
}
