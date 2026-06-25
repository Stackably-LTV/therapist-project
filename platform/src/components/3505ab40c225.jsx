'use client';
import { Input } from '@/components/c2f62fb0cb5e';
import { Textarea } from '@/components/e1d2ad49fd73';
import { Label } from '@/components/78846397f3ca';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/1712d8a01fd3';
import { PROGRESS_MSE_FIELDS, PROGRESS_MSE_OPTIONS, } from '@/components/4fe1b027890c';
export function ProgressNoteEditor({ value, onChange, patientDisplay, }) {
    const update = (patch) => onChange({ ...value, ...patch });
    const updateMeta = (patch) => update({ meta: { ...value.meta, ...patch } });
    const updateMse = (field, v) => update({ mentalStatus: { ...value.mentalStatus, [field]: v } });
    return (<div className="space-y-6">
      <section className="rounded-xl border bg-white p-4">
        <h3 className="mb-3 font-semibold text-gray-900">Session information</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label>Patient</Label>
            <Input value={patientDisplay?.name || ''} readOnly className="bg-gray-50"/>
          </div>
          <div className="grid gap-1.5">
            <Label>Clinician</Label>
            <Input value={value.meta.clinicianName || ''} onChange={(e) => updateMeta({ clinicianName: e.target.value })}/>
          </div>
          <div className="grid gap-1.5">
            <Label>Start</Label>
            <Input type="datetime-local" value={value.meta.startAt ? value.meta.startAt.slice(0, 16) : ''} onChange={(e) => updateMeta({ startAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })}/>
          </div>
          <div className="grid gap-1.5">
            <Label>End</Label>
            <Input type="datetime-local" value={value.meta.endAt ? value.meta.endAt.slice(0, 16) : ''} onChange={(e) => updateMeta({ endAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })}/>
          </div>
          <div className="grid gap-1.5">
            <Label>Service code</Label>
            <Input value={value.meta.serviceCode || ''} onChange={(e) => updateMeta({ serviceCode: e.target.value })} placeholder="e.g. 90834"/>
          </div>
          <div className="grid gap-1.5">
            <Label>Location</Label>
            <Input value={value.meta.location || ''} onChange={(e) => updateMeta({ location: e.target.value })} placeholder="Telehealth / office"/>
          </div>
          <div className="grid gap-1.5">
            <Label>Duration (minutes)</Label>
            <Input type="number" value={value.meta.durationMinutes ?? ''} onChange={(e) => updateMeta({ durationMinutes: e.target.value ? Number(e.target.value) : undefined })}/>
          </div>
          <div className="grid gap-1.5">
            <Label>Participants</Label>
            <Input value={value.meta.participants || ''} onChange={(e) => updateMeta({ participants: e.target.value })} placeholder="Patient + ..."/>
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-4 space-y-3">
        <h3 className="font-semibold text-gray-900">Subjective (patient report)</h3>
        <Textarea rows={4} value={value.subjective} onChange={(e) => update({ subjective: e.target.value })} placeholder="Patient's self-reported concerns, symptoms, events since last visit."/>
      </section>

      <section className="rounded-xl border bg-white p-4 space-y-3">
        <h3 className="font-semibold text-gray-900">Objective (clinician observations)</h3>
        <Textarea rows={4} value={value.objective} onChange={(e) => update({ objective: e.target.value })} placeholder="Observable behavior, engagement, appearance."/>
      </section>

      <section className="rounded-xl border bg-white p-4 space-y-3">
        <h3 className="font-semibold text-gray-900">Mental Status Exam</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {PROGRESS_MSE_FIELDS.map((field) => (<div key={field} className="grid gap-1.5">
              <Label className="capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</Label>
              <Select value={value.mentalStatus[field] || 'not_assessed'} onValueChange={(v) => updateMse(field, v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(PROGRESS_MSE_OPTIONS[field] || ['not_assessed']).map((opt) => (<SelectItem key={opt} value={opt}>
                      {opt.replace(/_/g, ' ')}
                    </SelectItem>))}
                </SelectContent>
              </Select>
            </div>))}
        </div>
      </section>

      <section className="rounded-xl border bg-white p-4 space-y-3">
        <h3 className="font-semibold text-gray-900">Risk assessment</h3>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={value.riskAssessment.deniesAll} onChange={(e) => update({
            riskAssessment: {
                ...value.riskAssessment,
                deniesAll: e.target.checked,
            },
        })}/>
          Patient denies SI/HI/self-harm/violence
        </label>
        {!value.riskAssessment.deniesAll && (<Textarea rows={3} value={value.riskAssessment.details} onChange={(e) => update({ riskAssessment: { ...value.riskAssessment, details: e.target.value } })} placeholder="Ideation / intent / plan / means / protective factors / safety plan."/>)}
      </section>

      <section className="rounded-xl border bg-white p-4 space-y-3">
        <h3 className="font-semibold text-gray-900">Interventions</h3>
        <Textarea rows={4} value={value.interventions} onChange={(e) => update({ interventions: e.target.value })} placeholder="CBT techniques, psychoeducation, exposure, DBT skills, etc."/>
      </section>

      <section className="rounded-xl border bg-white p-4 space-y-3">
        <h3 className="font-semibold text-gray-900">Response to interventions</h3>
        <Textarea rows={3} value={value.response} onChange={(e) => update({ response: e.target.value })} placeholder="Engagement, insight, progress against goals."/>
      </section>

      <section className="rounded-xl border bg-white p-4 space-y-3">
        <h3 className="font-semibold text-gray-900">Assessment</h3>
        <Textarea rows={3} value={value.assessment} onChange={(e) => update({ assessment: e.target.value })} placeholder="Clinical impression, diagnosis update, progress summary."/>
      </section>

      <section className="rounded-xl border bg-white p-4 space-y-3">
        <h3 className="font-semibold text-gray-900">Plan</h3>
        <Textarea rows={3} value={value.plan} onChange={(e) => update({ plan: e.target.value })} placeholder="Treatment plan updates, frequency, referrals, coordination of care."/>
      </section>

      <section className="rounded-xl border bg-white p-4 space-y-3">
        <h3 className="font-semibold text-gray-900">Homework / between-session tasks</h3>
        <Textarea rows={2} value={value.homework} onChange={(e) => update({ homework: e.target.value })}/>
      </section>

      <section className="rounded-xl border bg-white p-4 grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label>Medications reviewed</Label>
          <Input value={value.medicationsReviewed} onChange={(e) => update({ medicationsReviewed: e.target.value })} placeholder="Adherence, side effects, changes"/>
        </div>
        <div className="grid gap-1.5">
          <Label>Next appointment</Label>
          <Input value={value.nextAppointment} onChange={(e) => update({ nextAppointment: e.target.value })} placeholder="e.g. 1 week, 2025-04-21 10:00"/>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-4 space-y-3">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={value.signOff.signed} onChange={(e) => update({
            signOff: {
                signed: e.target.checked,
                signedAt: e.target.checked ? new Date().toISOString() : undefined,
            },
        })}/>
          Sign and lock this note
        </label>
      </section>
    </div>);
}
