import 'server-only';
import { createClient } from '@/components/9a6b39502e62';
import { logAuditEvent } from '@/components/0be57ea0c568';
import { serializeRichMessage } from '@/components/a6e7ef5e01c9';
import { buildTreatmentPlanBundle } from '@/components/0ba2eca00279';
import { asOptionalString } from '@/components/58193d01af01';
import { ok, fail } from '@/components/7ff049787825';
const ALLOWED_TRANSITIONS = {
    sent: ['draft'],
    active: ['completed', 'on_hold', 'terminated'],
    on_hold: ['active'],
};
/** Fetch a plan and return its normalized bundle. Owner-scoped. */
export async function getTreatmentPlanBundle(therapistId, planId) {
    const supabase = await createClient();
    const { data: plan } = await supabase
        .from('treatment_plans')
        .select('*')
        .eq('id', planId)
        .maybeSingle();
    if (!plan)
        return fail(404, 'Not found');
    if (plan.therapist_id !== therapistId)
        return fail(403, 'Forbidden');
    return ok({ bundle: buildTreatmentPlanBundle(plan) });
}
/** Patch top-level plan fields. Blocks edits to sent/archived plans. */
export async function updateTreatmentPlan(therapistId, planId, body) {
    const supabase = await createClient();
    const { data: existing } = await supabase
        .from('treatment_plans')
        .select('id, therapist_id, status')
        .eq('id', planId)
        .maybeSingle();
    if (!existing)
        return fail(404, 'Not found');
    if (existing.therapist_id !== therapistId)
        return fail(403, 'Forbidden');
    if (existing.status === 'sent') {
        return fail(409, 'Cannot edit a sent plan. Retract it to draft first.');
    }
    if (existing.status === 'archived') {
        return fail(409, 'Cannot edit an archived plan.');
    }
    const update = {};
    const setIf = (key, val) => {
        if (val !== undefined)
            update[key] = val;
    };
    setIf('module_name', asOptionalString(body?.moduleName) ?? undefined);
    setIf('frequency', asOptionalString(body?.frequency) ?? undefined);
    setIf('timeline', asOptionalString(body?.timeline) ?? undefined);
    setIf('discharge_plan', asOptionalString(body?.dischargePlan) ?? undefined);
    setIf('additional_info', asOptionalString(body?.additionalInfo) ?? undefined);
    setIf('homework', asOptionalString(body?.homework) ?? undefined);
    setIf('diagnosis_code_id', asOptionalString(body?.diagnosisCodeId) ?? undefined);
    setIf('diagnosis_name', asOptionalString(body?.diagnosisName) ?? undefined);
    if (body?.medicalNecessityAcknowledged != null) {
        update.medical_necessity_acknowledged = Boolean(body.medicalNecessityAcknowledged);
    }
    setIf('medical_necessity_statement', asOptionalString(body?.medicalNecessityStatement) ?? undefined);
    update.updated_at = new Date().toISOString();
    const { data: updated, error } = await supabase
        .from('treatment_plans')
        .update(update)
        .eq('id', planId)
        .select('*')
        .maybeSingle();
    if (error)
        return fail(500, error.message);
    if (!updated)
        return fail(500, 'Failed to update');
    return ok({ plan: updated });
}
/** Transition a plan's lifecycle status under the allowed-transitions matrix. */
export async function updateTreatmentPlanStatus(therapistId, planId, body) {
    const supabase = await createClient();
    const { data: existing } = await supabase
        .from('treatment_plans')
        .select('id, therapist_id, status')
        .eq('id', planId)
        .maybeSingle();
    if (!existing)
        return fail(404, 'Not found');
    if (existing.therapist_id !== therapistId)
        return fail(403, 'Forbidden');
    const newStatus = body?.status;
    if (!newStatus)
        return fail(400, 'status is required');
    const allowed = ALLOWED_TRANSITIONS[existing.status];
    if (!allowed || !allowed.includes(newStatus)) {
        return fail(409, `Cannot transition from '${existing.status}' to '${newStatus}'.`);
    }
    const { data: updated, error } = await supabase
        .from('treatment_plans')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', planId)
        .select('*')
        .maybeSingle();
    if (error || !updated)
        return fail(500, error?.message || 'Failed to update status');
    return ok({ plan: updated });
}
/** Clone an active plan into a new draft version within the same plan family. */
export async function createTreatmentPlanVersion(therapistId, planId) {
    const supabase = await createClient();
    const { data: existing } = await supabase
        .from('treatment_plans')
        .select('*')
        .eq('id', planId)
        .maybeSingle();
    if (!existing)
        return fail(404, 'Not found');
    if (existing.therapist_id !== therapistId)
        return fail(403, 'Forbidden');
    if (existing.status !== 'active') {
        return fail(409, 'Only active plans can be versioned.');
    }
    // Mark prior version not current.
    await supabase
        .from('treatment_plans')
        .update({ is_current: false, updated_at: new Date().toISOString() })
        .eq('plan_family_id', existing.plan_family_id)
        .eq('is_current', true);
    const { id: _id, created_at: _ca, updated_at: _ua, ...copy } = existing;
    const newVersion = {
        ...copy,
        version: (existing.version || 1) + 1,
        status: 'draft',
        is_current: true,
        parent_plan_id: existing.id,
        plan_family_id: existing.plan_family_id,
        sent_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
    const { data: created, error } = await supabase
        .from('treatment_plans')
        .insert(newVersion)
        .select('*')
        .single();
    if (error || !created)
        return fail(500, error?.message || 'Failed to create new version');
    return ok({
        bundle: { plan: created, goals: created.goals_json ?? [], interventions: created.interventions_json ?? [] },
    });
}
/** List all versions in a plan's family, newest first. Owner-scoped. */
export async function listTreatmentPlanVersions(therapistId, planId) {
    const supabase = await createClient();
    const { data: plan } = await supabase
        .from('treatment_plans')
        .select('id, therapist_id, plan_family_id')
        .eq('id', planId)
        .maybeSingle();
    if (!plan)
        return fail(404, 'Not found');
    if (plan.therapist_id !== therapistId)
        return fail(403, 'Forbidden');
    const { data: versions } = await supabase
        .from('treatment_plans')
        .select('*')
        .eq('plan_family_id', plan.plan_family_id)
        .order('version', { ascending: false });
    return ok({ versions: versions ?? [] });
}
/** Mark a plan sent, audit-log it, and push a chart snapshot message to the seeker. */
export async function sendTreatmentPlan(therapistId, planId, audit) {
    const supabase = await createClient();
    const { data: existing } = await supabase
        .from('treatment_plans')
        .select('id, therapist_id, seeker_id, diagnosis_name, module_name, status')
        .eq('id', planId)
        .maybeSingle();
    if (!existing)
        return fail(404, 'Not found');
    if (existing.therapist_id !== therapistId)
        return fail(403, 'Forbidden');
    const { data: plan, error } = await supabase
        .from('treatment_plans')
        .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    })
        .eq('id', planId)
        .select('*')
        .maybeSingle();
    if (error || !plan)
        return fail(500, error?.message || 'Failed to send plan');
    // Log audit event
    await logAuditEvent({
        userId: therapistId,
        action: 'treatment_plan.send',
        tableName: 'treatment_plans',
        recordId: planId,
        newData: { status: 'sent', sent_at: plan.sent_at },
        ipAddress: audit.ipAddress,
        userAgent: audit.userAgent,
    });
    const title = plan.module_name || plan.diagnosis_name || 'Treatment plan';
    const payload = serializeRichMessage({
        type: 'chart_snapshot',
        version: 1,
        chartKind: 'treatment_plan',
        chartId: plan.id,
        title,
        preview: 'Please review and acknowledge your treatment plan.',
    });
    await supabase.from('messages').insert({
        sender_id: therapistId,
        recipient_id: plan.seeker_id,
        content: payload,
        read_at: null,
    });
    return ok({ plan });
}
/** Record the therapist's signature on a plan and audit-log it. */
export async function signTreatmentPlan(therapistId, planId, body, audit) {
    const supabase = await createClient();
    const { data: existing } = await supabase
        .from('treatment_plans')
        .select('id, therapist_id, signed_at')
        .eq('id', planId)
        .maybeSingle();
    if (!existing)
        return fail(404, 'Not found');
    if (existing.therapist_id !== therapistId) {
        return fail(403, 'Forbidden');
    }
    const signatureMethod = asOptionalString(body?.signatureMethod);
    if (signatureMethod !== 'typed' && signatureMethod !== 'drawn') {
        return fail(400, 'signatureMethod must be typed or drawn');
    }
    const signatureDataUrl = typeof body?.signatureDataUrl === 'string' && body.signatureDataUrl.startsWith('data:image/')
        ? body.signatureDataUrl
        : null;
    if (signatureMethod === 'drawn' && !signatureDataUrl) {
        return fail(400, 'signatureDataUrl is required for drawn signatures');
    }
    const now = new Date().toISOString();
    const { data: signed, error } = await supabase
        .from('treatment_plans')
        .update({
        signed_at: now,
        signed_by: therapistId,
        signature_method: signatureMethod,
        signature_data_url: signatureDataUrl,
        updated_at: now,
        updated_by: therapistId,
    })
        .eq('id', planId)
        .select('*')
        .maybeSingle();
    if (error || !signed) {
        return fail(500, error?.message || 'Failed to sign plan');
    }
    await logAuditEvent({
        userId: therapistId,
        action: 'treatment_plan.sign',
        tableName: 'treatment_plans',
        recordId: planId,
        newData: { signed_at: signed.signed_at, signature_method: signatureMethod },
        ipAddress: audit.ipAddress,
        userAgent: audit.userAgent,
    });
    return ok({ plan: signed });
}
