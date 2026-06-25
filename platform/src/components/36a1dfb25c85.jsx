'use client';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/c0ebd3fbafc6';
import { Switch } from '@/components/395ec797588e';
import { Button } from '@/components/2795b661f080';
import { Input } from '@/components/c2f62fb0cb5e';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/1712d8a01fd3';
import { CalendarClock, Plus, Trash2 } from 'lucide-react';
const ALLOWED_DURATIONS = [30, 45, 50, 60, 90];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export default function BookingAvailabilityCard({ value, onChange, disabled }) {
    const [draftDay, setDraftDay] = useState(1);
    const [draftStart, setDraftStart] = useState('09:00');
    const [draftEnd, setDraftEnd] = useState('17:00');
    const set = (key, v) => onChange({ ...value, [key]: v });
    const addSlot = () => {
        if (!/^\d{2}:\d{2}$/.test(draftStart) || !/^\d{2}:\d{2}$/.test(draftEnd))
            return;
        if (draftStart >= draftEnd)
            return;
        const next = { dayOfWeek: draftDay, startTime: draftStart, endTime: draftEnd };
        const sorted = [...value.availability, next].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime));
        set('availability', sorted);
    };
    const removeSlot = (idx) => {
        set('availability', value.availability.filter((_, i) => i !== idx));
    };
    return (<Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-indigo-500"/>
          Booking & Availability
        </CardTitle>
        <CardDescription>Control how clients schedule sessions with you.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Toggles */}
        <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
          <div className="flex items-center justify-between gap-4 rounded-lg border border-transparent bg-background p-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">Allow clients to self-book</p>
              <p className="text-xs text-muted-foreground">
                If off, booking stays visible but disabled with a message CTA. Clients must request a consultation first.
              </p>
            </div>
            <Switch checked={value.allowSelfBooking} onCheckedChange={(checked) => set('allowSelfBooking', checked)} disabled={disabled}/>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border border-transparent bg-background p-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">Calendar visibility</p>
              <p className="text-xs text-muted-foreground">
                Controls whether seekers can see available time slots on your profile.
              </p>
            </div>
            <Switch checked={value.calendarVisible} onCheckedChange={(checked) => set('calendarVisible', checked)} disabled={disabled}/>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border border-transparent bg-background p-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">Default session length</p>
              <p className="text-xs text-muted-foreground">
                The slot length used when generating bookable times.
              </p>
            </div>
            <Select value={String(value.sessionDuration)} onValueChange={(v) => set('sessionDuration', Number(v))} disabled={disabled}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALLOWED_DURATIONS.map((d) => (<SelectItem key={d} value={String(d)}>
                    {d} min
                  </SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Weekly availability */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Weekly availability</p>
              <p className="text-xs text-muted-foreground">
                Add the windows you&apos;re open for sessions. Slots within these windows become bookable.
              </p>
            </div>
          </div>

          {value.availability.length === 0 ? (<div className="rounded-lg border border-dashed bg-muted/20 p-6 text-center text-sm text-muted-foreground">
              No availability set. Add a window below to start receiving bookings.
            </div>) : (<ul className="space-y-2 mb-3">
              {value.availability.map((slot, idx) => (<li key={`${slot.dayOfWeek}-${slot.startTime}-${slot.endTime}-${idx}`} className="flex items-center justify-between rounded-md border bg-background px-3 py-2 text-sm">
                  <span className="font-medium">{DAY_LABELS[slot.dayOfWeek]}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {slot.startTime} – {slot.endTime}
                  </span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeSlot(idx)} disabled={disabled} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="h-4 w-4"/>
                  </Button>
                </li>))}
            </ul>)}

          {/* Add new slot row */}
          <div className="flex flex-wrap items-end gap-2 rounded-lg border bg-muted/30 p-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Day</label>
              <Select value={String(draftDay)} onValueChange={(v) => setDraftDay(Number(v))} disabled={disabled}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAY_LABELS.map((label, i) => (<SelectItem key={i} value={String(i)}>
                      {label}
                    </SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Start</label>
              <Input type="time" value={draftStart} onChange={(e) => setDraftStart(e.target.value)} disabled={disabled} className="w-28"/>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">End</label>
              <Input type="time" value={draftEnd} onChange={(e) => setDraftEnd(e.target.value)} disabled={disabled} className="w-28"/>
            </div>
            <Button type="button" onClick={addSlot} disabled={disabled} className="ml-auto">
              <Plus className="h-4 w-4 mr-1"/>
              Add window
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>);
}
