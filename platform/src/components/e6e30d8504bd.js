import 'server-only';
import { createClient, createServiceRoleClient } from '@/components/9a6b39502e62';
import { emailService } from '@/components/b2a0b00fb250';
import { ok, fail } from '@/components/7ff049787825';
function asOptionalString(v) {
    if (typeof v !== 'string')
        return null;
    const s = v.trim();
    return s.length ? s : null;
}
function normalizeStringArray(v) {
    if (Array.isArray(v)) {
        const out = v.map((x) => (typeof x === 'string' ? x.trim() : '')).filter(Boolean);
        return out.length ? out : null;
    }
    if (typeof v === 'string') {
        const out = v.split(',').map((x) => x.trim()).filter(Boolean);
        return out.length ? out : null;
    }
    return null;
}
function makeFullNameFromParts(parts) {
    const first = parts.first?.trim() || '';
    const middle = parts.middle?.trim() || '';
    const last = parts.last?.trim() || '';
    const suffix = parts.suffix?.trim() || '';
    const base = [first, middle, last].filter(Boolean).join(' ');
    return [base, suffix].filter(Boolean).join(', ') || null;
}
function normalizeDateInput(v) {
    const raw = asOptionalString(v);
    if (!raw)
        return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw))
        return raw;
    if (/^\d{4}-\d{2}-\d{2}t/i.test(raw))
        return raw.slice(0, 10);
    const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m)
        return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
    return null;
}
/**
 * Verify the therapist may act on the seeker: either they are the primary
 * therapist on the patient_record, or they have at least one appointment together.
 * Returns the supabase client (and record, where the caller needs it) on success.
 */
