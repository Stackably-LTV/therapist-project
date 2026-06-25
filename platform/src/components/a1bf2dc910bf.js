import 'server-only';
import { createClient } from '@/components/9a6b39502e62';
import { ok, fail } from '@/components/7ff049787825';
import { PATIENT_RECORD_FIELDS, USER_PROFILE_FIELDS, } from '@/components/97c224d0ef79';
function asOptionalString(v) {
    if (typeof v !== 'string')
        return null;
    const t = v.trim();
    return t.length ? t : null;
}
/** Read the seeker's combined personal info (patient record + profile). */
export async function getSeekerPersonalInfo(seekerId) {
    const supabase = await createClient();
    const [{ data: patient, error: patientError }, { data: profile, error: profileError }] = await Promise.all([
        supabase
            .from('patient_records')
            .select(PATIENT_RECORD_FIELDS.join(','))
            .eq('seeker_id', seekerId)
            .maybeSingle(),
        supabase
            .from('user_profiles')
            .select(USER_PROFILE_FIELDS.join(','))
            .eq('user_id', seekerId)
            .maybeSingle(),
    ]);
    if (patientError)
        return fail(500, patientError.message);
    if (profileError)
        return fail(500, profileError.message);
    const profileObj = (profile ?? {});
    const patientObj = (patient ?? {});
    const record = patient || profile ? { ...profileObj, ...patientObj } : null;
    return ok({ record });
}
/** Update the seeker's personal info across patient_records and user_profiles. */
export async function updateSeekerPersonalInfo(seekerId, body) {
    const patientPayload = {};
    for (const field of PATIENT_RECORD_FIELDS) {
        if (field in body) {
            patientPayload[field] = asOptionalString(body[field]);
        }
    }
    const profilePayload = {};
    for (const field of USER_PROFILE_FIELDS) {
        if (field in body) {
            profilePayload[field] = asOptionalString(body[field]);
        }
    }
    const supabase = await createClient();
    // Patient record: upsert keyed on seeker_id (PK).
    if (Object.keys(patientPayload).length > 0) {
        const { data: existing } = await supabase
            .from('patient_records')
            .select('seeker_id')
            .eq('seeker_id', seekerId)
            .maybeSingle();
        const { error } = existing
            ? await supabase
                .from('patient_records')
                .update(patientPayload)
                .eq('seeker_id', seekerId)
            : await supabase
                .from('patient_records')
                .insert({ seeker_id: seekerId, ...patientPayload });
        if (error)
            return fail(500, error.message);
    }
    // Profile fields: update only (the profile row is created at signup).
    if (Object.keys(profilePayload).length > 0) {
        const { error } = await supabase
            .from('user_profiles')
            .update(profilePayload)
            .eq('user_id', seekerId);
        if (error)
            return fail(500, error.message);
    }
    return ok({ success: true });
}
