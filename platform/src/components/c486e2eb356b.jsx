import { redirect } from 'next/navigation';
import { createClient, getUser } from '@/components/9a6b39502e62';
import { ReminderSettingsForm } from '@/components/5e9aae56d71e';
import { DEFAULT_BODY, DEFAULT_OFFSETS, DEFAULT_SUBJECT, MERGE_TAG_KEYS, } from '@/components/550c807f9a98';
export const dynamic = 'force-dynamic';
export default async function ReminderSettingsPage() {
    const user = await getUser();
    if (!user)
        redirect('/login');
    const supabase = await createClient();
    const { data: roleRow } = await supabase
        .from('user_roles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
    if (!roleRow || roleRow.role !== 'therapist') {
        redirect('/login');
    }
    const { data: existing } = await supabase
        .from('therapist_reminder_settings')
        .select('enabled, offsets_minutes, subject, body_md, updated_at')
        .eq('therapist_id', user.id)
        .maybeSingle();
    const initial = existing
        ? {
            enabled: existing.enabled,
            offsets_minutes: existing.offsets_minutes,
            subject: existing.subject,
            body_md: existing.body_md,
        }
        : {
            enabled: true,
            offsets_minutes: DEFAULT_OFFSETS,
            subject: DEFAULT_SUBJECT,
            body_md: DEFAULT_BODY,
        };
    return (<div className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-gray-900">Appointment reminders</h1>
        <p className="text-sm text-gray-500">
          Choose when reminder emails go out and customize the message your patients receive.
        </p>
      </header>

      <ReminderSettingsForm initial={initial} mergeTags={MERGE_TAG_KEYS}/>
    </div>);
}
