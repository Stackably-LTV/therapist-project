import 'server-only';
import { createClient, createServiceRoleClient } from '@/components/9a6b39502e62';
import { serializeRichMessage } from '@/components/a6e7ef5e01c9';
import { logAuditEvent } from '@/components/0be57ea0c568';
import { ok, fail } from '@/components/7ff049787825';
const BUCKET = 'treatment-plan-attachments';
/** List the seeker's sent/acknowledged treatment plans. */
export async function listSeekerTreatmentPlans(seekerId) {
    const supabase = await createClient();
    const { data: plans, error } = await supabase
        .from('treatment_plans')
        .select('*')
        .eq('seeker_id', seekerId)
        .in('status', ['sent', 'acknowledged'])
        .order('updated_at', { ascending: false });
    if (error)
        return fail(500, error.message);
    return ok({ plans: plans ?? [] });
}
/** Fetch a single plan plus its attachments and acknowledgments. */
export async function getSeekerTreatmentPlanBundle(seekerId, planId) {
    const supabase = await createClient();
    const { data: plan, error } = await supabase
        .from('treatment_plans')
        .select('*')
        .eq('id', planId)
        .maybeSingle();
    if (error)
        return fail(500, error.message);
    if (!plan)
        return fail(404, 'Not found');
    if (plan.seeker_id !== seekerId) {
        return fail(403, 'Forbidden');
    }
    const { data: attachments } = await supabase
        .from('treatment_plan_attachments')
        .select('*')
        .eq('plan_id', planId)
        .order('created_at', { ascending: true });
    const { data: acknowledgments } = await supabase
        .from('treatment_plan_acknowledgments')
        .select('*')
        .eq('plan_id', planId)
        .order('acknowledged_at', { ascending: false });
    return ok({
        bundle: {
            plan,
            attachments: attachments ?? [],
            acknowledgments: acknowledgments ?? [],
        },
    });
}
/** List a plan's attachments with freshly-signed download URLs. */
export async function getSeekerTreatmentPlanAttachments(seekerId, planId) {
    const supabase = await createClient();
    const { data: plan } = await supabase
        .from('treatment_plans')
        .select('id, seeker_id')
        .eq('id', planId)
        .maybeSingle();
    if (!plan)
        return fail(404, 'Not found');
    if (plan.seeker_id !== seekerId) {
        return fail(403, 'Forbidden');
    }
    const { data: attachments, error } = await supabase
        .from('treatment_plan_attachments')
        .select('*')
        .eq('plan_id', planId)
        .order('created_at', { ascending: true });
    if (error)
        return fail(500, error.message);
    const storage = createServiceRoleClient();
    const withUrls = await Promise.all((attachments ?? []).map(async (a) => {
        const path = String(a.file_url ?? '').replace(`${BUCKET}/`, '');
        const { data } = await storage.storage.from(BUCKET).createSignedUrl(path, 3600);
        return { ...a, signedUrl: data?.signedUrl ?? null };
    }));
    return ok({ attachments: withUrls });
}
/**
 * Acknowledge a sent treatment plan: flips it to active, records the
 * acknowledgment, writes an audit log, and best-effort notifies the therapist.
 */
export async function acknowledgeTreatmentPlan(seekerId, planId, audit) {
    const supabase = await createClient();
    const { data: plan } = await supabase
        .from('treatment_plans')
        .select('*')
        .eq('id', planId)
        .maybeSingle();
    if (!plan) {
        return fail(404, 'Plan not found');
    }
    if (plan.seeker_id !== seekerId) {
        return fail(403, 'Forbidden');
    }
    if (plan.status !== 'sent') {
        return fail(409, `Plan cannot be acknowledged (status: ${plan.status})`);
    }
    const nowIso = new Date().toISOString();
    const { data: updatedPlan, error: updateError } = await supabase
        .from('treatment_plans')
        .update({ status: 'active', acknowledged_at: nowIso, updated_at: nowIso })
        .eq('id', planId)
        .select('*')
        .maybeSingle();
    if (updateError) {
        return fail(500, updateError.message);
    }
    await supabase.from('treatment_plan_acknowledgments').insert({
        plan_id: planId,
        seeker_id: seekerId,
        plan_version: plan.version,
        acknowledged_at: nowIso,
    });
    // Log audit event
    await logAuditEvent({
        userId: seekerId,
        action: 'treatment_plan.acknowledge',
        tableName: 'treatment_plans',
        recordId: planId,
        newData: { status: 'active', acknowledged_at: nowIso },
        ipAddress: audit.ipAddress,
        userAgent: audit.userAgent,
    });
    // Best-effort chat notification to therapist
    try {
        const payload = serializeRichMessage({
            type: 'treatment_plan_ack',
            version: 1,
            chartId: planId,
            title: plan.diagnosis_name || 'Treatment plan',
            acknowledgedAt: nowIso,
        });
        await supabase.from('messages').insert({
            sender_id: seekerId,
            recipient_id: plan.therapist_id,
            content: payload,
        });
    }
    catch {
        // ignore
    }
    return ok({ plan: updatedPlan });
}
