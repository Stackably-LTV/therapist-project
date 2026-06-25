import 'server-only';
import { createClient } from '@/components/9a6b39502e62';
import { ok, fail } from '@/components/7ff049787825';
import { DEFAULT_BODY, DEFAULT_OFFSETS, DEFAULT_SUBJECT, } from '@/components/550c807f9a98';
const SETTINGS_SELECT = 'therapist_id, enabled, offsets_minutes, subject, body_md, updated_at';
/** Read a therapist's reminder settings, falling back to defaults when none exist. */
export async function getReminderSettings(therapistId) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('therapist_reminder_settings')
        .select(SETTINGS_SELECT)
        .eq('therapist_id', therapistId)
        .maybeSingle();
    if (error)
        return fail(500, error.message);
    if (!data) {
        return ok({
            settings: {
                therapist_id: therapistId,
                enabled: true,
                offsets_minutes: DEFAULT_OFFSETS,
                subject: DEFAULT_SUBJECT,
                body_md: DEFAULT_BODY,
                updated_at: null,
            },
            isDefault: true,
        });
    }
    return ok({ settings: data, isDefault: false });
}
/** Upsert a therapist's reminder settings (offsets deduped + sorted descending). */
export async function updateReminderSettings(therapistId, parsed) {
    const supabase = await createClient();
    const offsets = Array.from(new Set(parsed.offsets_minutes)).sort((a, b) => b - a);
    const { data, error } = await supabase
        .from('therapist_reminder_settings')
        .upsert({
        therapist_id: therapistId,
        enabled: parsed.enabled,
        offsets_minutes: offsets,
        subject: parsed.subject.trim(),
        body_md: parsed.body_md,
    }, { onConflict: 'therapist_id' })
        .select(SETTINGS_SELECT)
        .single();
    if (error)
        return fail(500, error.message);
    return ok({ settings: data });
}
