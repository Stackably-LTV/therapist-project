function toOptionalString(value) {
    return typeof value === 'string' && value.trim() ? value : null;
}
export function flattenTreatmentPlanObjectives(goals) {
    return goals.flatMap((goal) => {
        const goalId = toOptionalString(goal.id);
        const objectives = Array.isArray(goal.objectives) ? goal.objectives : [];
        return objectives.map((objective, index) => ({
            id: String(objective.id ?? crypto.randomUUID()),
            goalId: String(goalId ?? ''),
            description: String(objective.description ?? ''),
            measurableCriteria: toOptionalString(objective.measurableCriteria) ?? toOptionalString(objective.measurable_criteria),
            dueDate: toOptionalString(objective.dueDate) ?? toOptionalString(objective.due_date),
            status: String(objective.status ?? 'not_started'),
            position: typeof objective.position === 'number' ? objective.position : index,
        }));
    });
}
function normalizePlan(plan) {
    return {
        ...plan,
        patientId: plan.patientId ?? plan.seeker_id,
        therapistId: plan.therapistId ?? plan.therapist_id,
        planFamilyId: plan.planFamilyId ?? plan.plan_family_id,
        moduleName: plan.moduleName ?? plan.module_name,
        diagnosisCodeId: plan.diagnosisCodeId ?? plan.diagnosis_code_id,
        diagnosisName: plan.diagnosisName ?? plan.diagnosis_name,
        dischargePlan: plan.dischargePlan ?? plan.discharge_plan,
        additionalInfo: plan.additionalInfo ?? plan.additional_info,
        medicalNecessityAcknowledged: plan.medicalNecessityAcknowledged ?? plan.medical_necessity_acknowledged ?? false,
        medicalNecessityStatement: plan.medicalNecessityStatement ?? plan.medical_necessity_statement,
        sentAt: plan.sentAt ?? plan.sent_at,
        acknowledgedAt: plan.acknowledgedAt ?? plan.acknowledged_at,
        signedAt: plan.signedAt ?? plan.signed_at,
        signedBy: plan.signedBy ?? plan.signed_by,
        signatureMethod: plan.signatureMethod ?? plan.signature_method,
        signatureDataUrl: plan.signatureDataUrl ?? plan.signature_data_url,
    };
}
function normalizeGoal(goal, planId) {
    return {
        ...goal,
        planId: goal.planId ?? planId,
        targetDate: goal.targetDate ?? goal.target_date,
        progress: typeof goal.progress === 'number' ? goal.progress : 0,
        status: goal.status ?? 'not_started',
    };
}
function normalizeIntervention(intervention, planId, index) {
    return {
        ...intervention,
        id: intervention.id ?? crypto.randomUUID(),
        planId: intervention.planId ?? planId,
        goalId: intervention.goalId ?? intervention.goal_id ?? null,
        position: typeof intervention.position === 'number' ? intervention.position : index,
    };
}
export function buildTreatmentPlanBundle(plan) {
    const goals = Array.isArray(plan.goals_json) ? plan.goals_json : [];
    const normalizedPlan = normalizePlan(plan);
    const planId = String(normalizedPlan['id'] ?? '');
    return {
        plan: normalizedPlan,
        goals: goals.map((goal) => normalizeGoal(goal, planId)),
        objectives: flattenTreatmentPlanObjectives(goals),
        interventions: Array.isArray(plan.interventions_json)
            ? plan.interventions_json.map((intervention, index) => normalizeIntervention(intervention, planId, index))
            : [],
    };
}
