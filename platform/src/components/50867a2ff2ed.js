import 'server-only';
import { createClient } from '@/components/9a6b39502e62';
import { buildTreatmentPlanBundle } from '@/components/0ba2eca00279';
import { ok, fail } from '@/components/7ff049787825';
function asOptionalString(v) {
    if (typeof v !== 'string')
        return null;
    const s = v.trim();
    return s.length ? s : null;
}
async function assertAccess(therapistId, seekerId) {
    const supabase = await createClient();
    const { data: rec } = await supabase
        .from('patient_records')
        .select('primary_therapist_id')
        .eq('seeker_id', seekerId)
        .maybeSingle();
    if (rec?.primary_therapist_id === therapistId)
        return { ok: true, supabase };
    const { data: prior } = await supabase
        .from('appointments')
        .select('id')
        .eq('therapist_id', therapistId)
        .eq('seeker_id', seekerId)
        .limit(1);
    if (prior && prior.length)
        return { ok: true, supabase };
    return { ok: false, status: 403, error: 'Forbidden' };
}
/** List current treatment plans for a patient, mapped to display bundles. */
export async function listPatientTreatmentPlans(therapistId, patientId) {
    const access = await assertAccess(therapistId, patientId);
    if (!access.ok)
        return fail(access.status, access.error);
    const { data: plans } = await access.supabase
        .from('treatment_plans')
        .select('*')
        .eq('seeker_id', patientId)
        .eq('therapist_id', therapistId)
        .eq('is_current', true)
        .order('created_at', { ascending: false });
    const bundles = (plans ?? []).map((plan) => buildTreatmentPlanBundle(plan));
    return ok({ bundles });
}
/** Create a draft treatment plan for a patient and return its display bundle. */
export async function createPatientTreatmentPlan(therapistId, patientId, body) {
    const access = await assertAccess(therapistId, patientId);
    if (!access.ok)
        return fail(access.status, access.error);
    const planFamilyId = crypto.randomUUID();
    const { data: created, error } = await access.supabase
        .from('treatment_plans')
        .insert({
        seeker_id: patientId,
        therapist_id: therapistId,
        status: 'draft',
        module_name: asOptionalString(body?.moduleName),
        frequency: asOptionalString(body?.frequency),
        timeline: asOptionalString(body?.timeline),
        discharge_plan: asOptionalString(body?.dischargePlan),
        additional_info: asOptionalString(body?.additionalInfo),
        homework: asOptionalString(body?.homework),
        diagnosis_code_id: asOptionalString(body?.diagnosisCodeId),
        diagnosis_name: asOptionalString(body?.diagnosisName),
        medical_necessity_acknowledged: Boolean(body?.medicalNecessityAcknowledged),
        medical_necessity_statement: asOptionalString(body?.medicalNecessityStatement),
        is_current: true,
        version: 1,
        plan_family_id: planFamilyId,
        goals_json: [],
        interventions_json: [],
    })
        .select('*')
        .single();
    if (error || !created)
        return fail(500, error?.message || 'Failed');
    return { ok: true, status: 201, data: { bundle: buildTreatmentPlanBundle(created) } };
}
