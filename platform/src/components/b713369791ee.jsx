'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Save, PenLine, Printer, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/2795b661f080';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/c0ebd3fbafc6';
import { Input } from '@/components/c2f62fb0cb5e';
import { Textarea } from '@/components/e1d2ad49fd73';
import { Label } from '@/components/78846397f3ca';
import { Badge } from '@/components/30348591d689';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/93bde5168d2a';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/1712d8a01fd3';
import { SignaturePadDialog } from '@/components/4729b2e45bb9';
const MSE_FIELDS = [
    'generalAppearance',
    'motorActivity',
    'behavior',
    'speech',
    'mood',
    'affect',
    'insight',
    'judgment',
    'memory',
    'attention',
    'thoughtProcess',
    'thoughtContent',
    'perception',
    'functionalStatus',
];
const MSE_OPTIONS_BY_FIELD = {
    generalAppearance: ['not_assessed', 'well_groomed', 'disheveled', 'bizarre', 'appropriate', 'inappropriate', 'poor_hygiene'],
    motorActivity: ['not_assessed', 'normal', 'agitated', 'retarded', 'restless', 'tremor', 'tics', 'rigid'],
    behavior: ['not_assessed', 'cooperative', 'uncooperative', 'guarded', 'hostile', 'withdrawn', 'dramatic', 'seductive'],
    speech: ['not_assessed', 'normal', 'pressured', 'slow', 'loud', 'soft', 'monotone', 'slurred', 'rapid'],
    mood: ['not_assessed', 'euthymic', 'depressed', 'anxious', 'irritable', 'euphoric', 'angry', 'fearful', 'hopeless'],
    affect: ['not_assessed', 'appropriate', 'flat', 'blunted', 'constricted', 'labile', 'incongruent', 'expansive'],
    insight: ['not_assessed', 'good', 'fair', 'poor', 'absent'],
    judgment: ['not_assessed', 'good', 'fair', 'poor', 'impaired'],
    memory: ['not_assessed', 'intact', 'impaired_recent', 'impaired_remote', 'impaired_immediate', 'confabulation'],
    attention: ['not_assessed', 'intact', 'distractible', 'impaired', 'hypervigilant'],
    thoughtProcess: ['not_assessed', 'linear', 'tangential', 'circumstantial', 'loose_associations', 'flight_of_ideas', 'thought_blocking'],
    thoughtContent: ['not_assessed', 'appropriate', 'delusions', 'obsessions', 'phobias', 'ideas_of_reference', 'paranoid'],
    perception: ['not_assessed', 'normal', 'hallucinations_auditory', 'hallucinations_visual', 'illusions', 'derealization', 'depersonalization'],
    functionalStatus: ['not_assessed', 'independent', 'minimal_assistance', 'moderate_assistance', 'dependent', 'impaired'],
};
const MSE_OPTIONS = ['not_assessed', 'normal', 'abnormal'];
const RISK_LEVELS = ['none', 'low', 'moderate', 'high'];
function asString(v) {
    return typeof v === 'string' ? v : v == null ? '' : String(v);
}
function pickFirstServiceCode(codes) {
    if (!codes?.length)
        return null;
    const first = codes[0];
    const c = Array.isArray(first.code) ? first.code[0] : first.code;
    return c ? { code: String(c.code), description: String(c.description) } : null;
}
function buildMeta(session, therapistName, client, code) {
    const dt = new Date(session.scheduledAt);
    return {
        clinician: therapistName,
        patient: client?.name || '',
        date: dt.toLocaleDateString(),
        time: dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        durationMinutes: session.durationMinutes,
        serviceCode: code?.code || '',
        serviceCodeDescription: code?.description || '',
        location: session.locationType === 'telehealth' ? `Telehealth${session.locationLabel ? ` • ${session.locationLabel}` : ''}` : session.locationLabel,
        participants: client?.name ? [client.name] : [],
    };
}
export default function TherapistSessionNotesEditor({ session, client, therapistName, initialNotes, existingNotes, serviceCodes, }) {
    const serviceCode = useMemo(() => pickFirstServiceCode(serviceCodes), [serviceCodes]);
    const scheduledAt = useMemo(() => new Date(session.scheduledAt), [session.scheduledAt]);
    const defaultNoteType = useMemo(() => {
        return session.sessionType.includes('intake') ? 'intake' : 'progress';
    }, [session.sessionType]);
    const [noteType, setNoteType] = useState(defaultNoteType);
    const current = useMemo(() => existingNotes.find((n) => n.note_type === noteType) || null, [existingNotes, noteType]);
    const [saving, setSaving] = useState(false);
    const [signing, setSigning] = useState(false);
    const [signOpen, setSignOpen] = useState(false);
    // Intake form
    const [intake, setIntake] = useState(() => {
        const content = (existingNotes.find((n) => n.note_type === 'intake')?.content_json || {});
        return {
            presentingProblem: asString(content.presentingProblem),
            objectiveContent: asString(content.objectiveContent),
            identification: asString(content.identification),
            historyOfProblem: asString(content.historyOfProblem),
            therapyHistory: asString(content.therapyHistory),
            traumaHistory: asString(content.traumaHistory),
            familyHistory: asString(content.familyHistory),
            medicalConditions: asString(content.medicalConditions),
            medications: asString(content.medications),
            substances: asString(content.substances),
            snapStrengths: asString(content.snapStrengths),
            snapNeeds: asString(content.snapNeeds),
            snapAbilities: asString(content.snapAbilities),
            snapPreferences: asString(content.snapPreferences),
            plan: asString(content.plan),
            diagnosisQuery: asString(content.diagnosis?.query),
            diagnosisSelected: content.diagnosis?.selected || null,
            diagnosisJustification: asString(content.diagnosis?.justification),
            mse: MSE_FIELDS.reduce((acc, k) => {
                acc[k] = content.mentalStatus?.[k] || 'not_assessed';
                return acc;
            }, {}),
            risks: Array.isArray(content.risks)
                ? content.risks
                : [
                    {
                        area: 'suicidal_or_homicidal_ideation',
                        level: 'none',
                        intent: 'no',
                        plan: '',
                        riskFactors: '',
                        protectiveFactors: '',
                        details: '',
                    },
                ],
        };
    });
    // Progress form (expanded)
    const [progress, setProgress] = useState(() => {
        const legacy = (initialNotes || {});
        const content = (existingNotes.find((n) => n.note_type === 'progress')?.content_json || {});
        return {
            approach: asString(content.approach),
            subjective: asString(content.subjective || legacy.summary),
            objective: asString(content.objective || legacy.observations),
            interventions: asString(content.interventions || legacy.interventions),
            outcomeMeasures: asString(content.outcomeMeasures),
            progressTowardGoals: asString(content.progressTowardGoals),
            updatedPlan: asString(content.updatedPlan || legacy.plan),
            changeOrTerminate: asString(content.changeOrTerminate),
            mse: MSE_FIELDS.reduce((acc, k) => {
                acc[k] = content.mentalStatus?.[k] || 'not_assessed';
                return acc;
            }, {}),
            riskLevel: asString(content.risk?.level || 'none'),
            riskNotes: asString(content.risk?.notes),
            therapistObservations: '',
        };
    });
    // diagnosis search suggestions (simple)
    const [dxSuggestions, setDxSuggestions] = useState([]);
    useEffect(() => {
        const q = intake.diagnosisQuery.trim();
        if (q.length < 2) {
            setDxSuggestions([]);
            return;
        }
        const t = setTimeout(async () => {
            try {
                const res = await fetch(`/api/diagnosis/search?q=${encodeURIComponent(q)}`);
                const data = await res.json().catch(() => ({}));
                if (res.ok && Array.isArray(data.diagnoses)) {
                    setDxSuggestions(data.diagnoses.slice(0, 10).map((d) => ({
                        id: String(d.id),
                        code: String(d.code),
                        name: String(d.name),
                    })));
                }
            }
            catch {
                // ignore
            }
        }, 250);
        return () => clearTimeout(t);
    }, [intake.diagnosisQuery]);
    const meta = useMemo(() => buildMeta(session, therapistName, client, serviceCode), [client, session, serviceCode, therapistName]);
    const MSE_NORMAL_DEFAULTS = {
        generalAppearance: 'appropriate',
        motorActivity: 'normal',
        behavior: 'cooperative',
        speech: 'normal',
        mood: 'euthymic',
        affect: 'appropriate',
        insight: 'good',
        judgment: 'good',
        memory: 'intact',
        attention: 'intact',
        thoughtProcess: 'linear',
        thoughtContent: 'appropriate',
        perception: 'normal',
        functionalStatus: 'independent',
    };
    const setAllNormal = () => {
        setIntake((p) => ({
            ...p,
            mse: MSE_FIELDS.reduce((acc, k) => {
                acc[k] = MSE_NORMAL_DEFAULTS[k] || 'normal';
                return acc;
            }, {}),
        }));
    };
    const denyAllRisks = () => {
        setIntake((p) => ({
            ...p,
            risks: (p.risks || []).map((r) => ({
                ...r,
                level: 'none',
                intent: 'no',
                plan: '',
                riskFactors: '',
                protectiveFactors: '',
                details: '',
            })),
        }));
    };
    const save = async () => {
        setSaving(true);
        try {
            const payload = noteType === 'intake'
                ? {
                    meta,
                    presentingProblem: intake.presentingProblem,
                    mentalStatus: intake.mse,
                    risks: intake.risks,
                    objectiveContent: intake.objectiveContent,
                    identification: intake.identification,
                    historyOfProblem: intake.historyOfProblem,
                    therapyHistory: intake.therapyHistory,
                    traumaHistory: intake.traumaHistory,
                    familyHistory: intake.familyHistory,
                    medicalConditions: intake.medicalConditions,
                    medications: intake.medications,
                    substances: intake.substances,
                    snapStrengths: intake.snapStrengths,
                    snapNeeds: intake.snapNeeds,
                    snapAbilities: intake.snapAbilities,
                    snapPreferences: intake.snapPreferences,
                    plan: intake.plan,
                    diagnosis: {
                        query: intake.diagnosisQuery,
                        selected: intake.diagnosisSelected,
                        justification: intake.diagnosisJustification,
                    },
                }
                : {
                    meta,
                    approach: progress.approach,
                    subjective: progress.subjective,
                    objective: progress.objective,
                    mentalStatus: progress.mse,
                    risk: { level: progress.riskLevel || 'none', notes: progress.riskNotes },
                    outcomeMeasures: progress.outcomeMeasures,
                    interventions: progress.interventions,
                    progressTowardGoals: progress.progressTowardGoals,
                    updatedPlan: progress.updatedPlan,
                    changeOrTerminate: progress.changeOrTerminate,
                };
            const res = await fetch(`/api/therapist/sessions/${session.id}/notes`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ noteType, notes: payload }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data.error || 'Failed to save');
            toast.success('Saved');
        }
        catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to save');
        }
        finally {
            setSaving(false);
        }
    };
    const sign = async (signatureMethod, signatureDataUrl = null) => {
        setSigning(true);
        try {
            const res = await fetch(`/api/therapist/sessions/${session.id}/notes/sign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ noteType, signatureMethod, signatureDataUrl }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data.error || 'Failed to sign');
            toast.success('Signed');
            setSignOpen(false);
            window.location.reload();
        }
        catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to sign');
        }
        finally {
            setSigning(false);
        }
    };
    const formatNoteForExport = () => {
        const lines = [];
        lines.push(`SESSION NOTE - ${noteType.toUpperCase()}`);
        lines.push('='.repeat(50));
        lines.push('');
        lines.push(`Clinician: ${meta.clinician}`);
        lines.push(`Patient: ${meta.patient}`);
        lines.push(`Date: ${meta.date} ${meta.time}`);
        lines.push(`Duration: ${meta.durationMinutes} minutes`);
        lines.push(`Service Code: ${meta.serviceCode || 'N/A'}`);
        lines.push(`Location: ${meta.location || 'N/A'}`);
        lines.push('');
        lines.push('-'.repeat(50));
        if (noteType === 'intake') {
            lines.push('');
            lines.push('PRESENTING PROBLEM:');
            lines.push(intake.presentingProblem || 'N/A');
            lines.push('');
            lines.push('MENTAL STATUS EXAMINATION:');
            MSE_FIELDS.forEach((f) => {
                lines.push(`  ${f.replace(/([A-Z])/g, ' $1').trim()}: ${intake.mse[f]}`);
            });
            lines.push('');
            lines.push('RISK ASSESSMENT:');
            intake.risks.forEach((r, i) => {
                lines.push(`  Area ${i + 1}: ${r.area} - Level: ${r.level}, Intent: ${r.intent}`);
                if (r.plan)
                    lines.push(`    Plan/Means: ${r.plan}`);
                if (r.riskFactors)
                    lines.push(`    Risk Factors: ${r.riskFactors}`);
                if (r.protectiveFactors)
                    lines.push(`    Protective Factors: ${r.protectiveFactors}`);
            });
            lines.push('');
            lines.push('OBJECTIVE CONTENT:');
            lines.push(intake.objectiveContent || 'N/A');
            lines.push('');
            lines.push('IDENTIFICATION:');
            lines.push(intake.identification || 'N/A');
            lines.push('');
            lines.push('HISTORY:');
            lines.push(`  History of Problem: ${intake.historyOfProblem || 'N/A'}`);
            lines.push(`  Therapy History: ${intake.therapyHistory || 'N/A'}`);
            lines.push(`  Trauma History: ${intake.traumaHistory || 'N/A'}`);
            lines.push(`  Family History: ${intake.familyHistory || 'N/A'}`);
            lines.push(`  Medical Conditions: ${intake.medicalConditions || 'N/A'}`);
            lines.push(`  Medications: ${intake.medications || 'N/A'}`);
            lines.push(`  Substances: ${intake.substances || 'N/A'}`);
            lines.push('');
            lines.push('SNAP:');
            lines.push(`  Strengths: ${intake.snapStrengths || 'N/A'}`);
            lines.push(`  Needs: ${intake.snapNeeds || 'N/A'}`);
            lines.push(`  Abilities: ${intake.snapAbilities || 'N/A'}`);
            lines.push(`  Preferences: ${intake.snapPreferences || 'N/A'}`);
            lines.push('');
            lines.push('PLAN:');
            lines.push(intake.plan || 'N/A');
            lines.push('');
            lines.push('DIAGNOSIS:');
            lines.push(`  ${intake.diagnosisQuery || 'N/A'}`);
            if (intake.diagnosisJustification) {
                lines.push(`  Justification: ${intake.diagnosisJustification}`);
            }
        }
        else {
            lines.push('');
            lines.push('SUBJECTIVE:');
            lines.push(progress.subjective || 'N/A');
            lines.push('');
            lines.push('OBJECTIVE:');
            lines.push(progress.objective || 'N/A');
            lines.push('');
            lines.push('MENTAL STATUS EXAMINATION:');
            MSE_FIELDS.forEach((f) => {
                lines.push(`  ${f.replace(/([A-Z])/g, ' $1').trim()}: ${progress.mse[f]}`);
            });
            lines.push('');
            lines.push('RISK ASSESSMENT:');
            lines.push(`  Level: ${progress.riskLevel || 'none'}`);
            if (progress.riskNotes)
                lines.push(`  Notes: ${progress.riskNotes}`);
            lines.push('');
            lines.push('OUTCOME MEASURES:');
            lines.push(progress.outcomeMeasures || 'N/A');
            lines.push('');
            lines.push('INTERVENTIONS:');
            lines.push(progress.interventions || 'N/A');
            lines.push('');
            lines.push('PROGRESS TOWARD GOALS:');
            lines.push(progress.progressTowardGoals || 'N/A');
            lines.push('');
            lines.push('UPDATED PLAN:');
            lines.push(progress.updatedPlan || 'N/A');
            if (progress.changeOrTerminate) {
                lines.push('');
                lines.push('CHANGE/TERMINATE TREATMENT:');
                lines.push(progress.changeOrTerminate);
            }
        }
        lines.push('');
        lines.push('-'.repeat(50));
        lines.push(`Status: ${current?.status || 'draft'}`);
        if (current?.signed_at) {
            lines.push(`Signed: ${new Date(current.signed_at).toLocaleString()}`);
        }
        return lines.join('\n');
    };
    const handlePrint = () => {
        const content = formatNoteForExport();
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
        <html>
          <head>
            <title>Session Note - ${meta.patient} - ${meta.date}</title>
            <style>
              body { font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.5; padding: 20px; max-width: 800px; margin: 0 auto; }
              pre { white-space: pre-wrap; word-wrap: break-word; }
            </style>
          </head>
          <body>
            <pre>${content}</pre>
          </body>
        </html>
      `);
            printWindow.document.close();
            printWindow.print();
        }
    };
    const handleDownload = () => {
        const content = formatNoteForExport();
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `session-note-${meta.patient.replace(/\s+/g, '-').toLowerCase()}-${meta.date.replace(/\//g, '-')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Note downloaded');
    };
    return (<div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-gray-900">Session Notes</h1>
            <Badge variant="secondary" className="capitalize">
              {session.status.replace('_', ' ')}
            </Badge>
            {current?.status ? (<Badge variant={current.status === 'signed' ? 'default' : 'secondary'} className="capitalize">
                {current.status}
              </Badge>) : null}
          </div>
          <p className="mt-1 text-gray-600">
            {client?.name ? `Patient: ${client.name} • ` : ''}
            {scheduledAt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}{' '}
            • {session.durationMinutes} minutes • {serviceCode?.code ? `Code ${serviceCode.code}` : 'No code selected'}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {client?.id ? (<Button asChild variant="outline">
              <Link href={`/therapist/clients/${client.id}`}>Back to Patient Chart</Link>
            </Button>) : null}
          <Button onClick={save} disabled={saving}>
            <Save className="h-4 w-4 mr-2"/>
            {saving ? 'Saving…' : 'Save'}
          </Button>
          <Button onClick={() => setSignOpen(true)} disabled={signing} variant="outline">
            <PenLine className="h-4 w-4 mr-2"/>
            {signing ? 'Signing…' : 'Sign'}
          </Button>
          <Button onClick={handlePrint} variant="outline">
            <Printer className="h-4 w-4 mr-2"/>
            Print
          </Button>
          <Button onClick={handleDownload} variant="outline">
            <Download className="h-4 w-4 mr-2"/>
            Download
          </Button>
        </div>
      </div>

      <Tabs value={noteType} onValueChange={(v) => setNoteType(v === 'intake' ? 'intake' : 'progress')}>
        <TabsList>
          <TabsTrigger value="intake">Intake note</TabsTrigger>
          <TabsTrigger value="progress">Progress note</TabsTrigger>
        </TabsList>

        <TabsContent value="intake" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Prefill</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 text-sm text-gray-700">
              <div><span className="font-medium">Clinician:</span> {meta.clinician}</div>
              <div><span className="font-medium">Patient:</span> {meta.patient}</div>
              <div><span className="font-medium">Date/time:</span> {meta.date} {meta.time}</div>
              <div><span className="font-medium">Duration:</span> {meta.durationMinutes} minutes</div>
              <div><span className="font-medium">Service code:</span> {meta.serviceCode || '—'}</div>
              <div className="truncate"><span className="font-medium">Location:</span> {meta.location || '—'}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Presenting problem</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea spellCheck value={intake.presentingProblem} onChange={(e) => setIntake((p) => ({ ...p, presentingProblem: e.target.value }))} rows={4}/>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Mental status</span>
                <Button variant="outline" size="sm" onClick={setAllNormal}>
                  All normal
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {MSE_FIELDS.map((f) => {
            const options = MSE_OPTIONS_BY_FIELD[f] || MSE_OPTIONS;
            return (<div key={f} className="space-y-2">
                    <Label className="capitalize">{f.replaceAll(/([A-Z])/g, ' $1')}</Label>
                    <Select value={intake.mse[f]} onValueChange={(v) => setIntake((p) => ({ ...p, mse: { ...p.mse, [f]: v } }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {options.map((o) => (<SelectItem key={o} value={o}>
                            {o.replaceAll('_', ' ')}
                          </SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>);
        })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Risk assessment</span>
                <Button variant="outline" size="sm" onClick={denyAllRisks}>
                  Deny all
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {intake.risks.map((r, idx) => (<div key={idx} className="rounded-lg border p-4 space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Area</Label>
                      <Input spellCheck value={asString(r.area)} onChange={(e) => setIntake((p) => {
                const risks = [...p.risks];
                risks[idx] = { ...risks[idx], area: e.target.value };
                return { ...p, risks };
            })}/>
                    </div>
                    <div className="space-y-2">
                      <Label>Level</Label>
                      <Select value={asString(r.level) || 'none'} onValueChange={(v) => setIntake((p) => {
                const risks = [...p.risks];
                risks[idx] = { ...risks[idx], level: v };
                return { ...p, risks };
            })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {RISK_LEVELS.map((v) => (<SelectItem key={v} value={v}>
                              {v}
                            </SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Intent to act</Label>
                      <Select value={asString(r.intent) || 'no'} onValueChange={(v) => setIntake((p) => {
                const risks = [...p.risks];
                risks[idx] = { ...risks[idx], intent: v };
                return { ...p, risks };
            })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {['yes', 'no', 'not_applicable'].map((v) => (<SelectItem key={v} value={v}>
                              {v.replaceAll('_', ' ')}
                            </SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Plan / means</Label>
                      <Input spellCheck value={asString(r.plan)} onChange={(e) => setIntake((p) => {
                const risks = [...p.risks];
                risks[idx] = { ...risks[idx], plan: e.target.value };
                return { ...p, risks };
            })}/>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Risk factors</Label>
                      <Textarea spellCheck value={asString(r.riskFactors)} onChange={(e) => setIntake((p) => {
                const risks = [...p.risks];
                risks[idx] = { ...risks[idx], riskFactors: e.target.value };
                return { ...p, risks };
            })} rows={3}/>
                    </div>
                    <div className="space-y-2">
                      <Label>Protective factors</Label>
                      <Textarea spellCheck value={asString(r.protectiveFactors)} onChange={(e) => setIntake((p) => {
                const risks = [...p.risks];
                risks[idx] = { ...risks[idx], protectiveFactors: e.target.value };
                return { ...p, risks };
            })} rows={3}/>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Additional details</Label>
                    <Textarea spellCheck value={asString(r.details)} onChange={(e) => setIntake((p) => {
                const risks = [...p.risks];
                risks[idx] = { ...risks[idx], details: e.target.value };
                return { ...p, risks };
            })} rows={3}/>
                  </div>
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => setIntake((p) => ({ ...p, risks: p.risks.filter((_, i) => i !== idx) }))} disabled={intake.risks.length <= 1}>
                      Remove area
                    </Button>
                  </div>
                </div>))}
              <Button variant="outline" onClick={() => setIntake((p) => ({
            ...p,
            risks: [
                ...p.risks,
                {
                    area: 'additional',
                    level: 'none',
                    intent: 'no',
                    plan: '',
                    riskFactors: '',
                    protectiveFactors: '',
                    details: '',
                },
            ],
        }))}>
                Add risk area
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Objective content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea spellCheck value={intake.objectiveContent} onChange={(e) => setIntake((p) => ({ ...p, objectiveContent: e.target.value }))} rows={4}/>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Identification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea spellCheck value={intake.identification} onChange={(e) => setIntake((p) => ({ ...p, identification: e.target.value }))} rows={3}/>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>History</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {[
            ['History of problem', 'historyOfProblem'],
            ['Therapy history', 'therapyHistory'],
            ['Trauma history', 'traumaHistory'],
            ['Family psychological history', 'familyHistory'],
            ['Medical conditions', 'medicalConditions'],
            ['Current medications', 'medications'],
            ['Substances', 'substances'],
        ].map(([label, key]) => (<div key={key} className="space-y-2">
                  <Label>{label}</Label>
                  <Textarea spellCheck value={intake[key]} onChange={(e) => setIntake((p) => ({ ...p, [key]: e.target.value }))} rows={4}/>
                </div>))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SNAP</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {[
            ['Strengths', 'snapStrengths'],
            ['Needs', 'snapNeeds'],
            ['Abilities', 'snapAbilities'],
            ['Preferences', 'snapPreferences'],
        ].map(([label, key]) => (<div key={key} className="space-y-2">
                  <Label>{label}</Label>
                  <Textarea spellCheck value={intake[key]} onChange={(e) => setIntake((p) => ({ ...p, [key]: e.target.value }))} rows={3}/>
                </div>))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea spellCheck value={intake.plan} onChange={(e) => setIntake((p) => ({ ...p, plan: e.target.value }))} rows={4}/>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Diagnosis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Search</Label>
                <Input spellCheck value={intake.diagnosisQuery} onChange={(e) => setIntake((p) => ({ ...p, diagnosisQuery: e.target.value }))}/>
                {dxSuggestions.length > 0 ? (<div className="rounded-md border p-2 space-y-1">
                    {dxSuggestions.map((d) => (<button key={d.id} type="button" className="w-full text-left rounded px-2 py-1 hover:bg-gray-50" onClick={() => setIntake((p) => ({ ...p, diagnosisSelected: d, diagnosisQuery: `${d.code} ${d.name}` }))}>
                        <span className="font-medium">{d.code}</span> {d.name}
                      </button>))}
                  </div>) : null}
              </div>
              <div className="space-y-2">
                <Label>Justification</Label>
                <Textarea spellCheck value={intake.diagnosisJustification} onChange={(e) => setIntake((p) => ({ ...p, diagnosisJustification: e.target.value }))} rows={3}/>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Session Context</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <Label>Therapy approach (optional)</Label>
                <Input spellCheck value={progress.approach} onChange={(e) => setProgress((p) => ({ ...p, approach: e.target.value }))} placeholder="e.g., CBT, DBT"/>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Subjective</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea spellCheck value={progress.subjective} onChange={(e) => setProgress((p) => ({ ...p, subjective: e.target.value }))} rows={4}/>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Objective</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea spellCheck value={progress.objective} onChange={(e) => setProgress((p) => ({ ...p, objective: e.target.value }))} rows={4}/>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mental status</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {MSE_FIELDS.map((f) => {
            const options = MSE_OPTIONS_BY_FIELD[f] || MSE_OPTIONS;
            return (<div key={f} className="space-y-2">
                    <Label className="capitalize">{f.replaceAll(/([A-Z])/g, ' $1')}</Label>
                    <Select value={progress.mse[f]} onValueChange={(v) => setProgress((p) => ({ ...p, mse: { ...p.mse, [f]: v } }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {options.map((o) => (<SelectItem key={o} value={o}>
                            {o.replaceAll('_', ' ')}
                          </SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>);
        })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Risk assessment</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Level</Label>
                <Select value={progress.riskLevel || 'none'} onValueChange={(v) => setProgress((p) => ({ ...p, riskLevel: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RISK_LEVELS.map((v) => (<SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Notes</Label>
                <Textarea spellCheck value={progress.riskNotes} onChange={(e) => setProgress((p) => ({ ...p, riskNotes: e.target.value }))} rows={3}/>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Outcome measure</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea spellCheck value={progress.outcomeMeasures} onChange={(e) => setProgress((p) => ({ ...p, outcomeMeasures: e.target.value }))} rows={3}/>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Interventions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea spellCheck value={progress.interventions} onChange={(e) => setProgress((p) => ({ ...p, interventions: e.target.value }))} rows={4}/>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Progress toward goals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea spellCheck value={progress.progressTowardGoals} onChange={(e) => setProgress((p) => ({ ...p, progressTowardGoals: e.target.value }))} rows={3}/>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Updated plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea spellCheck value={progress.updatedPlan} onChange={(e) => setProgress((p) => ({ ...p, updatedPlan: e.target.value }))} rows={4}/>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Change / terminate treatment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea spellCheck value={progress.changeOrTerminate} onChange={(e) => setProgress((p) => ({ ...p, changeOrTerminate: e.target.value }))} rows={3}/>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <SignaturePadDialog open={signOpen} onOpenChange={setSignOpen} saving={signing} defaultTypedName={meta.clinician} title="Sign session note" description="Pick draw or type. Your signature is stored alongside the note with a timestamp." onConfirm={async ({ method, signatureDataUrl }) => {
            await sign(method, signatureDataUrl);
        }}/>

      <div className="sticky bottom-0 -mx-6 mt-8 border-t bg-white/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <Button onClick={save} disabled={saving} size="lg">
            <Save className="h-4 w-4 mr-2"/>
            {saving ? 'Saving…' : 'Save'}
          </Button>
          <Button onClick={() => setSignOpen(true)} disabled={signing} variant="outline" size="lg">
            <PenLine className="h-4 w-4 mr-2"/>
            {signing ? 'Signing…' : 'Sign'}
          </Button>
        </div>
      </div>
    </div>);
}
