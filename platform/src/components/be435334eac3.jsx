'use client';
import { useMemo, useState } from 'react';
import { Button } from '@/components/2795b661f080';
import { Input } from '@/components/c2f62fb0cb5e';
import { Textarea } from '@/components/e1d2ad49fd73';
import { Switch } from '@/components/395ec797588e';
import { Label } from '@/components/78846397f3ca';
import { Badge } from '@/components/30348591d689';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/1712d8a01fd3';
import { Plus, X, ShieldCheck, Pencil, CheckCircle2 } from 'lucide-react';
import { DiagnosisSearchDropdown } from '@/components/5055abb6c22e';
const RISK_AREA_OPTIONS = [
    'Suicide',
    'Self-harm',
    'Harm to others',
    'Substance use',
    'Medication non-compliance',
    'Elopement',
    'Other',
];
const MSE_FIELDS_LEFT = [
    'Orientation',
    'General appearance',
    'Dress',
    'Motor activity',
    'Interview behavior',
    'Speech',
    'Mood',
    'Affect',
];
const MSE_FIELDS_RIGHT = [
    'Insight',
    'Judgment/Impulse control',
    'Memory',
    'Attention/Concentration',
    'Thought process',
    'Thought content',
    'Perception',
    'Functional status',
];
const MSE_VALUE_OPTIONS = [
    'Normal',
    'Appropriate',
    'Unremarkable',
    'Intact',
    'Good',
    'Excellent',
    'Not assessed',
];
const CUSTOM_VALUE = '__custom__';
function setAllMentalStatus(data, value) {
    const next = { ...data, currentMentalStatus: { ...(data.currentMentalStatus || {}) } };
    for (const k of [...MSE_FIELDS_LEFT, ...MSE_FIELDS_RIGHT]) {
        next.currentMentalStatus[k] = value;
    }
    return next;
}
function clearAllMentalStatus(data) {
    return { ...data, currentMentalStatus: {} };
}
function emptyRiskArea(presetArea) {
    return {
        area: presetArea ?? '',
        level: null,
        intentToAct: null,
        planToAct: null,
        meansToAct: null,
        riskFactors: '',
        protectiveFactors: '',
        additionalDetails: '',
    };
}
function isoToLocalInput(iso) {
    if (!iso)
        return '';
    const t = Date.parse(iso);
    if (!Number.isFinite(t))
        return '';
    const d = new Date(t);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function localInputToIso(v) {
    if (!v)
        return undefined;
    const t = Date.parse(v);
    if (!Number.isFinite(t))
        return undefined;
    return new Date(t).toISOString();
}
function computeEndAt(startAtIso, durationMinutes) {
    const start = startAtIso ? Date.parse(startAtIso) : NaN;
    if (!Number.isFinite(start))
        return undefined;
    const dur = Number(durationMinutes || 0);
    if (!Number.isFinite(dur) || dur <= 0)
        return undefined;
    return new Date(start + dur * 60_000).toISOString();
}
export function IntakeNoteEditor({ value, onChange, patientDisplay, }) {
    const mseAllNormal = useMemo(() => {
        const all = [...MSE_FIELDS_LEFT, ...MSE_FIELDS_RIGHT];
        return all.length > 0 && all.every((k) => (value.currentMentalStatus?.[k] || '').toLowerCase() === 'normal');
    }, [value.currentMentalStatus]);
    const deniesAll = value.riskAssessment?.deniesAll ?? true;
    const areas = value.riskAssessment?.areas || [];
    const setRiskAssessment = (next) => onChange({
        ...value,
        riskAssessment: { ...(value.riskAssessment || { deniesAll: true, areas: [] }), ...next },
    });
    return (<div className="space-y-6">
      <section className="rounded-xl border bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Intake Note</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label className="text-xs text-gray-600">Clinician</Label>
            <Input value={value.meta?.clinicianName || ''} onChange={(e) => onChange({ ...value, meta: { ...(value.meta || {}), clinicianName: e.target.value } })} placeholder="Your name"/>
          </div>
          <div className="grid gap-2">
            <Label className="text-xs text-gray-600">Patient</Label>
            <Input value={patientDisplay?.name
            ? `${patientDisplay.name}${patientDisplay.dob ? ` (DOB ${patientDisplay.dob})` : ''}`
            : ''} readOnly placeholder="Assigned patient"/>
          </div>

          <div className="grid gap-2">
            <Label className="text-xs text-gray-600">Date & time</Label>
            <Input type="datetime-local" value={isoToLocalInput(value.meta?.startAt)} onChange={(e) => {
            const startAt = localInputToIso(e.target.value);
            const durationMinutes = value.meta?.durationMinutes;
            const endAt = computeEndAt(startAt, durationMinutes);
            onChange({ ...value, meta: { ...(value.meta || {}), startAt, endAt } });
        }}/>
          </div>

          <div className="grid gap-2">
            <Label className="text-xs text-gray-600">Duration (minutes)</Label>
            <Input type="number" min={0} value={value.meta?.durationMinutes ?? ''} onChange={(e) => {
            const durationMinutes = e.target.value ? Number(e.target.value) : undefined;
            const endAt = computeEndAt(value.meta?.startAt, durationMinutes);
            onChange({ ...value, meta: { ...(value.meta || {}), durationMinutes, endAt } });
        }} placeholder="90"/>
          </div>

          <div className="grid gap-2">
            <Label className="text-xs text-gray-600">Service code</Label>
            <Input value={value.meta?.serviceCode || ''} onChange={(e) => onChange({ ...value, meta: { ...(value.meta || {}), serviceCode: e.target.value } })} placeholder="90791"/>
          </div>

          <div className="grid gap-2">
            <Label className="text-xs text-gray-600">Location</Label>
            <Input value={value.meta?.location || ''} onChange={(e) => onChange({ ...value, meta: { ...(value.meta || {}), location: e.target.value } })} placeholder="Main Office"/>
          </div>

          <div className="grid gap-2 md:col-span-2">
            <Label className="text-xs text-gray-600">Participants</Label>
            <Input value={value.meta?.participants || ''} onChange={(e) => onChange({ ...value, meta: { ...(value.meta || {}), participants: e.target.value } })} placeholder="Client only"/>
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Presenting Problem</h3>
        </div>
        <Textarea value={value.presentingProblem} onChange={(e) => onChange({ ...value, presentingProblem: e.target.value })} placeholder="What brings the client in today?" rows={5}/>
      </section>

      <section className="rounded-xl border bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-gray-900">Current Mental Status</h3>
            <p className="text-xs text-gray-500">One-click defaults below, or set each field individually.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={() => onChange(setAllMentalStatus(value, 'Normal'))} className="h-8 gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700">
              <CheckCircle2 className="h-4 w-4"/>
              All normal
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => onChange(setAllMentalStatus(value, 'Not assessed'))} className="h-8">
              All not assessed
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => onChange(clearAllMentalStatus(value))} className="h-8 text-gray-600">
              Clear
            </Button>
            {mseAllNormal ? (<Badge variant="secondary" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                All normal
              </Badge>) : null}
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            {MSE_FIELDS_LEFT.map((k) => (<MseField key={k} label={k} value={value.currentMentalStatus?.[k] || ''} onChange={(v) => onChange({
                ...value,
                currentMentalStatus: { ...(value.currentMentalStatus || {}), [k]: v },
            })}/>))}
          </div>
          <div className="space-y-3">
            {MSE_FIELDS_RIGHT.map((k) => (<MseField key={k} label={k} value={value.currentMentalStatus?.[k] || ''} onChange={(v) => onChange({
                ...value,
                currentMentalStatus: { ...(value.currentMentalStatus || {}), [k]: v },
            })}/>))}
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-4">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-gray-900">Risk Assessment</h3>
            <p className="text-xs text-gray-500">
              Add one or more risk areas, or mark that the patient denies all areas of risk.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {deniesAll && areas.length === 0 ? (<Badge className="gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
                <ShieldCheck className="h-3.5 w-3.5"/>
                Patient denies all risk
              </Badge>) : null}
            {deniesAll && areas.length === 0 ? (<Button type="button" variant="ghost" size="sm" className="h-8 gap-1.5 text-gray-600" onClick={() => setRiskAssessment({ deniesAll: false })}>
                <Pencil className="h-3.5 w-3.5"/>
                Edit
              </Button>) : (<>
                <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => setRiskAssessment({ deniesAll: true, areas: [] })}>
                  <ShieldCheck className="h-3.5 w-3.5"/>
                  Patient denies all risk
                </Button>
                <Button type="button" size="sm" className="h-8 gap-1.5" onClick={() => setRiskAssessment({
                deniesAll: false,
                areas: [...areas, emptyRiskArea(areas.length === 0 ? 'Suicide' : undefined)],
            })}>
                  <Plus className="h-3.5 w-3.5"/>
                  Add area of risk
                </Button>
              </>)}
          </div>
        </div>

        {!(deniesAll && areas.length === 0) ? (<div className="space-y-4">
            {areas.length === 0 ? (<div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-500">
                No risk areas yet. Click <span className="font-medium text-gray-700">Add area of risk</span> above to
                document one.
              </div>) : null}

            {areas.map((area, idx) => (<RiskAreaCard key={idx} index={idx} value={area} onChange={(next) => {
                    const nextAreas = [...areas];
                    nextAreas[idx] = next;
                    setRiskAssessment({ deniesAll: false, areas: nextAreas });
                }} onRemove={() => {
                    const nextAreas = areas.filter((_, i) => i !== idx);
                    setRiskAssessment({
                        deniesAll: nextAreas.length === 0 ? true : false,
                        areas: nextAreas,
                    });
                }}/>))}
          </div>) : null}
      </section>

      <section className="rounded-xl border bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Objective Content</h3>
        </div>
        <Textarea value={value.objectiveContent} onChange={(e) => onChange({ ...value, objectiveContent: e.target.value })} placeholder="Clinical observations and objective data…" rows={5}/>
      </section>

      <section className="rounded-xl border bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Biopsychosocial Assessment</h3>
        </div>
        <div className="grid gap-3">
          {[
            { k: 'Identification', ph: 'age (at time of intake), ethnicity, religion, marital status, referral status, etc.' },
            { k: 'History of present problem', ph: 'symptoms, onset, duration, frequency, etc.' },
            { k: 'Psychiatric history', ph: 'prior episodes of symptoms, diagnoses, courses of treatment, etc.' },
            { k: 'Trauma history', ph: 'nature of trauma, when occurred, persons involved, etc.' },
            { k: 'Family psychiatric history', ph: 'history of mental illness in family, diagnoses, etc.' },
            { k: 'Medical conditions & history', ph: 'current and past medical conditions, treatments, allergies, etc.' },
            { k: 'Current medications', ph: 'medication, dosage, purpose, prescribing physician' },
            { k: 'Substance use', ph: 'tobacco, alcohol, substances, prescription drugs other than prescribed, etc.' },
            { k: 'Family history', ph: 'family of origin, relationship with parents, siblings, significant others, etc.' },
            { k: 'Social history', ph: 'relationships, social support, quality of relationships, community resources, etc.' },
            { k: 'Spiritual/Cultural factors', ph: 'spiritual practices and communities, cultural influences, etc.' },
            { k: 'Developmental history', ph: 'developmental milestones, delays, etc.' },
            { k: 'Educational/Vocational history', ph: 'education/current employment, hobbies, leisure activities, etc.' },
            { k: 'Legal history', ph: 'arrests/summons, sentencing, DUI occurrences, incarceration, civil litigation, family court matters, etc.' },
            { k: 'SNAP', ph: 'strengths, needs, abilities, preferences, etc.' },
            { k: 'Other important information', ph: 'other important information relevant to treatment' },
        ].map(({ k, ph }) => (<div key={k} className="grid gap-1.5">
              <Label className="text-xs text-gray-600">{k}</Label>
              <Textarea value={String(value.biopsychosocial?.[k] || '')} onChange={(e) => onChange({
                ...value,
                biopsychosocial: { ...(value.biopsychosocial || {}), [k]: e.target.value },
            })} placeholder={ph} rows={2}/>
            </div>))}
        </div>
      </section>

      <section className="rounded-xl border bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Plan</h3>
        </div>
        <Textarea value={value.plan} onChange={(e) => onChange({ ...value, plan: e.target.value })} placeholder="Treatment plan / next steps…" rows={4}/>
      </section>

      <section className="rounded-xl border bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Diagnosis</h3>
        </div>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label className="text-xs text-gray-600">Primary ICD-10</Label>
            {value.diagnosis?.primaryIcd10?.trim() ? (<div className="flex flex-wrap items-center gap-2 rounded-md border bg-gray-50 px-3 py-2">
                <Badge variant="secondary">{value.diagnosis.primaryIcd10.trim()}</Badge>
                {value.diagnosis?.primaryIcd10Name?.trim() ? (<span className="text-sm text-gray-700">{value.diagnosis.primaryIcd10Name.trim()}</span>) : null}
                <Button type="button" variant="ghost" size="sm" className="ml-auto h-7 px-2 text-xs" onClick={() => {
                const prevName = String(value.diagnosis?.primaryIcd10Name || '').trim();
                const prevDesc = String(value.diagnosis?.description || '').trim();
                onChange({
                    ...value,
                    diagnosis: {
                        ...value.diagnosis,
                        primaryIcd10: '',
                        primaryIcd10Name: '',
                        description: prevDesc && prevDesc === prevName ? '' : value.diagnosis?.description || '',
                    },
                });
            }}>
                  Clear
                </Button>
              </div>) : (<div className="text-xs text-gray-500">No diagnosis selected yet.</div>)}

            <DiagnosisSearchDropdown placeholder="Search ICD-10 (F01-F99 supported)" onSelect={(d) => {
            const prevName = String(value.diagnosis?.primaryIcd10Name || '').trim();
            const currentDesc = String(value.diagnosis?.description || '').trim();
            const nextDesc = !currentDesc || currentDesc === prevName ? d.name : value.diagnosis?.description || '';
            onChange({
                ...value,
                diagnosis: {
                    ...value.diagnosis,
                    primaryIcd10: d.code,
                    primaryIcd10Name: d.name,
                    description: nextDesc,
                },
            });
        }}/>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-gray-600">Description</Label>
            <Input value={value.diagnosis?.description || ''} onChange={(e) => onChange({ ...value, diagnosis: { ...value.diagnosis, description: e.target.value } })} placeholder="…"/>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-gray-600">Diagnostic justification</Label>
            <Textarea value={value.diagnosis?.justification || ''} onChange={(e) => onChange({ ...value, diagnosis: { ...value.diagnosis, justification: e.target.value } })} placeholder="…" rows={3}/>
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-gray-900">Sign</h3>
            <p className="text-xs text-gray-500">Note is visible to assigned clinicians only.</p>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={Boolean(value.signOff?.signed)} onCheckedChange={(checked) => onChange({
            ...value,
            signOff: checked
                ? { signed: true, signedAt: new Date().toISOString() }
                : { signed: false, signedAt: undefined },
        })}/>
            <span className="text-sm text-gray-700">Sign this form</span>
          </div>
        </div>
        {value.signOff?.signedAt ? (<div className="text-xs text-gray-500">Signed {new Date(value.signOff.signedAt).toLocaleString('en-US')}</div>) : null}
      </section>
    </div>);
}
function MseField({ label, value, onChange, }) {
    const isPreset = value && MSE_VALUE_OPTIONS.includes(value);
    const [customMode, setCustomMode] = useState(Boolean(value && !isPreset));
    const useCustom = customMode || (value && !isPreset);
    const selectValue = useCustom ? CUSTOM_VALUE : value || undefined;
    return (<div className="grid gap-1.5">
      <Label className="text-xs text-gray-600">{label}</Label>
      <div className="grid gap-1.5">
        <Select value={selectValue} onValueChange={(v) => {
            if (v === CUSTOM_VALUE) {
                setCustomMode(true);
                if (isPreset)
                    onChange('');
                return;
            }
            setCustomMode(false);
            onChange(v);
        }}>
          <SelectTrigger>
            <SelectValue placeholder="Pick a value…"/>
          </SelectTrigger>
          <SelectContent>
            {MSE_VALUE_OPTIONS.map((opt) => (<SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>))}
            <SelectItem value={CUSTOM_VALUE}>Custom…</SelectItem>
          </SelectContent>
        </Select>
        {useCustom ? (<Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={`Custom ${label.toLowerCase()}`} autoFocus={!value}/>) : null}
      </div>
    </div>);
}
function RiskAreaCard({ index, value, onChange, onRemove, }) {
    const set = (k, v) => onChange({ ...value, [k]: v });
    return (<div className="rounded-lg border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <Label className="text-xs text-gray-600">Area of risk #{index + 1}</Label>
          <Select value={value.area || undefined} onValueChange={(v) => set('area', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select an area"/>
            </SelectTrigger>
            <SelectContent>
              {RISK_AREA_OPTIONS.map((opt) => (<SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={onRemove} className="text-red-600 hover:bg-red-50" aria-label="Remove area">
          <X className="h-4 w-4"/>
        </Button>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-4">
        <PickRisk label="Level of risk" value={value.level} onChange={(v) => set('level', v)}/>
        <PickYesNoNa label="Intent to act" value={value.intentToAct} onChange={(v) => set('intentToAct', v)}/>
        <PickYesNoNa label="Plan to act" value={value.planToAct} onChange={(v) => set('planToAct', v)}/>
        <PickYesNoNa label="Means to act" value={value.meansToAct} onChange={(v) => set('meansToAct', v)}/>
      </div>

      <div className="mt-3 grid gap-3">
        <div className="grid gap-1.5">
          <Label className="text-xs text-gray-600">Risk factors</Label>
          <Input value={value.riskFactors} onChange={(e) => set('riskFactors', e.target.value)} placeholder="…"/>
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs text-gray-600">Protective factors</Label>
          <Input value={value.protectiveFactors} onChange={(e) => set('protectiveFactors', e.target.value)} placeholder="…"/>
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs text-gray-600">Additional details</Label>
          <Input value={value.additionalDetails} onChange={(e) => set('additionalDetails', e.target.value)} placeholder="…"/>
        </div>
      </div>
    </div>);
}
function PickRisk({ label, value, onChange, }) {
    const opts = [
        { id: 'low', label: 'Low', tone: 'border-emerald-600 bg-emerald-50 text-emerald-700' },
        { id: 'medium', label: 'Medium', tone: 'border-amber-600 bg-amber-50 text-amber-700' },
        { id: 'high', label: 'High', tone: 'border-orange-600 bg-orange-50 text-orange-700' },
        { id: 'imminent', label: 'Imminent', tone: 'border-red-600 bg-red-50 text-red-700' },
    ];
    return (<div className="grid gap-1.5">
      <Label className="text-xs text-gray-600">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {opts.map((o) => (<button key={o.id} type="button" className={`rounded-md border px-2 py-1 text-sm transition ${value === o.id ? o.tone : 'bg-white text-gray-700 hover:bg-gray-50'}`} onClick={() => onChange(value === o.id ? null : o.id)}>
            {o.label}
          </button>))}
      </div>
    </div>);
}
function PickYesNoNa({ label, value, onChange, }) {
    const opts = [
        { id: 'yes', label: 'Yes' },
        { id: 'no', label: 'No' },
        { id: 'na', label: 'N/A' },
    ];
    return (<div className="grid gap-1.5">
      <Label className="text-xs text-gray-600">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {opts.map((o) => (<button key={o.id} type="button" className={`rounded-md border px-2 py-1 text-sm transition ${value === o.id
                ? o.id === 'yes'
                    ? 'border-red-600 bg-red-50 text-red-700'
                    : o.id === 'no'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                        : 'border-gray-400 bg-gray-100 text-gray-700'
                : 'bg-white text-gray-700 hover:bg-gray-50'}`} onClick={() => onChange(value === o.id ? null : o.id)}>
            {o.label}
          </button>))}
      </div>
    </div>);
}
