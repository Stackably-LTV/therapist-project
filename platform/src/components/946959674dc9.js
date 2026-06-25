import 'server-only';
import { createClient } from '@/components/9a6b39502e62';
import { asOptionalString, asOptionalNumber, normalizeDateInput } from '@/components/58193d01af01';
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
function locateObjective(goals, objectiveId) {
    for (let gi = 0; gi < goals.length; gi++) {
        const objs = goals[gi].objectives ?? [];
        const oi = objs.findIndex((o) => o.id === objectiveId);
        if (oi >= 0)
            return { gi, oi };
    }
    return null;
}
/** List a plan's goals. Owner-scoped. */
export async function listGoals(therapistId, planId) {
    const access = await loadOwnedPlan(planId, therapistId);
    if (!access.ok)
        return fail(access.status, access.error);
    return ok({ goals: access.plan.goals_json ?? [] });
}
/** Append a goal to a plan, deduping against identical existing goals. */
export async function createGoal(therapistId, planId, body) {
    const access = await loadOwnedPlan(planId, therapistId);
    if (!access.ok)
        return fail(access.status, access.error);
    const title = asOptionalString(body?.title);
    if (!title)
        return fail(400, 'Title is required');
    const goals = (access.plan.goals_json ?? []).slice();
    const description = asOptionalString(body?.description) ?? undefined;
    const targetDate = normalizeDateInput(body?.targetDate) ?? undefined;
    const duplicateGoal = goals.find((goal) => typeof goal === 'object' &&
        goal !== null &&
        String(goal.title || '').trim().toLowerCase() === title.toLowerCase() &&
        (goal.description || undefined) === description &&
        (goal.target_date || undefined) === targetDate);
    if (duplicateGoal) {
        return ok({ goal: duplicateGoal, duplicate: true });
    }
    const newGoal = {
        id: crypto.randomUUID(),
        title,
        description,
        target_date: targetDate,
        timeline: asOptionalString(body?.timeline) ?? undefined,
        status: asOptionalString(body?.status) ?? 'not_started',
        progress: asOptionalNumber(body?.progress) ?? 0,
        position: asOptionalNumber(body?.position) ?? goals.length,
        objectives: [],
    };
    goals.push(newGoal);
    const { error } = await access.supabase
        .from('treatment_plans')
        .update({ goals_json: goals, updated_at: new Date().toISOString() })
        .eq('id', planId);
    if (error)
        return fail(500, error.message);
    return ok({ goal: newGoal, created: true });
}
/** Patch a goal in place by id. Owner-scoped. */
export async function updateGoal(therapistId, planId, goalId, body) {
    const access = await loadOwnedPlan(planId, therapistId);
    if (!access.ok)
        return fail(access.status, access.error);
    const goals = (access.plan.goals_json ?? []).slice();
    const idx = goals.findIndex((g) => g.id === goalId);
    if (idx < 0)
        return fail(404, 'Not found');
    const updates = {};
    const title = asOptionalString(body?.title);
    if (title)
        updates.title = title;
    const description = asOptionalString(body?.description);
    if (body?.description !== undefined)
        updates.description = description ?? undefined;
    const targetDate = normalizeDateInput(body?.targetDate);
    if (body?.targetDate !== undefined)
        updates.target_date = targetDate ?? undefined;
    const timeline = asOptionalString(body?.timeline);
    if (body?.timeline !== undefined)
        updates.timeline = timeline ?? undefined;
    const status = asOptionalString(body?.status);
    if (status)
        updates.status = status;
    const progress = asOptionalNumber(body?.progress);
    if (progress != null)
        updates.progress = progress;
    const position = asOptionalNumber(body?.position);
    if (position != null)
        updates.position = position;
    goals[idx] = { ...goals[idx], ...updates };
    const { error } = await access.supabase
        .from('treatment_plans')
        .update({ goals_json: goals, updated_at: new Date().toISOString() })
        .eq('id', planId);
    if (error)
        return fail(500, error.message);
    return ok({ goal: goals[idx] });
}
/** Delete a goal and detach any interventions that referenced it. */
export async function deleteGoal(therapistId, planId, goalId) {
    const access = await loadOwnedPlan(planId, therapistId);
    if (!access.ok)
        return fail(access.status, access.error);
    const goals = (access.plan.goals_json ?? []).filter((g) => g.id !== goalId);
    // Also drop any interventions linked to that goal.
    const interventions = (access.plan.interventions_json ?? []).map((i) => i.goal_id === goalId ? { ...i, goal_id: null } : i);
    const { error } = await access.supabase
        .from('treatment_plans')
        .update({
        goals_json: goals,
        interventions_json: interventions,
        updated_at: new Date().toISOString(),
    })
        .eq('id', planId);
    if (error)
        return fail(500, error.message);
    return ok({ ok: true });
}
/** List objectives belonging to a goal. Owner-scoped. */
export async function listObjectives(therapistId, planId, goalId) {
    const access = await loadOwnedPlan(planId, therapistId);
    if (!access.ok)
        return fail(access.status, access.error);
    const goal = (access.plan.goals_json ?? []).find((g) => g.id === goalId);
    if (!goal)
        return fail(404, 'Not found');
    return ok({ objectives: goal.objectives ?? [] });
}
/** Append an objective to a goal. Owner-scoped. */
export async function createObjective(therapistId, planId, goalId, body) {
    const access = await loadOwnedPlan(planId, therapistId);
    if (!access.ok)
        return fail(access.status, access.error);
    const description = asOptionalString(body?.description);
    if (!description)
        return fail(400, 'Description is required');
    const goals = (access.plan.goals_json ?? []).slice();
    const idx = goals.findIndex((g) => g.id === goalId);
    if (idx < 0)
        return fail(404, 'Not found');
    const objectives = (goals[idx].objectives ?? []).slice();
    const newObjective = {
        id: crypto.randomUUID(),
        description,
        measurable_criteria: asOptionalString(body?.measurableCriteria) ?? undefined,
        due_date: normalizeDateInput(body?.dueDate) ?? undefined,
        status: asOptionalString(body?.status) ?? 'not_started',
        position: asOptionalNumber(body?.position) ?? objectives.length,
    };
    objectives.push(newObjective);
    goals[idx] = { ...goals[idx], objectives };
    const { error } = await access.supabase
        .from('treatment_plans')
        .update({ goals_json: goals, updated_at: new Date().toISOString() })
        .eq('id', planId);
    if (error)
        return fail(500, error.message);
    return ok({ objective: newObjective, created: true });
}
/** Patch an objective in place by id, searching across all goals. */
export async function updateObjective(therapistId, planId, objectiveId, body) {
    const access = await loadOwnedPlan(planId, therapistId);
    if (!access.ok)
        return fail(access.status, access.error);
    const goals = (access.plan.goals_json ?? []).map((g) => ({
        ...g,
        objectives: (g.objectives ?? []).slice(),
    }));
    const found = locateObjective(goals, objectiveId);
    if (!found)
        return fail(404, 'Not found');
    const obj = goals[found.gi].objectives[found.oi];
    const description = asOptionalString(body?.description);
    if (description)
        obj.description = description;
    const measurable = asOptionalString(body?.measurableCriteria);
    if (body?.measurableCriteria !== undefined)
        obj.measurable_criteria = measurable ?? undefined;
    const dueDate = normalizeDateInput(body?.dueDate);
    if (body?.dueDate !== undefined)
        obj.due_date = dueDate ?? undefined;
    const status = asOptionalString(body?.status);
    if (status)
        obj.status = status;
    const position = asOptionalNumber(body?.position);
    if (position != null)
        obj.position = position;
    goals[found.gi].objectives[found.oi] = obj;
    const { error } = await access.supabase
        .from('treatment_plans')
        .update({ goals_json: goals, updated_at: new Date().toISOString() })
        .eq('id', planId);
    if (error)
        return fail(500, error.message);
    return ok({ objective: obj });
}
/** Delete an objective by id, searching across all goals. */
export async function deleteObjective(therapistId, planId, objectiveId) {
    const access = await loadOwnedPlan(planId, therapistId);
    if (!access.ok)
        return fail(access.status, access.error);
    const goals = (access.plan.goals_json ?? []).map((g) => ({
        ...g,
        objectives: (g.objectives ?? []).filter((o) => o.id !== objectiveId),
    }));
    const { error } = await access.supabase
        .from('treatment_plans')
        .update({ goals_json: goals, updated_at: new Date().toISOString() })
        .eq('id', planId);
    if (error)
        return fail(500, error.message);
    return ok({ ok: true });
}
