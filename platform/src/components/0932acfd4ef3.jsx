'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Ban, CalendarDays, ChevronLeft, ChevronRight, Clock, Plus, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/2795b661f080';
import { Card, CardContent } from '@/components/c0ebd3fbafc6';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, } from '@/components/ba221113eac7';
import { Input } from '@/components/c2f62fb0cb5e';
import { Label } from '@/components/78846397f3ca';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/1712d8a01fd3';
import { normalizeBlock, normalizeSession, } from '@/components/9e15c968ce4c';
import { addDays, getSessionsForDay, getWeekDays, startOfWeek } from '@/components/ac83874a4272';
import { CalendarLegend } from '@/components/ab483e0cb927';
import { TherapistWeekGrid } from '@/components/c78a179ca587';
import { TherapistDayTimeline } from '@/components/46d7fa9ffb2e';
import { TherapistMonthOverview } from '@/components/0599425398b9';
function toInputDateTime(date) {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
// Mac Safari has poor support for datetime-local pickers (no visible icon; day clicks
// aren't committed until explicit close). Split into date + time inputs which both
// show native pickers consistently and commit on Enter/blur.
function DateTimeField({ value, onChange, min, onCommit, }) {
    const [datePart, timePart] = value ? value.split('T') : ['', ''];
    const minDate = min ? min.split('T')[0] : undefined;
    const minTime = min && datePart === min.split('T')[0] ? min.split('T')[1] : undefined;
    const handleDate = (d) => {
        if (!d)
            return onChange('');
        const t = timePart || '09:00';
        onChange(`${d}T${t}`);
    };
    const handleTime = (t) => {
        if (!datePart) {
            const today = new Date();
            const iso = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 10);
            onChange(`${iso}T${t}`);
            return;
        }
        onChange(`${datePart}T${t}`);
    };
    return (<div className="grid grid-cols-2 gap-2">
      <Input type="date" value={datePart} min={minDate} onChange={(e) => handleDate(e.target.value)} onBlur={() => onCommit?.()} onKeyDown={(e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.target.blur();
                onCommit?.();
            }
        }}/>
      <Input type="time" step={900} value={timePart} min={minTime} onChange={(e) => handleTime(e.target.value)} onBlur={() => onCommit?.()} onKeyDown={(e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.target.blur();
                onCommit?.();
            }
        }}/>
    </div>);
}
function roundUpToQuarterHour(date) {
    const rounded = new Date(date);
    rounded.setSeconds(0, 0);
    const minutes = rounded.getMinutes();
    const nextQuarter = Math.ceil(minutes / 15) * 15;
    rounded.setMinutes(nextQuarter);
    return rounded;
}
function getMinimumScheduleDate() {
    return roundUpToQuarterHour(new Date());
}
function formatHeaderDate(mode, selectedDate) {
    if (mode === 'day') {
        return selectedDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
    }
    if (mode === 'month') {
        return selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    const weekStart = startOfWeek(selectedDate);
    const weekEnd = addDays(weekStart, 6);
    return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}
export default function TherapistCalendarShell({ sessions, blocks, clients, }) {
    const [viewMode, setViewMode] = useState('week');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const minimumDateTime = toInputDateTime(getMinimumScheduleDate());
    const [sessionsState, setSessionsState] = useState(() => sessions.map(normalizeSession));
    const [blocksState, setBlocksState] = useState(() => blocks.map(normalizeBlock));
    const [clientsState, setClientsState] = useState(() => clients);
    const [editingSession, setEditingSession] = useState(null);
    const [savingEdit, setSavingEdit] = useState(false);
    const [editForm, setEditForm] = useState({
        scheduledAt: '',
        durationMinutes: 60,
        sessionType: 'therapy',
        locationType: 'telehealth',
        locationLabel: '',
        telehealthUrl: '',
    });
    const [newBlockOpen, setNewBlockOpen] = useState(false);
    const [creatingBlock, setCreatingBlock] = useState(false);
    const [blockForm, setBlockForm] = useState({
        startAt: '',
        endAt: '',
        kind: 'unavailable',
        title: '',
        notes: '',
    });
    const [createSessionOpen, setCreateSessionOpen] = useState(false);
    const [creatingSession, setCreatingSession] = useState(false);
    const [createForm, setCreateForm] = useState({
        clientId: '',
        inviteName: '',
        inviteEmail: '',
        scheduledAt: '',
        durationMinutes: 60,
        sessionType: 'therapy',
        locationType: 'telehealth',
        locationLabel: '',
        telehealthUrl: '',
        autoCreateClient: true,
    });
    const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
    const today = new Date();
    const todayCount = getSessionsForDay(sessionsState, today).length;
    const upcomingCount = sessionsState.filter((session) => session.start >= today).length;
    const openEdit = (session) => {
        setEditingSession(session);
        setEditForm({
            scheduledAt: toInputDateTime(session.start),
            durationMinutes: session.durationMinutes,
            sessionType: session.sessionType,
            locationType: session.locationType,
            locationLabel: session.locationLabel || '',
            telehealthUrl: session.telehealthUrl || '',
        });
    };
    const saveSessionEdit = async (overrideReason) => {
        if (!editingSession)
            return;
        if (!editForm.scheduledAt)
            return toast.error('Pick a date and time');
        setSavingEdit(true);
        try {
            const nextStart = new Date(editForm.scheduledAt);
            if (Number.isNaN(nextStart.getTime()))
                throw new Error('Invalid date and time');
            if (nextStart.getTime() < Date.now())
                throw new Error('Session start time cannot be in the past');
            const nextDuration = editForm.durationMinutes === 30 || editForm.durationMinutes === 45 ? editForm.durationMinutes : 60;
            const res = await fetch(`/api/therapist/sessions/${editingSession.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scheduledAt: nextStart.toISOString(),
                    durationMinutes: nextDuration,
                    sessionType: editForm.sessionType,
                    locationType: editForm.locationType,
                    locationLabel: editForm.locationLabel,
                    telehealthUrl: editForm.telehealthUrl,
                    conflictOverrideReason: overrideReason,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.status === 409 && data?.requiresOverride) {
                const ok = window.confirm('This conflicts with blocked time. Schedule anyway?');
                if (ok)
                    await saveSessionEdit('Override confirmed');
                return;
            }
            if (!res.ok)
                throw new Error(data.error || 'Failed to update session');
            setSessionsState((prev) => prev.map((session) => session.id === editingSession.id
                ? {
                    ...session,
                    start: nextStart,
                    end: new Date(nextStart.getTime() + nextDuration * 60000),
                    durationMinutes: nextDuration,
                    sessionType: editForm.sessionType,
                    locationType: editForm.locationType,
                    locationLabel: editForm.locationLabel || null,
                    telehealthUrl: editForm.telehealthUrl || null,
                }
                : session));
            toast.success('Session updated');
            setEditingSession(null);
        }
        catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update session');
        }
        finally {
            setSavingEdit(false);
        }
    };
    const createBlock = async () => {
        if (!blockForm.startAt || !blockForm.endAt) {
            toast.error('Start and end are required');
            return;
        }
        setCreatingBlock(true);
        try {
            const startAt = new Date(blockForm.startAt);
            const endAt = new Date(blockForm.endAt);
            if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
                throw new Error('Invalid start or end date');
            }
            if (startAt.getTime() < Date.now()) {
                throw new Error('Block start time cannot be in the past');
            }
            if (endAt <= startAt) {
                throw new Error('Block end time must be after start time');
            }
            const res = await fetch('/api/therapist/calendar/blocks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startAt: startAt.toISOString(),
                    endAt: endAt.toISOString(),
                    kind: blockForm.kind,
                    title: blockForm.title,
                    notes: blockForm.notes,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data.error || 'Failed to create block');
            const created = data?.block;
            if (created?.id) {
                setBlocksState((prev) => [
                    ...prev,
                    normalizeBlock({
                        id: String(created.id),
                        startAt: String(created.start_at ?? created.startAt ?? startAt.toISOString()),
                        endAt: String(created.end_at ?? created.endAt ?? endAt.toISOString()),
                        kind: String(created.kind ?? blockForm.kind),
                        title: created.title ? String(created.title) : null,
                        notes: created.notes ? String(created.notes) : null,
                    }),
                ]);
            }
            else {
                setBlocksState((prev) => [
                    ...prev,
                    {
                        id: `temp-${Date.now()}`,
                        start: startAt,
                        end: endAt,
                        kind: blockForm.kind === 'event' ? 'event' : 'unavailable',
                        title: blockForm.title || null,
                        notes: blockForm.notes || null,
                    },
                ]);
            }
            setNewBlockOpen(false);
            setBlockForm({ startAt: '', endAt: '', kind: 'unavailable', title: '', notes: '' });
            toast.success(blockForm.kind === 'event' ? 'Event scheduled' : 'Time blocked');
        }
        catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to create block');
        }
        finally {
            setCreatingBlock(false);
        }
    };
    const openCreateSessionAt = (date) => {
        const minimumDate = getMinimumScheduleDate();
        const nextDate = date.getTime() < minimumDate.getTime() ? minimumDate : date;
        setSelectedDate(nextDate);
        setCreateForm((prev) => ({
            ...prev,
            clientId: prev.clientId || clientsState[0]?.id || '',
            scheduledAt: toInputDateTime(nextDate),
            durationMinutes: prev.durationMinutes === 30 || prev.durationMinutes === 45 ? prev.durationMinutes : 60,
        }));
        setCreateSessionOpen(true);
    };
    const selectedClient = clientsState.find((client) => client.id === createForm.clientId);
    const createSessionFromCalendar = async (overrideReason) => {
        if (!createForm.clientId && !createForm.inviteEmail.trim()) {
            toast.error('Select a client or enter invite email');
            return;
        }
        if (!createForm.scheduledAt) {
            toast.error('Pick a date and time');
            return;
        }
        setCreatingSession(true);
        try {
            let patientId = createForm.clientId;
            if (!patientId && createForm.inviteEmail.trim()) {
                const inviteRes = await fetch('/api/therapist/patients/link', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: createForm.inviteEmail.trim(),
                        name: createForm.inviteName.trim() || null,
                    }),
                });
                const inviteData = await inviteRes.json().catch(() => ({}));
                if (!inviteRes.ok)
                    throw new Error(inviteData.error || 'Failed to invite client');
                const invitedClient = inviteData?.client;
                if (!invitedClient?.id)
                    throw new Error('Client invite did not return a usable client');
                patientId = String(invitedClient.id);
                const invitedName = String(invitedClient.name || createForm.inviteName.trim() || 'Client');
                const invitedEmail = String(invitedClient.email || createForm.inviteEmail.trim());
                setClientsState((prev) => {
                    if (prev.some((item) => item.id === patientId)) {
                        return prev.map((item) => item.id === patientId
                            ? { ...item, name: invitedName, email: invitedEmail, isClient: true, source: 'client' }
                            : item);
                    }
                    return [...prev, { id: patientId, name: invitedName, email: invitedEmail, isClient: true, source: 'client' }];
                });
                setCreateForm((prev) => ({ ...prev, clientId: patientId, inviteEmail: '', inviteName: '' }));
                if (inviteData?.inviteSent) {
                    toast.success('Invite sent and client record created');
                }
            }
            if (!patientId)
                throw new Error('Unable to resolve client');
            if (selectedClient && !selectedClient.isClient) {
                if (!createForm.autoCreateClient) {
                    throw new Error('Enable auto-create client or select an existing client.');
                }
                const linkRes = await fetch('/api/therapist/patients/link', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: selectedClient.id }),
                });
                const linkData = await linkRes.json().catch(() => ({}));
                if (!linkRes.ok)
                    throw new Error(linkData.error || 'Failed to create client from contact');
                patientId = String(linkData?.client?.id || selectedClient.id);
                setClientsState((prev) => prev.map((client) => client.id === patientId
                    ? {
                        ...client,
                        isClient: true,
                        source: 'client',
                    }
                    : client));
            }
            const startAt = new Date(createForm.scheduledAt);
            if (Number.isNaN(startAt.getTime()))
                throw new Error('Invalid date and time');
            if (startAt.getTime() < Date.now())
                throw new Error('Session start time cannot be in the past');
            const duration = createForm.durationMinutes === 30 || createForm.durationMinutes === 45 ? createForm.durationMinutes : 60;
            const res = await fetch('/api/therapist/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patientId,
                    scheduledAt: startAt.toISOString(),
                    durationMinutes: duration,
                    sessionType: createForm.sessionType,
                    locationType: createForm.locationType,
                    locationLabel: createForm.locationLabel || null,
                    telehealthUrl: createForm.telehealthUrl || null,
                    conflictOverrideReason: overrideReason,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.status === 409 && data?.requiresOverride) {
                const ok = window.confirm('This conflicts with blocked time. Schedule anyway?');
                if (ok)
                    await createSessionFromCalendar('Override confirmed');
                return;
            }
            if (!res.ok)
                throw new Error(data.error || 'Failed to schedule session');
            const session = data?.session || {};
            const scheduledAt = session.scheduledAt ?? session.scheduled_at ?? startAt.toISOString();
            const durationMinutes = Number(session.durationMinutes ?? session.duration_minutes ?? duration);
            const client = clientsState.find((item) => item.id === patientId);
            setSessionsState((prev) => [
                ...prev,
                normalizeSession({
                    id: String(session.id),
                    scheduledAt: String(scheduledAt),
                    durationMinutes,
                    status: String(session.status ?? 'scheduled'),
                    sessionType: String(session.sessionType ?? session.session_type ?? createForm.sessionType),
                    locationType: String(session.locationType ?? session.location_type ?? createForm.locationType),
                    locationLabel: session.locationLabel ?? session.location_label ?? createForm.locationLabel ?? null,
                    telehealthUrl: session.telehealthUrl ?? session.telehealth_url ?? createForm.telehealthUrl ?? null,
                    client: client
                        ? { id: client.id, name: client.name, email: client.email }
                        : { id: patientId, name: 'Client', email: '' },
                })
            ]);
            setCreateSessionOpen(false);
            toast.success('Session scheduled');
        }
        catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to schedule session');
        }
        finally {
            setCreatingSession(false);
        }
    };
    const moveDate = (direction) => {
        if (viewMode === 'month')
            setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + direction, prev.getDate()));
        else if (viewMode === 'week')
            setSelectedDate((prev) => addDays(prev, direction * 7));
        else
            setSelectedDate((prev) => addDays(prev, direction));
    };
    return (<div className="mx-auto max-w-[1500px] space-y-5 pb-10">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Managed Schedule</p>
          <h1 className="text-2xl font-bold text-slate-900">Therapist Calendar</h1>
          <p className="text-sm text-slate-600">Calendar-first planning for workload, gaps, and conflicts.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => openCreateSessionAt(getMinimumScheduleDate())}>
            <Plus className="h-4 w-4 text-indigo-600"/> Schedule session
          </Button>
          <Dialog open={newBlockOpen} onOpenChange={setNewBlockOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Ban className="h-4 w-4 text-amber-500"/> Block time
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px]">
              <DialogHeader>
                <DialogTitle>Create Calendar Block</DialogTitle>
                <DialogDescription>Protect focus time, meetings, or unavailable windows.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Block type</Label>
                  <Select value={blockForm.kind} onValueChange={(value) => setBlockForm((prev) => ({ ...prev, kind: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unavailable">Unavailable</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label>Start</Label>
                    <DateTimeField value={blockForm.startAt} min={minimumDateTime} onChange={(v) => setBlockForm((prev) => ({ ...prev, startAt: v }))}/>
                  </div>
                  <div className="grid gap-2">
                    <Label>End</Label>
                    <DateTimeField value={blockForm.endAt} min={minimumDateTime} onChange={(v) => setBlockForm((prev) => ({ ...prev, endAt: v }))}/>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Title</Label>
                  <Input value={blockForm.title} onChange={(e) => setBlockForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Optional"/>
                </div>
                <div className="grid gap-2">
                  <Label>Notes</Label>
                  <Input value={blockForm.notes} onChange={(e) => setBlockForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Optional"/>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => void createBlock()} disabled={creatingBlock}>
                  {creatingBlock ? 'Saving...' : 'Save block'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button asChild className="gap-2">
            <Link href="/therapist/profile?tab=availability">
              <Settings2 className="h-4 w-4"/> Manage availability
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">Today</p>
            <p className="text-2xl font-bold text-slate-900">{todayCount}</p>
            <p className="text-xs text-slate-600">Sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">Upcoming</p>
            <p className="text-2xl font-bold text-slate-900">{upcomingCount}</p>
            <p className="text-xs text-slate-600">Booked sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">Calendar blocks</p>
            <p className="text-2xl font-bold text-slate-900">{blocksState.length}</p>
            <p className="text-xs text-slate-600">Protected windows</p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => moveDate(-1)} aria-label="Previous">
              <ChevronLeft className="h-4 w-4"/>
            </Button>
            <Button variant="outline" size="icon" onClick={() => moveDate(1)} aria-label="Next">
              <ChevronRight className="h-4 w-4"/>
            </Button>
            <Button variant="ghost" onClick={() => setSelectedDate(new Date())}>
              Today
            </Button>
            <span className="ml-1 text-sm font-semibold text-slate-900">{formatHeaderDate(viewMode, selectedDate)}</span>
          </div>
          <div className="inline-flex items-center rounded-lg border border-slate-200 p-1" role="tablist" aria-label="Calendar view">
            {['week', 'day', 'month'].map((mode) => (<button key={mode} role="tab" aria-selected={viewMode === mode} className={`rounded-md px-3 py-1.5 text-sm capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${viewMode === mode ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`} onClick={() => setViewMode(mode)}>
                {mode}
              </button>))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {viewMode === 'week' ? (<TherapistWeekGrid weekDays={weekDays} sessions={sessionsState} blocks={blocksState} onEditSession={openEdit} onSelectDay={(day) => setSelectedDate(day)} onEmptySlotClick={openCreateSessionAt} selectedDate={selectedDate}/>) : null}
        {viewMode === 'day' ? (<TherapistDayTimeline date={selectedDate} sessions={sessionsState} blocks={blocksState} onEditSession={openEdit} onEmptySlotClick={openCreateSessionAt}/>) : null}
        {viewMode === 'month' ? (<TherapistMonthOverview selectedDate={selectedDate} onSelectDate={(day) => {
                setSelectedDate(day);
                setViewMode('day');
            }} sessions={sessionsState} blocks={blocksState}/>) : null}
      </div>

      <CalendarLegend />

      <Dialog open={createSessionOpen} onOpenChange={setCreateSessionOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Schedule session</DialogTitle>
            <DialogDescription>
              Click a time slot to prefill start time, then pick a client.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Client</Label>
              <Select value={createForm.clientId} onValueChange={(value) => setCreateForm((prev) => ({ ...prev, clientId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client or message contact"/>
                </SelectTrigger>
                <SelectContent>
                  {clientsState.length === 0 ? (<SelectItem value="none" disabled>
                      No clients or message contacts found
                    </SelectItem>) : (clientsState.map((client) => (<SelectItem key={client.id} value={client.id}>
                        {client.name}
                        {client.isClient ? '' : ' (message contact)'}
                      </SelectItem>)))}
                </SelectContent>
              </Select>
              {selectedClient && !selectedClient.isClient ? (<label className="flex items-center gap-2 text-xs text-slate-700">
                  <input type="checkbox" checked={createForm.autoCreateClient} onChange={(event) => setCreateForm((prev) => ({ ...prev, autoCreateClient: event.target.checked }))}/>
                  Auto-create this message contact as a client before scheduling
                </label>) : null}
            </div>
            <div className="grid gap-2 rounded-lg border border-slate-200 p-3">
              <Label className="text-xs text-slate-600">Or invite new client by email</Label>
              <div className="grid grid-cols-2 gap-3">
                <Input value={createForm.inviteName} onChange={(e) => setCreateForm((prev) => ({ ...prev, inviteName: e.target.value }))} placeholder="Full name (optional)"/>
                <Input type="email" value={createForm.inviteEmail} onChange={(e) => setCreateForm((prev) => ({ ...prev, inviteEmail: e.target.value }))} placeholder="client@email.com"/>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Date and start time</Label>
                <DateTimeField value={createForm.scheduledAt} min={minimumDateTime} onChange={(v) => setCreateForm((prev) => ({ ...prev, scheduledAt: v }))}/>
              </div>
              <div className="grid gap-2">
                <Label>Duration</Label>
                <Select value={String(createForm.durationMinutes)} onValueChange={(value) => setCreateForm((prev) => ({ ...prev, durationMinutes: Number(value) }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[30, 45, 60].map((minutes) => (<SelectItem key={minutes} value={String(minutes)}>
                        {minutes} minutes
                      </SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Session type</Label>
                <Select value={createForm.sessionType} onValueChange={(value) => setCreateForm((prev) => ({ ...prev, sessionType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="therapy">Therapy</SelectItem>
                    <SelectItem value="initial_intake_90">Initial intake</SelectItem>
                    <SelectItem value="group_therapy">Group therapy</SelectItem>
                    <SelectItem value="consultation">Consultation</SelectItem>
                    <SelectItem value="intake">Intake</SelectItem>
                    <SelectItem value="psych_eval">Psych eval</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Location type</Label>
                <Select value={createForm.locationType} onValueChange={(value) => setCreateForm((prev) => ({ ...prev, locationType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="telehealth">Telehealth</SelectItem>
                    <SelectItem value="in_person">In person</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Location details</Label>
              <Input value={createForm.locationLabel} onChange={(e) => setCreateForm((prev) => ({ ...prev, locationLabel: e.target.value }))} placeholder="Office room or address (optional)"/>
            </div>
            {createForm.locationType === 'telehealth' ? (<div className="grid gap-2">
                <Label>Telehealth URL</Label>
                <Input value={createForm.telehealthUrl} onChange={(e) => setCreateForm((prev) => ({ ...prev, telehealthUrl: e.target.value }))} placeholder="https://..."/>
              </div>) : null}
          </div>
          <DialogFooter>
            <Button onClick={() => void createSessionFromCalendar()} disabled={creatingSession}>
              {creatingSession ? 'Scheduling...' : 'Schedule session'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingSession)} onOpenChange={(open) => !open && setEditingSession(null)}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Edit Session</DialogTitle>
            <DialogDescription>Update scheduling details and duration.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Date and start time</Label>
              <DateTimeField value={editForm.scheduledAt} min={minimumDateTime} onChange={(v) => setEditForm((prev) => ({ ...prev, scheduledAt: v }))}/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Duration</Label>
                <Select value={String(editForm.durationMinutes)} onValueChange={(value) => setEditForm((prev) => ({ ...prev, durationMinutes: Number(value) }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[30, 45, 60].map((minutes) => (<SelectItem key={minutes} value={String(minutes)}>
                        {minutes} minutes
                      </SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Location type</Label>
                <Select value={editForm.locationType} onValueChange={(value) => setEditForm((prev) => ({ ...prev, locationType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="telehealth">Telehealth</SelectItem>
                    <SelectItem value="in_person">In person</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Session type</Label>
              <Select value={editForm.sessionType} onValueChange={(value) => setEditForm((prev) => ({ ...prev, sessionType: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="therapy">Therapy</SelectItem>
                  <SelectItem value="initial_intake_90">Initial intake</SelectItem>
                  <SelectItem value="group_therapy">Group therapy</SelectItem>
                  <SelectItem value="consultation">Consultation</SelectItem>
                  <SelectItem value="intake">Intake</SelectItem>
                  <SelectItem value="psych_eval">Psych eval</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Location label or URL</Label>
              <Input value={editForm.locationType === 'telehealth' ? editForm.telehealthUrl : editForm.locationLabel} onChange={(e) => {
            if (editForm.locationType === 'telehealth') {
                setEditForm((prev) => ({ ...prev, telehealthUrl: e.target.value }));
            }
            else {
                setEditForm((prev) => ({ ...prev, locationLabel: e.target.value }));
            }
        }} placeholder={editForm.locationType === 'telehealth' ? 'https://...' : 'Room or address'}/>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            {editingSession ? (<Button asChild variant="outline" className="gap-2">
                <Link href={`/therapist/clients/${editingSession.client?.id}?tab=notes&session=${editingSession.id}`}>
                  Write note for this session
                </Link>
              </Button>) : null}
            <Button onClick={() => void saveSessionEdit()} disabled={savingEdit} className="gap-2">
              <Clock className="h-4 w-4"/>
              {savingEdit ? 'Saving...' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button type="button" className="fixed bottom-6 right-6 h-12 rounded-full px-4 shadow-lg" onClick={() => setNewBlockOpen(true)}>
        <Plus className="mr-1 h-4 w-4"/>
        Block
      </Button>

      <div className="sr-only" aria-live="polite">
        <CalendarDays className="h-4 w-4"/>
      </div>
    </div>);
}