async function assertAccess(therapistId, seekerId, recordSelect = 'primary_therapist_id') {
    const supabase = await createClient();
    const { data: rec } = await supabase
        .from('patient_records')
        .select(recordSelect)
        .eq('seeker_id', seekerId)
        .maybeSingle();
    if (rec?.primary_therapist_id === therapistId)
        return { ok: true, supabase, profile: rec };
    const { data: prior } = await supabase
        .from('appointments')
        .select('id')
        .eq('therapist_id', therapistId)
        .eq('seeker_id', seekerId)
        .limit(1);
    if (prior && prior.length)
        return { ok: true, supabase, profile: rec };
    return { ok: false, status: 403, error: 'Forbidden' };
}
// ---------------------------------------------------------------------------
// GET /api/therapist/patients  (caseload list)
// ---------------------------------------------------------------------------
export async function listPatients(therapistId, includeArchived) {
    const supabase = await createClient();
    const recordQuery = supabase
        .from('patient_records')
        .select('*, profile:user_profiles!patient_records_seeker_id_fkey(full_name)')
        .limit(500);
    const { data: byRecordRaw } = includeArchived
        ? await recordQuery.eq('archived_by', therapistId).eq('caseload_status', 'archived')
        : await recordQuery.eq('primary_therapist_id', therapistId).neq('caseload_status', 'archived');
    const byRecord = (byRecordRaw ?? []);
    if (includeArchived) {
        const patients = byRecord.map((r) => ({
            ...r,
            full_name: r.profile?.full_name ?? null,
        }));
        return ok({ patients });
    }
    const { data: archivedRows } = await supabase
        .from('patient_records')
        .select('seeker_id')
        .eq('archived_by', therapistId)
        .eq('caseload_status', 'archived')
        .limit(500);
    const { data: byAppt } = await supabase
        .from('appointments')
        .select('seeker_id')
        .eq('therapist_id', therapistId)
        .limit(500);
    const archivedIds = new Set((archivedRows ?? []).map((r) => r.seeker_id));
    const recordIds = new Set(byRecord.map((r) => r.seeker_id));
    const apptOnlyIds = new Set();
    (byAppt ?? []).forEach((a) => {
        const id = a.seeker_id;
        if (archivedIds.has(id) || recordIds.has(id))
            return;
        apptOnlyIds.add(id);
    });
    const patients = byRecord.map((r) => ({
        ...r,
        full_name: r.profile?.full_name ?? null,
    }));
    if (apptOnlyIds.size > 0) {
        const { data: profiles } = await supabase
            .from('user_profiles')
            .select('user_id, full_name')
            .in('user_id', Array.from(apptOnlyIds));
        (profiles ?? []).forEach((p) => {
            patients.push({
                seeker_id: p.user_id,
                full_name: p.full_name ?? null,
                caseload_status: 'appointment_only',
            });
        });
    }
    return ok({ patients });
}
// ---------------------------------------------------------------------------
// POST /api/therapist/patients  (slim invite flow)
// ---------------------------------------------------------------------------
export async function invitePatient(therapistId, body) {
    const fullName = asOptionalString(body?.fullName);
    const email = asOptionalString(body?.email);
    const preferredName = asOptionalString(body?.preferredName);
    const existingUserId = asOptionalString(body?.existingUserId);
    const internalNote = asOptionalString(body?.internalNote);
    if (!fullName)
        return fail(400, 'fullName is required');
    if (!email)
        return fail(400, 'email is required');
    const serviceRole = createServiceRoleClient();
    const supabase = await createClient();
    // Look up existing seeker by email via auth.users (admin API).
    let seekerUserId = null;
    let existedOnPlatform = false;
    try {
        const { data: list } = await serviceRole.auth.admin.listUsers({ page: 1, perPage: 200 });
        const match = list?.users?.find((u) => (u.email || '').toLowerCase() === email.toLowerCase());
        if (match) {
            seekerUserId = match.id;
            existedOnPlatform = true;
        }
    }
    catch {
        /* ignore */
    }
    if (existingUserId && (!seekerUserId || seekerUserId !== existingUserId)) {
        seekerUserId = existingUserId;
        existedOnPlatform = true;
    }
    // Ensure existing user is a seeker.
    if (seekerUserId) {
        const { data: roleRow } = await serviceRole
            .from('user_roles')
            .select('role')
            .eq('id', seekerUserId)
            .maybeSingle();
        if (roleRow && roleRow.role !== 'seeker') {
            return fail(409, 'This email is already used by a non-seeker account. Use a different email.');
        }
    }
    // Create new auth user if needed.
    if (!seekerUserId) {
        const temporaryPassword = `Temp-${crypto.randomUUID()}!`;
        const { data: createdAuthUser, error: createAuthError } = await serviceRole.auth.admin.createUser({
            email,
            password: temporaryPassword,
            email_confirm: true,
            user_metadata: { name: fullName, role: 'seeker' },
        });
        if (createAuthError || !createdAuthUser?.user) {
            return fail(500, createAuthError?.message || 'Failed to create seeker account');
        }
        seekerUserId = createdAuthUser.user.id;
        // Create user_roles + user_profiles rows.
        await serviceRole.from('user_roles').upsert({
            id: seekerUserId,
            role: 'seeker',
            status: 'active',
        });
        await serviceRole.from('user_profiles').upsert({
            user_id: seekerUserId,
            full_name: fullName,
            preferred_name: preferredName,
        });
    }
    else {
        // Update profile name if provided.
        await serviceRole.from('user_profiles').upsert({
            user_id: seekerUserId,
            full_name: fullName,
            preferred_name: preferredName,
        });
    }
    // If this seeker already has a primary therapist relationship with me, just
    // re-send the email and add the internal note (no new invite needed).
    const { data: existingRecord } = await supabase
        .from('patient_records')
        .select('seeker_id, primary_therapist_id')
        .eq('seeker_id', seekerUserId)
        .maybeSingle();
    const alreadyClient = existingRecord?.primary_therapist_id === therapistId;
    if (alreadyClient && internalNote) {
        await supabase.from('clinical_provider_notes').insert({
            therapist_id: therapistId,
            seeker_id: seekerUserId,
            title: 'Internal note',
            content: internalNote,
            note_type: 'general',
            is_private: true,
        });
    }
    if (alreadyClient) {
        return {
            ok: true,
            data: {
                patient: { id: seekerUserId, name: fullName, email },
                alreadyClient: true,
            },
        };
    }
    // Otherwise: send a consent invite via connection_requests.
    const { data: therapistProfile } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('user_id', therapistId)
        .maybeSingle();
    const therapistName = therapistProfile?.full_name || 'Your therapist';
    const token = crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';
    let signupUrl = `${appUrl}/login?mode=signup&?email=${encodeURIComponent(email)}`;
    if (!existedOnPlatform) {
        try {
            const { data: recoveryLinkData } = await serviceRole.auth.admin.generateLink({
                type: 'recovery',
                email,
                options: { redirectTo: `${appUrl}/api/auth/callback?next=/login` },
            });
            if (recoveryLinkData?.properties?.action_link) {
                signupUrl = recoveryLinkData.properties.action_link;
            }
        }
        catch {
            /* ignore */
        }
    }
    const metadataJson = {
        inviteRequiresSignup: !existedOnPlatform,
        internalNote,
    };
    const { error: inviteError } = await serviceRole.from('connection_requests').insert({
        therapist_id: therapistId,
        seeker_email: email,
        seeker_name: fullName,
        invite_token: token,
        status: 'pending',
        initiated_by: 'therapist',
        expires_at: expiresAt,
        metadata_json: metadataJson,
    });
    if (inviteError) {
        return fail(500, inviteError.message || 'Failed to create consent invite');
    }
    await emailService.sendClientConsentInvite({
        to: email,
        seekerName: preferredName ?? fullName,
        therapistName,
        acceptUrl: `${appUrl}/api/therapist/patients/invites/accept?token=${encodeURIComponent(token)}`,
        rejectUrl: `${appUrl}/api/therapist/patients/invites/reject?token=${encodeURIComponent(token)}`,
        requiresSignup: !existedOnPlatform,
        signupUrl,
    });
    return {
        ok: true,
        status: 202,
        data: {
            pendingConsent: true,
            inviteSent: true,
            patient: { id: seekerUserId, name: fullName, email },
        },
    };
}
// ---------------------------------------------------------------------------
// GET /api/therapist/patients/[patientId]
// ---------------------------------------------------------------------------
export async function getPatient(therapistId, patientId) {
    const access = await assertAccess(therapistId, patientId, '*');
    if (!access.ok)
        return fail(access.status, access.error);
    const { data: profile } = await access.supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', patientId)
        .maybeSingle();
    if (!profile)
        return fail(404, 'Patient not found');
    // Look up email via service role (auth.users).
    let email = null;
    try {
        const sr = createServiceRoleClient();
        const { data } = await sr.auth.admin.getUserById(patientId);
        email = data?.user?.email ?? null;
    }
    catch {
        email = null;
    }
    const patient = {
        id: patientId,
        name: profile.full_name,
        email,
    };
    return ok({ patient, profile: access.profile });
}
// ---------------------------------------------------------------------------
// PUT /api/therapist/patients/[patientId]
// ---------------------------------------------------------------------------
export async function updatePatient(therapistId, patientId, body) {
    const access = await assertAccess(therapistId, patientId, '*');
    if (!access.ok)
        return fail(access.status, access.error);
    const legalFirstName = asOptionalString(body?.legalFirstName);
    const legalMiddleName = asOptionalString(body?.legalMiddleName);
    const legalLastName = asOptionalString(body?.legalLastName);
    const legalSuffix = asOptionalString(body?.legalSuffix);
    const fullNameFromParts = makeFullNameFromParts({
        first: legalFirstName,
        middle: legalMiddleName,
        last: legalLastName,
        suffix: legalSuffix,
    });
    const fullName = fullNameFromParts ?? asOptionalString(body?.fullName);
    if (fullName) {
        await access.supabase
            .from('user_profiles')
            .update({ full_name: fullName })
            .eq('user_id', patientId);
    }
    const recordUpdate = {
        legal_first_name: legalFirstName,
        legal_middle_name: legalMiddleName,
        legal_last_name: legalLastName,
        legal_suffix: legalSuffix,
        time_zone: asOptionalString(body?.timeZone),
        languages: normalizeStringArray(body?.languages),
        mobile_phone_e164: asOptionalString(body?.mobilePhone),
        home_phone_e164: asOptionalString(body?.homePhone),
        work_phone_e164: asOptionalString(body?.workPhone),
        other_phone_e164: asOptionalString(body?.otherPhone),
        preferred_name: asOptionalString(body?.preferredName),
        pronouns: asOptionalString(body?.pronouns),
        dob: normalizeDateInput(body?.dob),
        address_line1: asOptionalString(body?.addressLine1),
        address_line2: asOptionalString(body?.addressLine2),
        city: asOptionalString(body?.city),
        state: asOptionalString(body?.state),
        postal_code: asOptionalString(body?.postalCode),
        country: asOptionalString(body?.country),
        phone_e164: asOptionalString(body?.phone) ?? asOptionalString(body?.mobilePhone),
        contact_email: asOptionalString(body?.email),
        sexual_orientation: asOptionalString(body?.sexualOrientation),
        sexual_orientation_other: asOptionalString(body?.sexualOrientationOther),
        gender_identity: asOptionalString(body?.genderIdentity),
        gender_identity_other: asOptionalString(body?.genderIdentityOther),
        race: asOptionalString(body?.race),
        race_other: asOptionalString(body?.raceOther),
        religion: asOptionalString(body?.religion),
        religion_other: asOptionalString(body?.religionOther),
        ethnicity: asOptionalString(body?.ethnicity),
        ethnicity_other: asOptionalString(body?.ethnicityOther),
        pcp_name: asOptionalString(body?.pcpName),
        pcp_phone: asOptionalString(body?.pcpPhone),
        updated_at: new Date().toISOString(),
    };
    if (asOptionalString(body?.administrativeSex))
        recordUpdate.administrative_sex = asOptionalString(body?.administrativeSex);
    if (asOptionalString(body?.mobilePhoneMessages))
        recordUpdate.mobile_phone_messages = asOptionalString(body?.mobilePhoneMessages);
    if (asOptionalString(body?.homePhoneMessages))
        recordUpdate.home_phone_messages = asOptionalString(body?.homePhoneMessages);
    if (asOptionalString(body?.workPhoneMessages))
        recordUpdate.work_phone_messages = asOptionalString(body?.workPhoneMessages);
    if (asOptionalString(body?.otherPhoneMessages))
        recordUpdate.other_phone_messages = asOptionalString(body?.otherPhoneMessages);
    if (body?.phoneVoicemailOk != null)
        recordUpdate.phone_voicemail_ok = Boolean(body.phoneVoicemailOk);
    if (body?.phoneSmsOk != null)
        recordUpdate.phone_sms_ok = Boolean(body.phoneSmsOk);
    if (asOptionalString(body?.smokingStatus))
        recordUpdate.smoking_status = asOptionalString(body?.smokingStatus);
    if (asOptionalString(body?.maritalStatus))
        recordUpdate.marital_status = asOptionalString(body?.maritalStatus);
    if (asOptionalString(body?.employmentStatus))
        recordUpdate.employment_status = asOptionalString(body?.employmentStatus);
    if (body?.hasPcp != null)
        recordUpdate.has_pcp = Boolean(body.hasPcp);
    if (body?.pcpReleaseSigned != null)
        recordUpdate.pcp_release_signed = Boolean(body.pcpReleaseSigned);
    if (body?.hipaaReleaseSigned != null)
        recordUpdate.hipaa_release_signed = Boolean(body.hipaaReleaseSigned);
    const { data: updated, error } = await access.supabase
        .from('patient_records')
        .update(recordUpdate)
        .eq('seeker_id', patientId)
        .select('*')
        .maybeSingle();
    if (error)
        return fail(500, error.message);
    return ok({ profile: updated ?? access.profile });
}
// ---------------------------------------------------------------------------
// DELETE /api/therapist/patients/[patientId]  (archive)
// ---------------------------------------------------------------------------
export async function archivePatient(therapistId, patientId) {
    const admin = createServiceRoleClient();
    const { data: record } = await admin
        .from('patient_records')
        .select('seeker_id, primary_therapist_id')
        .eq('seeker_id', patientId)
        .maybeSingle();
    if (record?.primary_therapist_id && record.primary_therapist_id !== therapistId) {
        return fail(409, 'Patient is assigned to another therapist');
    }
    let canArchive = record?.primary_therapist_id === therapistId;
    if (!canArchive) {
        const { data: prior } = await admin
            .from('appointments')
            .select('id')
            .eq('therapist_id', therapistId)
            .eq('seeker_id', patientId)
            .limit(1);
        canArchive = Boolean(prior && prior.length > 0);
    }
    if (!canArchive) {
        return fail(404, 'Relationship not found');
    }
    const archivedAt = new Date().toISOString();
    const archivePayload = {
        seeker_id: patientId,
        primary_therapist_id: null,
        caseload_status: 'archived',
        archived_at: archivedAt,
        archived_by: therapistId,
        updated_at: archivedAt,
        updated_by: therapistId,
    };
    const { error } = record
        ? await admin
            .from('patient_records')
            .update(archivePayload)
            .eq('seeker_id', patientId)
        : await admin
            .from('patient_records')
            .upsert({ ...archivePayload, created_by: therapistId }, { onConflict: 'seeker_id' });
    if (error)
        return fail(500, error.message);
    await admin
        .from('connection_requests')
        .delete()
        .eq('therapist_id', therapistId)
        .eq('seeker_id', patientId)
        .eq('status', 'accepted');
    return ok({ success: true });
}
// ---------------------------------------------------------------------------
// POST /api/therapist/patients/[patientId]/unarchive
// ---------------------------------------------------------------------------
export async function unarchivePatient(therapistId, patientId) {
    const admin = createServiceRoleClient();
    const { data: record } = await admin
        .from('patient_records')
        .select('seeker_id, primary_therapist_id, archived_by, caseload_status')
        .eq('seeker_id', patientId)
        .maybeSingle();
    if (!record) {
        return fail(404, 'Patient record not found');
    }
    if (record.caseload_status !== 'archived' || record.archived_by !== therapistId) {
        return fail(403, 'Cannot restore this patient');
    }
    if (record.primary_therapist_id && record.primary_therapist_id !== therapistId) {
        return fail(409, 'Patient is now assigned to another therapist');
    }
    const restoredAt = new Date().toISOString();
    const { error } = await admin
        .from('patient_records')
        .update({
        primary_therapist_id: therapistId,
        caseload_status: 'active',
        archived_at: null,
        archived_by: null,
        updated_at: restoredAt,
        updated_by: therapistId,
    })
        .eq('seeker_id', patientId);
    if (error)
        return fail(500, error.message);
    return ok({ success: true });
}
// ---------------------------------------------------------------------------
// Comments: GET / PUT /api/therapist/patients/[patientId]/comments
// ---------------------------------------------------------------------------
export async function getPatientComment(therapistId, patientId) {
    const access = await assertAccess(therapistId, patientId, 'seeker_id, primary_therapist_id');
    if (!access.ok)
        return fail(access.status, access.error);
    const { data: row } = await access.supabase
        .from('clinical_notes')
        .select('comment')
        .eq('seeker_id', patientId)
        .maybeSingle();
    return ok({ comment: row?.comment ?? '' });
}
export async function updatePatientComment(therapistId, patientId, body) {
    const access = await assertAccess(therapistId, patientId, 'seeker_id, primary_therapist_id');
    if (!access.ok)
        return fail(access.status, access.error);
    const comment = asOptionalString(body?.comment) ?? '';
    const { data, error } = await access.supabase
        .from('clinical_notes')
        .upsert({ seeker_id: patientId, comment, updated_at: new Date().toISOString() }, { onConflict: 'seeker_id' })
        .select('comment')
        .single();
    if (error)
        return fail(500, error.message);
    return ok({ comment: data?.comment ?? comment });
}
// ---------------------------------------------------------------------------
// Insurance: GET / POST /api/therapist/patients/[patientId]/insurance
// ---------------------------------------------------------------------------
export async function listInsurancePolicies(therapistId, patientId) {
    const access = await assertAccess(therapistId, patientId);
    if (!access.ok)
        return fail(access.status, access.error);
    const { data: policies } = await access.supabase
        .from('billing_insurance_policies')
        .select('*')
        .eq('seeker_id', patientId)
        .order('is_primary', { ascending: false });
    return ok({ policies: policies ?? [] });
}
export async function createInsurancePolicy(therapistId, patientId, body) {
    const access = await assertAccess(therapistId, patientId);
    if (!access.ok)
        return fail(access.status, access.error);
    const { data: policy, error } = await access.supabase
        .from('billing_insurance_policies')
        .insert({
        seeker_id: patientId,
        provider: asOptionalString(body?.provider),
        policy_number: asOptionalString(body?.policyNumber),
        group_number: asOptionalString(body?.groupNumber),
        member_id: asOptionalString(body?.memberId),
        relationship_to_subscriber: asOptionalString(body?.relationshipToSubscriber),
        effective_start: asOptionalString(body?.effectiveStart),
        effective_end: asOptionalString(body?.effectiveEnd),
        is_primary: Boolean(body?.isPrimary),
        is_active: body?.isActive == null ? true : Boolean(body?.isActive),
    })
        .select('*')
        .single();
    if (error)
        return fail(500, error.message);
    return { ok: true, status: 201, data: { policy } };
}
// ---------------------------------------------------------------------------
// Insurance policy: PUT / DELETE /api/therapist/patients/[patientId]/insurance/[policyId]
// ---------------------------------------------------------------------------
export async function updateInsurancePolicy(therapistId, patientId, policyId, body) {
    const access = await assertAccess(therapistId, patientId);
    if (!access.ok)
        return fail(access.status, access.error);
    const update = {};
    const setIfDef = (key, val) => {
        if (val !== undefined)
            update[key] = val;
    };
    setIfDef('provider', asOptionalString(body?.provider) ?? undefined);
    setIfDef('policy_number', asOptionalString(body?.policyNumber) ?? undefined);
    setIfDef('group_number', asOptionalString(body?.groupNumber) ?? undefined);
    setIfDef('member_id', asOptionalString(body?.memberId) ?? undefined);
    setIfDef('relationship_to_subscriber', asOptionalString(body?.relationshipToSubscriber) ?? undefined);
    setIfDef('effective_start', asOptionalString(body?.effectiveStart) ?? undefined);
    setIfDef('effective_end', asOptionalString(body?.effectiveEnd) ?? undefined);
    if (body?.isPrimary != null)
        update.is_primary = Boolean(body.isPrimary);
    if (body?.isActive != null)
        update.is_active = Boolean(body.isActive);
    const { data: policy, error } = await access.supabase
        .from('billing_insurance_policies')
        .update(update)
        .eq('id', policyId)
        .eq('seeker_id', patientId)
        .select('*')
        .maybeSingle();
    if (error)
        return fail(500, error.message);
    if (!policy)
        return fail(404, 'Not found');
    return ok({ policy });
}
export async function deleteInsurancePolicy(therapistId, patientId, policyId) {
    const access = await assertAccess(therapistId, patientId);
    if (!access.ok)
        return fail(access.status, access.error);
    const { error, count } = await access.supabase
        .from('billing_insurance_policies')
        .delete({ count: 'exact' })
        .eq('id', policyId)
        .eq('seeker_id', patientId);
    if (error)
        return fail(500, error.message);
    if (!count)
        return fail(404, 'Not found');
    return ok({ success: true });
}
