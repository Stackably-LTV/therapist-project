import 'server-only';
import { createClient } from '@/components/9a6b39502e62';
import { asOptionalString, asOptionalNumber } from '@/components/58193d01af01';
import { ok, fail } from '@/components/7ff049787825';
async function loadOwnedPlan(planId, therapistId) {
    const supabase = await createClient();
    const { data: plan } = await supabase.from('treatment_plans').select('*').eq('id', planId).maybeSingle();
    if (!plan)
        return { ok: false, status: 404, error: 'Not found' };
    if (plan.therapist_id !== therapistId)
        return { ok: false, status: 403, error: 'Forbidden' };
    return { ok: true, plan, supabase };
}
/** List a plan's interventions. Owner-scoped. */
export async function listInterventions(therapistId, planId) {
    const access = await loadOwnedPlan(planId, therapistId);
    if (!access.ok)
        return fail(access.status, access.error);
    return ok({ interventions: access.plan.interventions_json ?? [] });
}
/** Append an intervention, validating any linked goalId exists. */
export async function createIntervention(therapistId, planId, body) {
    const access = await loadOwnedPlan(planId, therapistId);
    if (!access.ok)
        return fail(access.status, access.error);
    const description = asOptionalString(body?.description);
    if (!description)
        return fail(400, 'Description is required');
    const goalId = asOptionalString(body?.goalId);
    if (goalId) {
        const goals = access.plan.goals_json ?? [];
        if (!goals.find((g) => g.id === goalId)) {
            return fail(400, 'Invalid goalId');
        }
    }
    const interventions = (access.plan.interventions_json ?? []).slice();
    const newIntervention = {
        id: crypto.randomUUID(),
        description,
        frequency: asOptionalString(body?.frequency) ?? undefined,
        goal_id: goalId ?? undefined,
        position: asOptionalNumber(body?.position) ?? interventions.length,
    };
    interventions.push(newIntervention);
    const { error } = await access.supabase
        .from('treatment_plans')
        .update({ interventions_json: interventions, updated_at: new Date().toISOString() })
        .eq('id', planId);
    if (error)
        return fail(500, error.message);
    return ok({ intervention: newIntervention });
}
/** Patch an intervention in place by id, validating any linked goalId. */
export async function updateIntervention(therapistId, planId, interventionId, body) {
    const access = await loadOwnedPlan(planId, therapistId);
    if (!access.ok)
        return fail(access.status, access.error);
    const interventions = (access.plan.interventions_json ?? []).slice();
    const idx = interventions.findIndex((i) => i.id === interventionId);
    if (idx < 0)
        return fail(404, 'Not found');
    const goalIdInput = body?.goalId;
    if (goalIdInput && typeof goalIdInput === 'string') {
        const goals = access.plan.goals_json ?? [];
        if (!goals.find((g) => g.id === goalIdInput)) {
            return fail(400, 'Invalid goalId');
        }
    }
    const item = interventions[idx];
    const description = asOptionalString(body?.description);
    if (description)
        item.description = description;
    const frequency = asOptionalString(body?.frequency);
    if (body?.frequency !== undefined)
        item.frequency = frequency ?? undefined;
    if (body?.goalId === null)
        item.goal_id = null;
    else if (typeof goalIdInput === 'string' && goalIdInput)
        item.goal_id = goalIdInput;
    const position = asOptionalNumber(body?.position);
    if (position != null)
        item.position = position;
    interventions[idx] = item;
    const { error } = await access.supabase
        .from('treatment_plans')
        .update({ interventions_json: interventions, updated_at: new Date().toISOString() })
        .eq('id', planId);
    if (error)
        return fail(500, error.message);
    return ok({ intervention: item });
}
/** Delete an intervention by id. Owner-scoped. */
export async function deleteIntervention(therapistId, planId, interventionId) {
    const access = await loadOwnedPlan(planId, therapistId);
    if (!access.ok)
        return fail(access.status, access.error);
    const interventions = (access.plan.interventions_json ?? []).filter((i) => i.id !== interventionId);
    const { error } = await access.supabase
        .from('treatment_plans')
        .update({ interventions_json: interventions, updated_at: new Date().toISOString() })
        .eq('id', planId);
    if (error)
        return fail(500, error.message);
    return ok({ ok: true });
}
