// Server-only. Sends due appointment reminders based on per-therapist settings.
import { render } from '@react-email/render';
import AppointmentReminderEmail from '@/components/6f5afbdc91c4';
import { EmailService } from '@/components/b2a0b00fb250';
import { createServiceRoleClient } from '@/components/9a6b39502e62';
const APP_NAME = 'PsycheConnect';
const SUPPORT_EMAIL = process.env.RESEND_FROM_EMAIL || 'support@psychlink.pro';
// Window of tolerance in minutes around each offset target. Cron runs every 5 min,
// so a 6-min window guarantees coverage without re-firing (the unique log row blocks dupes).
const DEFAULT_WINDOW_MINUTES = 6;
function escapeHtml(input) {
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
// Tiny markdown subset: paragraphs (blank line), line breaks (single \n), bold **x**, links [t](u).
export function renderBodyHtml(markdown) {
    const escaped = escapeHtml(markdown);
    const paragraphs = escaped.split(/\n{2,}/).map((para) => {
        const withBreaks = para.replace(/\n/g, '<br/>');
        const withBold = withBreaks.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        const withLinks = withBold.replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" style="color:#667eea;text-decoration:underline">$1</a>');
        return `<p style="margin:0 0 14px 0;">${withLinks}</p>`;
    });
    return paragraphs.join('');
}
const TAG_RE = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
export function applyMergeTags(template, tags) {
    return template.replace(TAG_RE, (_, key) => {
        const value = tags[key];
        return typeof value === 'string' ? value : '';
    });
}
const VALID_REMINDER_STATUSES = new Set(['scheduled', 'confirmed', 'in_progress']);
export async function sendDueReminders(now = new Date()) {
    const supabase = createServiceRoleClient();
    const result = { considered: 0, sent: 0, skipped: 0, failed: 0, details: [] };
    const { data: settingsRows, error: settingsError } = await supabase
        .from('therapist_reminder_settings')
        .select('therapist_id, enabled, offsets_minutes, subject, body_md')
        .eq('enabled', true);
    if (settingsError) {
        console.error('[reminders] failed to load settings', settingsError);
        return result;
    }
    const settings = (settingsRows || []);
    if (settings.length === 0)
        return result;
    const allOffsets = new Set();
    for (const s of settings) {
        for (const o of s.offsets_minutes || []) {
            if (Number.isFinite(o) && o > 0)
                allOffsets.add(o);
        }
    }
    if (allOffsets.size === 0)
        return result;
    const therapistIds = settings.map((s) => s.therapist_id);
    const minOffset = Math.min(...allOffsets);
    const maxOffset = Math.max(...allOffsets);
    const windowStart = new Date(now.getTime() + (minOffset - DEFAULT_WINDOW_MINUTES) * 60_000);
    const windowEnd = new Date(now.getTime() + (maxOffset + DEFAULT_WINDOW_MINUTES) * 60_000);
    const { data: appointments, error: apptError } = await supabase
        .from('appointments')
        .select('id, seeker_id, therapist_id, scheduled_at, duration_minutes, status, telehealth_url')
        .in('therapist_id', therapistIds)
        .gte('scheduled_at', windowStart.toISOString())
        .lte('scheduled_at', windowEnd.toISOString());
    if (apptError) {
        console.error('[reminders] failed to load appointments', apptError);
        return result;
    }
    const candidateAppointments = (appointments || []);
    const eligible = candidateAppointments.filter((a) => VALID_REMINDER_STATUSES.has(a.status));
    if (eligible.length === 0)
        return result;
    const userIds = Array.from(new Set(eligible.flatMap((a) => [a.seeker_id, a.therapist_id]).filter(Boolean)));
    const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, full_name, preferred_name')
        .in('id', userIds);
    const profilesById = new Map((profiles || []).map((p) => [p.id, p]));
    // Resolve emails per-id via the auth admin API. We only need seekers (recipients).
    const seekerIds = Array.from(new Set(eligible.map((a) => a.seeker_id).filter(Boolean)));
    const emailById = new Map();
    await Promise.all(seekerIds.map(async (id) => {
        try {
            const { data } = await supabase.auth.admin.getUserById(id);
            const email = data?.user?.email;
            if (email)
                emailById.set(id, email);
        }
        catch (e) {
            console.error('[reminders] getUserById failed', { id, error: e });
        }
    }));
    const settingsByTherapist = new Map(settings.map((s) => [s.therapist_id, s]));
    const emailService = new EmailService();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || '';
    for (const appt of eligible) {
        const therapistSettings = settingsByTherapist.get(appt.therapist_id);
        if (!therapistSettings)
            continue;
        const apptTime = new Date(appt.scheduled_at).getTime();
        const offsetCandidates = (therapistSettings.offsets_minutes || []).filter((o) => {
            const target = apptTime - o * 60_000;
            const diffMinutes = Math.abs(now.getTime() - target) / 60_000;
            return diffMinutes <= DEFAULT_WINDOW_MINUTES;
        });
        if (offsetCandidates.length === 0)
            continue;
        const seekerEmail = emailById.get(appt.seeker_id);
        if (!seekerEmail)
            continue;
        const seekerProfile = profilesById.get(appt.seeker_id);
        const therapistProfile = profilesById.get(appt.therapist_id);
        const patientName = seekerProfile?.preferred_name?.trim() ||
            seekerProfile?.full_name?.trim() ||
            'there';
        const therapistName = therapistProfile?.full_name?.trim() || 'your therapist';
        const sessionDate = new Date(appt.scheduled_at);
        const tags = {
            patient_name: patientName,
            therapist_name: therapistName,
            appointment_time: sessionDate.toLocaleString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
            }),
            appointment_date: sessionDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
            }),
            appointment_time_only: sessionDate.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
            }),
            duration_minutes: String(appt.duration_minutes ?? ''),
            join_link: appt.telehealth_url || `${baseUrl}/seeker/sessions/${appt.id}`,
            app_name: APP_NAME,
        };
        for (const offsetMinutes of offsetCandidates) {
            result.considered += 1;
            const subject = applyMergeTags(therapistSettings.subject, tags);
            const body = applyMergeTags(therapistSettings.body_md, tags);
            const bodyHtml = renderBodyHtml(body);
            const { error: insertError } = await supabase
                .from('appointment_reminder_log')
                .insert({
                appointment_id: appt.id,
                offset_minutes: offsetMinutes,
                recipient_email: seekerEmail,
            });
            if (insertError) {
                if (insertError.code === '23505') {
                    result.skipped += 1;
                    result.details.push({
                        appointmentId: appt.id,
                        offsetMinutes,
                        status: 'skipped',
                        reason: 'already_sent',
                    });
                    continue;
                }
                result.failed += 1;
                result.details.push({
                    appointmentId: appt.id,
                    offsetMinutes,
                    status: 'failed',
                    reason: `log_insert_failed:${insertError.code || 'unknown'}`,
                });
                continue;
            }
            const html = await render(AppointmentReminderEmail({
                patientName,
                therapistName,
                appointmentTime: sessionDate,
                bodyHtml,
                subjectPreview: subject,
                appName: APP_NAME,
                supportEmail: SUPPORT_EMAIL,
            }));
            const sendResult = await emailService.sendEmail({
                to: seekerEmail,
                subject: subject || `Reminder: session with ${therapistName}`,
                html,
            });
            if (sendResult) {
                result.sent += 1;
                result.details.push({ appointmentId: appt.id, offsetMinutes, status: 'sent' });
            }
            else {
                result.failed += 1;
                result.details.push({
                    appointmentId: appt.id,
                    offsetMinutes,
                    status: 'failed',
                    reason: 'email_send_failed',
                });
                await supabase
                    .from('appointment_reminder_log')
                    .delete()
                    .eq('appointment_id', appt.id)
                    .eq('offset_minutes', offsetMinutes);
            }
        }
    }
    return result;
}
export const DEFAULT_OFFSETS = [1440, 60];
export const DEFAULT_SUBJECT = 'Reminder: your session with {{therapist_name}}';
export const DEFAULT_BODY = `Hi {{patient_name}},

This is a friendly reminder of your upcoming session with {{therapist_name}} on {{appointment_time}}.

If you need to reschedule, please reply to this email or contact us directly.

See you soon.`;
export const MERGE_TAG_KEYS = [
    'patient_name',
    'therapist_name',
    'appointment_time',
    'appointment_date',
    'appointment_time_only',
    'duration_minutes',
    'join_link',
    'app_name',
];
