import { z } from 'zod';
// Fields that live on the clinical-intake patient_records row.
export const PATIENT_RECORD_FIELDS = [
    'legal_first_name',
    'legal_last_name',
    'dob',
    'address_line1',
    'address_line2',
    'city',
    'state',
    'postal_code',
    'country',
    'mobile_phone_e164',
    'contact_email',
];
// Fields that live on user_profiles (identity / display).
export const USER_PROFILE_FIELDS = ['preferred_name', 'pronouns'];
export const acknowledgeTreatmentPlanSchema = z.object({
    planId: z.string().trim().min(1),
});
