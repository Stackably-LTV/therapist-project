'use client';
import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/2795b661f080';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/c0ebd3fbafc6';
import { Input } from '@/components/c2f62fb0cb5e';
import { Label } from '@/components/78846397f3ca';
import { Switch } from '@/components/395ec797588e';
import { Textarea } from '@/components/e1d2ad49fd73';
import { Badge } from '@/components/30348591d689';
import { Plus, X } from 'lucide-react';
const PRESET_OFFSETS = [
    { value: 15, label: '15 min' },
    { value: 60, label: '1 hour' },
    { value: 180, label: '3 hours' },
    { value: 1440, label: '1 day' },
    { value: 2880, label: '2 days' },
    { value: 10080, label: '1 week' },
];
function offsetLabel(minutes) {
    const preset = PRESET_OFFSETS.find((p) => p.value === minutes);
    if (preset)
        return preset.label;
    if (minutes % 1440 === 0)
        return `${minutes / 1440} day${minutes / 1440 === 1 ? '' : 's'}`;
    if (minutes % 60 === 0)
        return `${minutes / 60} hour${minutes / 60 === 1 ? '' : 's'}`;
    return `${minutes} min`;
}
export function ReminderSettingsForm({ initial, mergeTags, }) {
    const [enabled, setEnabled] = useState(initial.enabled);
    const [offsets, setOffsets] = useState([...new Set(initial.offsets_minutes)].sort((a, b) => b - a));
    const [subject, setSubject] = useState(initial.subject);
    const [body, setBody] = useState(initial.body_md);
    const [customMinutes, setCustomMinutes] = useState('');
    const [saving, setSaving] = useState(false);
    const bodyRef = useRef(null);
    const sortedOffsets = useMemo(() => [...offsets].sort((a, b) => b - a), [offsets]);
    const addOffset = (minutes) => {
        if (!Number.isFinite(minutes) || minutes < 5 || minutes > 20160) {
            toast.error('Offset must be between 5 minutes and 14 days');
            return;
        }
        setOffsets((prev) => (prev.includes(minutes) ? prev : [...prev, minutes].sort((a, b) => b - a)));
    };
    const removeOffset = (minutes) => {
        setOffsets((prev) => prev.filter((m) => m !== minutes));
    };
    const insertTag = (tag) => {
        const el = bodyRef.current;
        const insertion = `{{${tag}}}`;
        if (!el) {
            setBody((prev) => `${prev}${insertion}`);
            return;
        }
        const start = el.selectionStart ?? body.length;
        const end = el.selectionEnd ?? body.length;
        const next = body.slice(0, start) + insertion + body.slice(end);
        setBody(next);
        requestAnimationFrame(() => {
            el.focus();
            const pos = start + insertion.length;
            el.setSelectionRange(pos, pos);
        });
    };
    const save = async () => {
        if (offsets.length === 0 && enabled) {
            toast.error('Add at least one reminder offset, or disable reminders.');
            return;
        }
        setSaving(true);
        try {
            const res = await fetch('/api/therapist/reminder-settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    enabled,
                    offsets_minutes: sortedOffsets,
                    subject: subject.trim(),
                    body_md: body,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data?.error || 'Failed to save');
            toast.success('Reminder settings saved');
        }
        catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to save');
        }
        finally {
            setSaving(false);
        }
    };
    return (<div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg">
            <span>Send reminders</span>
            <div className="flex items-center gap-2">
              <Switch checked={enabled} onCheckedChange={setEnabled} id="reminders-enabled"/>
              <Label htmlFor="reminders-enabled" className="text-sm font-normal text-gray-600">
                {enabled ? 'On' : 'Off'}
              </Label>
            </div>
          </CardTitle>
          <CardDescription>
            When on, every confirmed appointment gets reminder emails at the offsets you choose.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">When to send</CardTitle>
          <CardDescription>Pick one or more offsets before each appointment.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {PRESET_OFFSETS.map((p) => {
            const active = offsets.includes(p.value);
            return (<button key={p.value} type="button" onClick={() => (active ? removeOffset(p.value) : addOffset(p.value))} className={`rounded-full border px-3 py-1.5 text-sm transition ${active
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}>
                  {p.label}
                </button>);
        })}
          </div>

          <div className="flex items-end gap-2">
            <div className="grid gap-1.5">
              <Label className="text-xs text-gray-600">Custom (minutes before)</Label>
              <Input type="number" min={5} max={20160} value={customMinutes} onChange={(e) => setCustomMinutes(e.target.value)} placeholder="e.g. 240" className="w-44"/>
            </div>
            <Button type="button" variant="outline" onClick={() => {
            const n = Number(customMinutes);
            if (Number.isFinite(n) && n > 0) {
                addOffset(n);
                setCustomMinutes('');
            }
        }} className="gap-1.5">
              <Plus className="h-4 w-4"/>
              Add
            </Button>
          </div>

          {sortedOffsets.length > 0 ? (<div className="rounded-lg border bg-gray-50 p-3">
              <div className="mb-2 text-xs font-medium text-gray-600">Active offsets</div>
              <div className="flex flex-wrap gap-2">
                {sortedOffsets.map((m) => (<Badge key={m} variant="secondary" className="gap-1.5 px-2 py-1 text-sm">
                    {offsetLabel(m)} before
                    <button type="button" onClick={() => removeOffset(m)} className="text-gray-500 hover:text-red-600" aria-label={`Remove ${offsetLabel(m)}`}>
                      <X className="h-3 w-3"/>
                    </button>
                  </Badge>))}
              </div>
            </div>) : (<div className="rounded-lg border border-dashed bg-gray-50 p-3 text-sm text-gray-500">
              No reminders scheduled. Pick a preset above or add a custom offset.
            </div>)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Message</CardTitle>
          <CardDescription>
            Use merge tags to personalize each email. Click a tag to insert it at your cursor.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="reminder-subject">Subject</Label>
            <Input id="reminder-subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} placeholder="Reminder: your session with {{therapist_name}}"/>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="reminder-body">Body</Label>
            <div className="flex flex-wrap gap-1.5">
              {mergeTags.map((tag) => (<button key={tag} type="button" onClick={() => insertTag(tag)} className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-mono text-gray-700 hover:bg-gray-50" title={`Insert {{${tag}}}`}>
                  {`{{${tag}}}`}
                </button>))}
            </div>
            <Textarea id="reminder-body" ref={bodyRef} value={body} onChange={(e) => setBody(e.target.value)} rows={10} maxLength={10_000} className="font-mono text-sm"/>
            <p className="text-xs text-gray-500">
              Plain text or simple markdown (paragraphs, **bold**, [links](https://…)).
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="min-w-32">
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </div>);
}
