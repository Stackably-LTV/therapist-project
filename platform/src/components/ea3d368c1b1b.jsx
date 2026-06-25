'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { PenLine } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/c0ebd3fbafc6';
import { Button } from '@/components/2795b661f080';
import { Input } from '@/components/c2f62fb0cb5e';
import { Label } from '@/components/78846397f3ca';
import { Textarea } from '@/components/e1d2ad49fd73';
import { Switch } from '@/components/395ec797588e';
import { Badge } from '@/components/30348591d689';
import { SignaturePadDialog } from '@/components/4729b2e45bb9';
const GOAL_STATUSES = ['not_started', 'in_progress', 'achieved', 'revised'];
const OBJ_STATUSES = ['not_started', 'in_progress', 'achieved', 'revised'];
const STATUS_CONFIG = {
    draft: { label: 'Draft', className: 'bg-muted text-muted-foreground border-border' },
    sent: { label: 'Sent', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    active: { label: 'Active', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    archived: { label: 'Archived', className: 'bg-muted/60 text-muted-foreground border-border' },
    completed: { label: 'Completed', className: 'bg-blue-50 text-blue-700 border-blue-200' },
    on_hold: { label: 'On Hold', className: 'bg-orange-50 text-orange-700 border-orange-200' },
    terminated: { label: 'Terminated', className: 'bg-destructive/10 text-destructive border-destructive/20' },
};
function formatDate(iso) {
    if (!iso)
        return '';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function formatBytes(bytes) {
    if (!bytes)
        return '';
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1048576)
        return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
}
function ConfirmButton({ label, confirmLabel, onConfirm, variant = 'outline', size = 'sm', disabled, className, }) {
    const [confirming, setConfirming] = useState(false);
    if (confirming) {
        return (<span className="flex items-center gap-1">
        <Button type="button" size={size} variant="destructive" disabled={disabled} onClick={() => { setConfirming(false); onConfirm(); }}>
          {confirmLabel}
        </Button>
        <Button type="button" size={size} variant="outline" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </span>);
    }
    return (<Button type="button" size={size} variant={variant} disabled={disabled} className={className} onClick={() => setConfirming(true)}>
      {label}
    </Button>);
}
export function TreatmentPlanBuilder({ patientId }) {
    const [loading, setLoading] = useState(true);
    const [allBundles, setAllBundles] = useState([]);
    const [bundle, setBundle] = useState(null);
    const [saving, setSaving] = useState(false);
    const [creatingModule, setCreatingModule] = useState(false);
    const [newModuleName, setNewModuleName] = useState('');
    const [sending, setSending] = useState(false);
    const [signing, setSigning] = useState(false);
    const [signOpen, setSignOpen] = useState(false);
    const [versioning, setVersioning] = useState(false);
    const [versions, setVersions] = useState([]);
    const [versionsOpen, setVersionsOpen] = useState(false);
    const [attachments, setAttachments] = useState([]);
    const [uploadingFile, setUploadingFile] = useState(false);
    const fileInputRef = useRef(null);
    const [diagnosisQuery, setDiagnosisQuery] = useState('');
    const [diagnosisResults, setDiagnosisResults] = useState([]);
    const [diagnosisLoading, setDiagnosisLoading] = useState(false);
    const [planForm, setPlanForm] = useState({
        moduleName: '',
        diagnosisCodeId: '',
        diagnosisName: '',
        frequency: '',
        timeline: '',
        dischargePlan: '',
        additionalInfo: '',
        homework: '',
        medicalNecessityAcknowledged: false,
        medicalNecessityStatement: '',
    });
    // Goal add form
    const [goalForm, setGoalForm] = useState({ title: '', description: '' });
    const [addingGoal, setAddingGoal] = useState(false);
    const [submittingGoal, setSubmittingGoal] = useState(false);
    // Objective add form per goal
    const [objectiveForms, setObjectiveForms] = useState({});
    const [addingObjectiveFor, setAddingObjectiveFor] = useState(null);
    // Intervention add form
    const [interventionForm, setInterventionForm] = useState({ description: '', frequency: '', goalId: '' });
    const [addingIntervention, setAddingIntervention] = useState(false);
    // Inline goal editing
    const [editingGoalId, setEditingGoalId] = useState(null);
    const [editGoalForm, setEditGoalForm] = useState({});
    // Inline objective editing
    const [editingObjectiveId, setEditingObjectiveId] = useState(null);
    const [editObjectiveForm, setEditObjectiveForm] = useState({});
    // Inline intervention editing
    const [editingInterventionId, setEditingInterventionId] = useState(null);
    const [editInterventionForm, setEditInterventionForm] = useState({});
    const applyBundle = async (b) => {
        setBundle(b);
        setVersionsOpen(false);
        setVersions([]);
        setAddingGoal(false);
        setAddingObjectiveFor(null);
        setAddingIntervention(false);
        setEditingGoalId(null);
        setEditingObjectiveId(null);
        setEditingInterventionId(null);
        if (b?.plan) {
            setPlanForm({
                moduleName: b.plan.moduleName || '',
                diagnosisCodeId: b.plan.diagnosisCodeId || '',
                diagnosisName: b.plan.diagnosisName || '',
                frequency: b.plan.frequency || '',
                timeline: b.plan.timeline || '',
                dischargePlan: b.plan.dischargePlan || '',
                additionalInfo: b.plan.additionalInfo || '',
                homework: b.plan.homework || '',
                medicalNecessityAcknowledged: Boolean(b.plan.medicalNecessityAcknowledged),
                medicalNecessityStatement: b.plan.medicalNecessityStatement || '',
            });
            await loadAttachments(b.plan.id);
        }
    };
    const switchToBundle = async (b) => {
        if (b.plan.id === bundle?.plan?.id)
            return;
        await applyBundle(b);
    };
    const handleCreateModule = async () => {
        const name = newModuleName.trim();
        if (!name) {
            toast.error('Enter a module name');
            return;
        }
        setCreatingModule(false);
        setNewModuleName('');
        await createPlan(name);
    };
    const refresh = async (keepPlanId) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/therapist/patients/${patientId}/treatment-plans`, { cache: 'no-store' });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data?.error || 'Failed to load treatment plans');
            const fetched = (data?.bundles || []);
            setAllBundles(fetched);
            // Preserve selected plan if it still exists, else default to first.
            const targetId = keepPlanId ?? bundle?.plan?.id;
            const next = (targetId ? fetched.find((b) => b.plan.id === targetId) : null) ?? fetched[0] ?? null;
            await applyBundle(next);
        }
        catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to load treatment plans');
        }
        finally {
            setLoading(false);
        }
    };
    const loadAttachments = async (planId) => {
        try {
            const res = await fetch(`/api/therapist/treatment-plans/${planId}/attachments`);
            const data = await res.json().catch(() => ({}));
            if (res.ok)
                setAttachments((data?.attachments || []));
        }
        catch {
            // non-critical
        }
    };
    const loadVersions = async (planId) => {
        try {
            const res = await fetch(`/api/therapist/treatment-plans/${planId}/versions`);
            const data = await res.json().catch(() => ({}));
            if (res.ok)
                setVersions((data?.versions || []));
        }
        catch {
            // non-critical
        }
    };
    useEffect(() => {
        void refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [patientId]);
    useEffect(() => {
        if (bundle?.plan?.id && versionsOpen)
            void loadVersions(bundle.plan.id);
    }, [versionsOpen, bundle?.plan?.id]);
    useEffect(() => {
        let cancelled = false;
        async function search() {
            const q = diagnosisQuery.trim();
            if (q.length < 2) {
                setDiagnosisResults([]);
                setDiagnosisLoading(false);
                return;
            }
            setDiagnosisLoading(true);
            try {
                const res = await fetch(`/api/diagnosis/search?q=${encodeURIComponent(q)}`, { cache: 'no-store' });
                const data = await res.json().catch(() => ({}));
                if (!res.ok)
                    throw new Error(data?.error || 'Diagnosis search failed');
                if (!cancelled)
                    setDiagnosisResults((data?.diagnoses || []));
            }
            catch {
                if (!cancelled)
                    setDiagnosisResults([]);
            }
            finally {
                if (!cancelled)
                    setDiagnosisLoading(false);
            }
        }
        void search();
        return () => { cancelled = true; };
    }, [diagnosisQuery]);
    const objectivesByGoal = useMemo(() => {
        const map = new Map();
        for (const o of bundle?.objectives || []) {
            const arr = map.get(o.goalId) || [];
            arr.push(o);
            map.set(o.goalId, arr);
        }
        for (const arr of map.values())
            arr.sort((a, b) => a.position - b.position);
        return map;
    }, [bundle?.objectives]);
    const isReadOnly = bundle?.plan?.status === 'sent' || bundle?.plan?.status === 'archived';
    const createPlan = async (moduleName) => {
        setSaving(true);
        try {
            const res = await fetch(`/api/therapist/patients/${patientId}/treatment-plans`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    moduleName: moduleName || planForm.moduleName || null,
                    diagnosisCodeId: planForm.diagnosisCodeId || null,
                    diagnosisName: planForm.diagnosisName || null,
                    frequency: planForm.frequency || null,
                    timeline: planForm.timeline || null,
                    dischargePlan: planForm.dischargePlan || null,
                    additionalInfo: planForm.additionalInfo || null,
                    homework: planForm.homework || null,
                    medicalNecessityAcknowledged: Boolean(planForm.medicalNecessityAcknowledged),
                    medicalNecessityStatement: planForm.medicalNecessityStatement || null,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data?.error || 'Failed to create treatment plan');
            const newBundle = (data?.bundle || null);
            toast.success('Treatment plan module created');
            await refresh(newBundle?.plan?.id ?? undefined);
        }
        catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to create treatment plan');
        }
        finally {
            setSaving(false);
        }
    };
    const savePlan = async () => {
        if (!bundle?.plan?.id)
            return;
        setSaving(true);
        try {
            const res = await fetch(`/api/therapist/treatment-plans/${bundle.plan.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    moduleName: planForm.moduleName || null,
                    diagnosisCodeId: planForm.diagnosisCodeId || null,
                    diagnosisName: planForm.diagnosisName || null,
                    frequency: planForm.frequency || null,
                    timeline: planForm.timeline || null,
                    dischargePlan: planForm.dischargePlan || null,
                    additionalInfo: planForm.additionalInfo || null,
                    homework: planForm.homework || null,
                    medicalNecessityAcknowledged: Boolean(planForm.medicalNecessityAcknowledged),
                    medicalNecessityStatement: planForm.medicalNecessityStatement || null,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data?.error || 'Failed to save treatment plan');
            setBundle((b) => b ? { ...b, plan: data.plan } : b);
            toast.success('Plan saved');
        }
        catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to save plan');
        }
        finally {
            setSaving(false);
        }
    };
    const sendPlan = async () => {
        if (!bundle?.plan?.id)
            return;
        setSending(true);
        try {
            const res = await fetch(`/api/therapist/treatment-plans/${bundle.plan.id}/send`, { method: 'POST' });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data?.error || 'Failed to send plan');
            setBundle((b) => b ? { ...b, plan: data.plan } : b);
            toast.success('Plan sent to client');
        }
        catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to send plan');
        }
        finally {
            setSending(false);
        }
    };
    const signPlan = async (signatureMethod, signatureDataUrl) => {
        if (!bundle?.plan?.id)
            return;
        setSigning(true);
        try {
            const res = await fetch(`/api/therapist/treatment-plans/${bundle.plan.id}/sign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ signatureMethod, signatureDataUrl }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data?.error || 'Failed to sign plan');
            setBundle((b) => b
                ? {
                    ...b,
                    plan: {
                        ...b.plan,
                        signedAt: data.plan?.signed_at ?? null,
                        signedBy: data.plan?.signed_by ?? null,
                        signatureMethod: data.plan?.signature_method ?? null,
                        signatureDataUrl: data.plan?.signature_data_url ?? null,
                    },
                }
                : b);
            setSignOpen(false);
            toast.success('Plan signed');
        }
        catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to sign plan');
        }
        finally {
            setSigning(false);
        }
    };
    const createNewVersion = async () => {
        if (!bundle?.plan?.id)
            return;
        setVersioning(true);
        try {
            const res = await fetch(`/api/therapist/treatment-plans/${bundle.plan.id}/version`, { method: 'POST' });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data?.error || 'Failed to create new version');
            const nextVersion = (data?.bundle?.plan?.version ?? '?');
            // Refresh from DB so the builder always reflects the live plan state.
            await refresh();
            toast.success(`New v${nextVersion} created — plan is now a draft`);
        }
        catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to create new version');
        }
        finally {
            setVersioning(false);
        }
    };
    // --- Goals ---
    const submitAddGoal = async () => {
        if (!bundle?.plan?.id || !goalForm.title.trim() || submittingGoal)
            return;
        setSubmittingGoal(true);
        try {
            const res = await fetch(`/api/therapist/treatment-plans/${bundle.plan.id}/goals`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: goalForm.title.trim(), description: goalForm.description.trim() || null }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data?.error || 'Failed to add goal');
            setGoalForm({ title: '', description: '' });
            setAddingGoal(false);
            await refresh();
            toast.success(data?.duplicate ? 'Goal already exists' : 'Goal added');
        }
        catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to add goal');
        }
        finally {
            setSubmittingGoal(false);
        }
    };
    const saveGoal = async (goalId) => {
        if (!bundle?.plan?.id)
            return;
        try {
            const res = await fetch(`/api/therapist/treatment-plans/${bundle.plan.id}/goals/${goalId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editGoalForm),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data?.error || 'Failed to update goal');
            setBundle((b) => b ? { ...b, goals: b.goals.map((g) => (g.id === goalId ? data.goal : g)) } : b);
            setEditingGoalId(null);
            toast.success('Goal updated');
        }
        catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to update goal');
        }
    };
    const deleteGoal = async (goalId) => {
        if (!bundle?.plan?.id)
            return;
        try {
            const res = await fetch(`/api/therapist/treatment-plans/${bundle.plan.id}/goals/${goalId}`, { method: 'DELETE' });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data?.error || 'Failed to delete goal');
            await refresh();
            toast.success('Goal deleted');
        }
        catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to delete goal');
        }
    };
    // --- Objectives ---
    const submitAddObjective = async (goalId) => {
        if (!bundle?.plan?.id)
            return;
        const form = objectiveForms[goalId];
        if (!form?.description?.trim())
            return;
        try {
            const res = await fetch(`/api/therapist/treatment-plans/${bundle.plan.id}/goals/${goalId}/objectives`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    description: form.description.trim(),
                    measurableCriteria: form.measurableCriteria?.trim() || null,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data?.error || 'Failed to add objective');
            setObjectiveForms((f) => ({ ...f, [goalId]: { description: '', measurableCriteria: '' } }));
            setAddingObjectiveFor(null);
            await refresh();
            toast.success('Objective added');
        }
        catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to add objective');
        }
    };
    const saveObjective = async (objectiveId) => {
        if (!bundle?.plan?.id)
            return;
        try {
            const res = await fetch(`/api/therapist/treatment-plans/${bundle.plan.id}/objectives/${objectiveId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editObjectiveForm),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data?.error || 'Failed to update objective');
            setBundle((b) => b ? { ...b, objectives: (b.objectives ?? []).map((o) => (o.id === objectiveId ? data.objective : o)) } : b);
            setEditingObjectiveId(null);
            toast.success('Objective updated');
        }
        catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to update objective');
        }
    };
    const deleteObjective = async (objectiveId) => {
        if (!bundle?.plan?.id)
            return;
        try {
            const res = await fetch(`/api/therapist/treatment-plans/${bundle.plan.id}/objectives/${objectiveId}`, { method: 'DELETE' });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data?.error || 'Failed to delete objective');
            await refresh();
            toast.success('Objective deleted');
        }
        catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to delete objective');
        }
    };
    // --- Interventions ---
    const submitAddIntervention = async () => {
        if (!bundle?.plan?.id || !interventionForm.description.trim())
            return;
        try {
            const res = await fetch(`/api/therapist/treatment-plans/${bundle.plan.id}/interventions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    description: interventionForm.description.trim(),
                    frequency: interventionForm.frequency.trim() || null,
                    goalId: interventionForm.goalId || null,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data?.error || 'Failed to add intervention');
            setInterventionForm({ description: '', frequency: '', goalId: '' });
            setAddingIntervention(false);
            await refresh();
            toast.success('Intervention added');
        }
        catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to add intervention');
        }
    };
    const saveIntervention = async (interventionId) => {
        if (!bundle?.plan?.id)
            return;
        try {
            const res = await fetch(`/api/therapist/treatment-plans/${bundle.plan.id}/interventions/${interventionId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editInterventionForm),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data?.error || 'Failed to update intervention');
            setBundle((b) => b ? { ...b, interventions: b.interventions.map((i) => (i.id === interventionId ? data.intervention : i)) } : b);
            setEditingInterventionId(null);
            toast.success('Intervention updated');
        }
        catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to update intervention');
        }
    };
    const deleteIntervention = async (interventionId) => {
        if (!bundle?.plan?.id)
            return;
        try {
            const res = await fetch(`/api/therapist/treatment-plans/${bundle.plan.id}/interventions/${interventionId}`, { method: 'DELETE' });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data?.error || 'Failed to delete intervention');
            await refresh();
            toast.success('Intervention deleted');
        }
        catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to delete intervention');
        }
    };
    // --- Attachments ---
    const uploadFile = async (file) => {
        if (!bundle?.plan?.id)
            return;
        setUploadingFile(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await fetch(`/api/therapist/treatment-plans/${bundle.plan.id}/attachments`, { method: 'POST', body: fd });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data?.error || 'Upload failed');
            await loadAttachments(bundle.plan.id);
            toast.success('Attachment uploaded');
        }
        catch (e) {
            toast.error(e instanceof Error ? e.message : 'Upload failed');
        }
        finally {
            setUploadingFile(false);
            if (fileInputRef.current)
                fileInputRef.current.value = '';
        }
    };
    const deleteAttachment = async (attachmentId) => {
        if (!bundle?.plan?.id)
            return;
        try {
            const res = await fetch(`/api/therapist/treatment-plans/${bundle.plan.id}/attachments/${attachmentId}`, { method: 'DELETE' });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data?.error || 'Failed to delete');
            setAttachments((a) => a.filter((x) => x.id !== attachmentId));
            toast.success('Attachment removed');
        }
        catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to delete attachment');
        }
    };
    const [changingStatus, setChangingStatus] = useState(false);
    const changeStatus = async (newStatus) => {
        if (!bundle?.plan?.id)
            return;
        setChangingStatus(true);
        try {
            const res = await fetch(`/api/therapist/treatment-plans/${bundle.plan.id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data?.error || 'Failed to update status');
            setBundle((b) => b ? { ...b, plan: { ...b.plan, status: newStatus } } : b);
            toast.success('Plan status updated');
        }
        catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to update status');
        }
        finally {
            setChangingStatus(false);
        }
    };
    if (loading)
        return <div className="text-sm text-muted-foreground py-4">Loading treatment plans…</div>;
    const plan = bundle?.plan;
    const statusCfg = plan ? (STATUS_CONFIG[plan.status] ?? STATUS_CONFIG.draft) : null;
    return (<div className="space-y-6">

      {/* ── Module selector bar ── */}
      <div className="flex flex-wrap items-center gap-2">
        {allBundles.map((b) => {
            const label = b.plan.moduleName || b.plan.diagnosisName || 'General';
            const isSelected = b.plan.id === bundle?.plan?.id;
            const scfg = STATUS_CONFIG[b.plan.status] ?? STATUS_CONFIG.draft;
            return (<button key={b.plan.id} type="button" onClick={() => void switchToBundle(b)} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors ${isSelected
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-background text-foreground border-border hover:bg-muted'}`}>
              {label}
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${scfg.className}`}>
                {scfg.label}
              </Badge>
            </button>);
        })}
        {!creatingModule && (<Button size="sm" variant="outline" onClick={() => setCreatingModule(true)}>
            + New Module
          </Button>)}
      </div>

      {/* ── New module creation form ── */}
      {creatingModule && (<Card>
          <CardContent className="p-4">
            <p className="text-sm font-semibold mb-3">New Treatment Plan Module</p>
            <div className="flex flex-wrap gap-2 items-center">
              <Input placeholder="Module name — e.g. Anxiety, CBT Skills, Trauma, Depression" value={newModuleName} onChange={(e) => setNewModuleName(e.target.value)} onKeyDown={(e) => {
                if (e.key === 'Enter')
                    void handleCreateModule();
            }} className="max-w-sm" autoFocus/>
              <Button size="sm" onClick={() => void handleCreateModule()} disabled={saving || !newModuleName.trim()}>
                {saving ? 'Creating…' : 'Create Module'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setCreatingModule(false); setNewModuleName(''); }}>
                Cancel
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Each module is an independent treatment plan for a specific therapeutic focus.
            </p>
          </CardContent>
        </Card>)}

      {/* ── Header card ── */}
      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1">
              <CardTitle>Treatment plan</CardTitle>
              <CardDescription className="flex flex-wrap items-center gap-2">
                {plan ? (<>
                    <span className="font-medium text-foreground">v{plan.version}</span>
                    <span className="text-muted-foreground">•</span>
                    {statusCfg && (<Badge variant="outline" className={statusCfg.className}>
                        {statusCfg.label}
                      </Badge>)}
                    {plan.status === 'active' && plan.acknowledgedAt && (<span className="text-xs text-muted-foreground">
                        Acknowledged {formatDate(plan.acknowledgedAt)}
                      </span>)}
                    {plan.status === 'sent' && plan.sentAt && (<span className="text-xs text-amber-600">
                        Awaiting acknowledgment since {formatDate(plan.sentAt)}
                      </span>)}
                    {plan.status === 'archived' && (<span className="text-xs text-muted-foreground">Archived — superseded</span>)}
                  </>) : ('Create a plan for this patient.')}
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {!plan && (<Button onClick={() => setCreatingModule(true)} disabled={saving}>
                  Create first module
                </Button>)}
              {plan?.status === 'draft' && (<>
                  <Button variant="outline" onClick={() => void savePlan()} disabled={saving}>
                    {saving ? 'Saving…' : 'Save'}
                  </Button>
                  <Button variant="outline" onClick={() => setSignOpen(true)} disabled={signing || !!plan?.signedAt}>
                    <PenLine className="mr-2 h-4 w-4"/>
                    {plan?.signedAt ? 'Signed' : signing ? 'Signing…' : 'Sign'}
                  </Button>
                  <ConfirmButton label="Send to Client" confirmLabel="Confirm Send" onConfirm={() => void sendPlan()} disabled={sending} variant="default"/>
                </>)}
              {plan?.status === 'sent' && (<>
                  <span className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm text-amber-700">
                    Awaiting acknowledgment
                  </span>
                  <ConfirmButton label="Retract to Draft" confirmLabel="Confirm — plan goes back to draft" onConfirm={() => void changeStatus('draft')} disabled={changingStatus} variant="outline"/>
                </>)}
              {(plan?.status === 'active' || plan?.status === 'on_hold') && (<>
                  <Button variant="outline" onClick={() => void savePlan()} disabled={saving}>
                    {saving ? 'Saving…' : 'Save'}
                  </Button>
                  <select className="rounded-md border bg-background px-3 py-1.5 text-sm" defaultValue="" disabled={changingStatus} onChange={(e) => {
                if (e.target.value)
                    void changeStatus(e.target.value);
            }}>
                    <option value="" disabled>Change status…</option>
                    {plan.status === 'active' && (<>
                        <option value="on_hold">On Hold</option>
                        <option value="completed">Completed</option>
                        <option value="terminated">Terminated</option>
                      </>)}
                    {plan.status === 'on_hold' && (<option value="active">Reactivate</option>)}
                  </select>
                  <ConfirmButton label="New Version" confirmLabel="Confirm — this archives the current plan" onConfirm={() => void createNewVersion()} disabled={versioning || plan.status !== 'active'} variant="outline"/>
                </>)}
              {plan?.status === 'archived' && (<span className="rounded-md border px-3 py-1.5 text-sm text-muted-foreground">
                  Archived — read only
                </span>)}
            </div>
          </div>
        </CardHeader>

        {plan && (<CardContent className="grid gap-5 md:grid-cols-2">
            {/* Module name */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="tp-module-name">Module Name</Label>
              <Input id="tp-module-name" placeholder="e.g. Anxiety, CBT Skills, Trauma, Depression" value={planForm.moduleName} onChange={(e) => setPlanForm((f) => ({ ...f, moduleName: e.target.value }))} disabled={isReadOnly}/>
              <p className="text-xs text-muted-foreground">Labels this plan module — visible to the seeker.</p>
            </div>

            {/* Diagnosis */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="tp-diagnosis-search">Diagnosis</Label>
              {!isReadOnly && (<>
                  <Input id="tp-diagnosis-search" value={diagnosisQuery} onChange={(e) => setDiagnosisQuery(e.target.value)} placeholder="Search diagnosis (e.g., F32.9 or depression)"/>
                  {diagnosisLoading && <div className="text-xs text-muted-foreground">Searching…</div>}
                  {diagnosisResults.length > 0 && (<div className="mt-2 max-h-44 overflow-auto rounded-lg border">
                      {diagnosisResults.map((d) => (<button key={d.id} type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-muted" onClick={() => {
                            setPlanForm((p) => ({ ...p, diagnosisCodeId: d.id, diagnosisName: `${d.code} — ${d.name}` }));
                            setDiagnosisResults([]);
                            setDiagnosisQuery('');
                        }}>
                          <div className="font-medium">{d.code} <span className="text-muted-foreground">({d.system})</span></div>
                          <div className="text-xs text-muted-foreground">{d.name}</div>
                        </button>))}
                    </div>)}
                </>)}
              <div className="flex flex-col gap-2 rounded-lg border p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="text-sm font-medium">Selected diagnosis</div>
                  {!isReadOnly && planForm.diagnosisName?.trim() && (<Button type="button" variant="outline" size="sm" onClick={() => setPlanForm((p) => ({ ...p, diagnosisCodeId: '', diagnosisName: '' }))}>
                      Clear
                    </Button>)}
                </div>
                <Input value={planForm.diagnosisName} onChange={(e) => !isReadOnly && setPlanForm((p) => ({ ...p, diagnosisName: e.target.value }))} placeholder="Diagnosis statement" readOnly={isReadOnly} className={isReadOnly ? 'bg-muted/50' : ''}/>
              </div>
            </div>

            {/* Frequency & Timeline */}
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Input value={planForm.frequency} onChange={(e) => !isReadOnly && setPlanForm((p) => ({ ...p, frequency: e.target.value }))} placeholder="Weekly, biweekly, PRN…" readOnly={isReadOnly} className={isReadOnly ? 'bg-muted/50' : ''}/>
            </div>
            <div className="space-y-2">
              <Label>Timeline</Label>
              <Input value={planForm.timeline} onChange={(e) => !isReadOnly && setPlanForm((p) => ({ ...p, timeline: e.target.value }))} placeholder="e.g., 8–12 weeks" readOnly={isReadOnly} className={isReadOnly ? 'bg-muted/50' : ''}/>
            </div>

            {/* Homework */}
            <div className="space-y-2 md:col-span-2">
              <Label>Homework / between-session tasks</Label>
              <Textarea value={planForm.homework} onChange={(e) => !isReadOnly && setPlanForm((p) => ({ ...p, homework: e.target.value }))} rows={3} placeholder="Exercises, readings, or tasks for the client to do between sessions…" readOnly={isReadOnly} className={isReadOnly ? 'bg-muted/50' : ''} spellCheck/>
            </div>

            {/* Discharge plan */}
            <div className="space-y-2 md:col-span-2">
              <Label>Discharge plan</Label>
              <Textarea value={planForm.dischargePlan} onChange={(e) => !isReadOnly && setPlanForm((p) => ({ ...p, dischargePlan: e.target.value }))} rows={3} readOnly={isReadOnly} className={isReadOnly ? 'bg-muted/50' : ''} spellCheck/>
            </div>

            {/* Additional info */}
            <div className="space-y-2 md:col-span-2">
              <Label>Additional info</Label>
              <Textarea value={planForm.additionalInfo} onChange={(e) => !isReadOnly && setPlanForm((p) => ({ ...p, additionalInfo: e.target.value }))} rows={3} readOnly={isReadOnly} className={isReadOnly ? 'bg-muted/50' : ''} spellCheck/>
            </div>

            {/* Medical necessity */}
            <div className="space-y-2 md:col-span-2">
              <Label>Medical necessity</Label>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="min-w-0">
                  <div className="font-medium">Medically necessary and appropriate</div>
                  <div className="text-sm text-muted-foreground">Required for documentation.</div>
                </div>
                <Switch checked={planForm.medicalNecessityAcknowledged} onCheckedChange={(checked) => !isReadOnly && setPlanForm((p) => ({ ...p, medicalNecessityAcknowledged: checked }))} disabled={isReadOnly}/>
              </div>
              <Textarea value={planForm.medicalNecessityStatement} onChange={(e) => !isReadOnly && setPlanForm((p) => ({ ...p, medicalNecessityStatement: e.target.value }))} placeholder="Optional statement" rows={2} readOnly={isReadOnly} className={isReadOnly ? 'bg-muted/50' : ''} spellCheck/>
            </div>
          </CardContent>)}
      </Card>

      {/* ── Goals ── */}
      {plan && (<Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Goals</CardTitle>
                <CardDescription>Therapeutic goals with measurable objectives.</CardDescription>
              </div>
              {!isReadOnly && !addingGoal && (<Button size="sm" variant="outline" onClick={() => setAddingGoal(true)}>
                  + Add goal
                </Button>)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add goal form */}
            {!isReadOnly && addingGoal && (<div className="rounded-lg border border-dashed p-4 space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Goal title *</Label>
                  <Input value={goalForm.title} onChange={(e) => setGoalForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g., Reduce anxiety symptoms" autoFocus/>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Description (optional)</Label>
                  <Textarea value={goalForm.description} onChange={(e) => setGoalForm((f) => ({ ...f, description: e.target.value }))} rows={2} placeholder="Additional context…"/>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => void submitAddGoal()} disabled={!goalForm.title.trim() || submittingGoal}>
                    {submittingGoal ? 'Adding...' : 'Add goal'}
                  </Button>
                  <Button size="sm" variant="outline" disabled={submittingGoal} onClick={() => { setAddingGoal(false); setGoalForm({ title: '', description: '' }); }}>
                    Cancel
                  </Button>
                </div>
              </div>)}

            {bundle?.goals.length === 0 && !addingGoal && (<p className="text-sm text-muted-foreground">No goals yet. Add a goal to get started.</p>)}

            {/* Goal list */}
            {bundle?.goals.map((goal) => {
                const objs = objectivesByGoal.get(goal.id) || [];
                const isEditingThis = editingGoalId === goal.id;
                const objForm = objectiveForms[goal.id] ?? { description: '', measurableCriteria: '' };
                return (<div key={goal.id} className="rounded-lg border p-4 space-y-3">
                  {/* Goal header */}
                  {isEditingThis ? (<div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Title</Label>
                        <Input value={String(editGoalForm.title ?? goal.title)} onChange={(e) => setEditGoalForm((f) => ({ ...f, title: e.target.value }))}/>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Description</Label>
                        <Textarea value={String(editGoalForm.description ?? goal.description ?? '')} onChange={(e) => setEditGoalForm((f) => ({ ...f, description: e.target.value }))} rows={2}/>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Status</Label>
                          <select value={String(editGoalForm.status ?? goal.status)} onChange={(e) => setEditGoalForm((f) => ({ ...f, status: e.target.value }))} className="w-full rounded-md border bg-background px-3 py-1.5 text-sm">
                            {GOAL_STATUSES.map((s) => (<option key={s} value={s}>{s.replace('_', ' ')}</option>))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Progress ({editGoalForm.progress ?? goal.progress}%)</Label>
                          <input type="range" min={0} max={100} step={5} value={Number(editGoalForm.progress ?? goal.progress)} onChange={(e) => setEditGoalForm((f) => ({ ...f, progress: Number(e.target.value) }))} className="w-full"/>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Target date</Label>
                        <Input type="date" value={String(editGoalForm.targetDate ?? goal.targetDate ?? '')} onChange={(e) => setEditGoalForm((f) => ({ ...f, targetDate: e.target.value || null }))}/>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => void saveGoal(goal.id)}>Save</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingGoalId(null)}>Cancel</Button>
                      </div>
                    </div>) : (<div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-sm">{goal.title}</p>
                          <Badge variant="outline" className="text-xs capitalize">
                            {goal.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        {goal.description && (<p className="mt-1 text-xs text-muted-foreground">{goal.description}</p>)}
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${goal.progress}%` }}/>
                          </div>
                          <span className="text-xs text-muted-foreground w-8 text-right">{goal.progress}%</span>
                        </div>
                        {goal.targetDate && (<p className="mt-1 text-xs text-muted-foreground">Target: {formatDate(goal.targetDate)}</p>)}
                      </div>
                      {!isReadOnly && (<div className="flex gap-1 shrink-0">
                          <Button size="sm" variant="ghost" onClick={() => { setEditingGoalId(goal.id); setEditGoalForm({ ...goal }); }}>
                            Edit
                          </Button>
                          <ConfirmButton label="Delete" confirmLabel="Confirm" onConfirm={() => void deleteGoal(goal.id)} variant="outline"/>
                        </div>)}
                    </div>)}

                  {/* Objectives */}
                  {objs.length > 0 && (<div className="space-y-2 pl-4 border-l-2 border-muted">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Objectives</p>
                      {objs.map((obj) => {
                            const isEditingObj = editingObjectiveId === obj.id;
                            return (<div key={obj.id} className="rounded-md bg-muted/30 p-2.5">
                            {isEditingObj ? (<div className="space-y-2">
                                <Textarea value={String(editObjectiveForm.description ?? obj.description)} onChange={(e) => setEditObjectiveForm((f) => ({ ...f, description: e.target.value }))} rows={2} placeholder="Objective description"/>
                                <Input value={String(editObjectiveForm.measurableCriteria ?? obj.measurableCriteria ?? '')} onChange={(e) => setEditObjectiveForm((f) => ({ ...f, measurableCriteria: e.target.value || null }))} placeholder="Measurable criteria"/>
                                <div className="grid grid-cols-2 gap-2">
                                  <select value={String(editObjectiveForm.status ?? obj.status)} onChange={(e) => setEditObjectiveForm((f) => ({ ...f, status: e.target.value }))} className="w-full rounded-md border bg-background px-3 py-1.5 text-sm">
                                    {OBJ_STATUSES.map((s) => (<option key={s} value={s}>{s.replace('_', ' ')}</option>))}
                                  </select>
                                  <Input type="date" value={String(editObjectiveForm.dueDate ?? obj.dueDate ?? '')} onChange={(e) => setEditObjectiveForm((f) => ({ ...f, dueDate: e.target.value || null }))}/>
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => void saveObjective(obj.id)}>Save</Button>
                                  <Button size="sm" variant="outline" onClick={() => setEditingObjectiveId(null)}>Cancel</Button>
                                </div>
                              </div>) : (<div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm">{obj.description}</p>
                                  {obj.measurableCriteria && (<p className="text-xs text-muted-foreground mt-0.5">Criteria: {obj.measurableCriteria}</p>)}
                                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                    <span className="capitalize">{obj.status.replace('_', ' ')}</span>
                                    {obj.dueDate && <span>Due {formatDate(obj.dueDate)}</span>}
                                  </div>
                                </div>
                                {!isReadOnly && (<div className="flex gap-1 shrink-0">
                                    <Button size="sm" variant="ghost" onClick={() => { setEditingObjectiveId(obj.id); setEditObjectiveForm({ ...obj }); }}>
                                      Edit
                                    </Button>
                                    <ConfirmButton label="×" confirmLabel="Delete?" onConfirm={() => void deleteObjective(obj.id)} variant="outline"/>
                                  </div>)}
                              </div>)}
                          </div>);
                        })}
                    </div>)}

                  {/* Add objective */}
                  {!isReadOnly && (<div className="pl-4">
                      {addingObjectiveFor === goal.id ? (<div className="space-y-2 rounded-md border border-dashed p-3">
                          <Textarea value={objForm.description} onChange={(e) => setObjectiveForms((f) => ({ ...f, [goal.id]: { ...objForm, description: e.target.value } }))} rows={2} placeholder="Objective description *" autoFocus/>
                          <Input value={objForm.measurableCriteria} onChange={(e) => setObjectiveForms((f) => ({ ...f, [goal.id]: { ...objForm, measurableCriteria: e.target.value } }))} placeholder="Measurable criteria (optional)"/>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => void submitAddObjective(goal.id)} disabled={!objForm.description.trim()}>
                              Add
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setAddingObjectiveFor(null)}>Cancel</Button>
                          </div>
                        </div>) : (<button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => { setAddingObjectiveFor(goal.id); setObjectiveForms((f) => ({ ...f, [goal.id]: f[goal.id] ?? { description: '', measurableCriteria: '' } })); }}>
                          + Add objective
                        </button>)}
                    </div>)}
                </div>);
            })}
          </CardContent>
        </Card>)}

      {/* ── Interventions ── */}
      {plan && (<Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Interventions</CardTitle>
                <CardDescription>Strategies and techniques used in treatment.</CardDescription>
              </div>
              {!isReadOnly && !addingIntervention && (<Button size="sm" variant="outline" onClick={() => setAddingIntervention(true)}>
                  + Add intervention
                </Button>)}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {!isReadOnly && addingIntervention && (<div className="rounded-lg border border-dashed p-4 space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Description *</Label>
                  <Textarea value={interventionForm.description} onChange={(e) => setInterventionForm((f) => ({ ...f, description: e.target.value }))} rows={2} placeholder="e.g., Cognitive restructuring, exposure therapy…" autoFocus/>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Frequency (optional)</Label>
                    <Input value={interventionForm.frequency} onChange={(e) => setInterventionForm((f) => ({ ...f, frequency: e.target.value }))} placeholder="Per session, weekly…"/>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Link to goal (optional)</Label>
                    <select value={interventionForm.goalId} onChange={(e) => setInterventionForm((f) => ({ ...f, goalId: e.target.value }))} className="w-full rounded-md border bg-background px-3 py-1.5 text-sm">
                      <option value="">No linked goal</option>
                      {bundle?.goals.map((g) => (<option key={g.id} value={g.id}>{g.title}</option>))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => void submitAddIntervention()} disabled={!interventionForm.description.trim()}>
                    Add
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setAddingIntervention(false); setInterventionForm({ description: '', frequency: '', goalId: '' }); }}>
                    Cancel
                  </Button>
                </div>
              </div>)}

            {bundle?.interventions.length === 0 && !addingIntervention && (<p className="text-sm text-muted-foreground">No interventions yet.</p>)}

            {bundle?.interventions.map((intervention) => {
                const isEditingThis = editingInterventionId === intervention.id;
                const linkedGoal = bundle?.goals.find((g) => g.id === intervention.goalId);
                return (<div key={intervention.id} className="rounded-md border p-3">
                  {isEditingThis ? (<div className="space-y-3">
                      <Textarea value={String(editInterventionForm.description ?? intervention.description)} onChange={(e) => setEditInterventionForm((f) => ({ ...f, description: e.target.value }))} rows={2}/>
                      <div className="grid grid-cols-2 gap-3">
                        <Input value={String(editInterventionForm.frequency ?? intervention.frequency ?? '')} onChange={(e) => setEditInterventionForm((f) => ({ ...f, frequency: e.target.value || null }))} placeholder="Frequency"/>
                        <select value={String(editInterventionForm.goalId ?? intervention.goalId ?? '')} onChange={(e) => setEditInterventionForm((f) => ({ ...f, goalId: e.target.value || null }))} className="w-full rounded-md border bg-background px-3 py-1.5 text-sm">
                          <option value="">No linked goal</option>
                          {bundle?.goals.map((g) => (<option key={g.id} value={g.id}>{g.title}</option>))}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => void saveIntervention(intervention.id)}>Save</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingInterventionId(null)}>Cancel</Button>
                      </div>
                    </div>) : (<div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm">{intervention.description}</p>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {intervention.frequency && <span>{intervention.frequency}</span>}
                          {linkedGoal && <span>Goal: {linkedGoal.title}</span>}
                        </div>
                      </div>
                      {!isReadOnly && (<div className="flex gap-1 shrink-0">
                          <Button size="sm" variant="ghost" onClick={() => { setEditingInterventionId(intervention.id); setEditInterventionForm({ ...intervention }); }}>
                            Edit
                          </Button>
                          <ConfirmButton label="Delete" confirmLabel="Confirm" onConfirm={() => void deleteIntervention(intervention.id)} variant="outline"/>
                        </div>)}
                    </div>)}
                </div>);
            })}
          </CardContent>
        </Card>)}

      {/* ── Attachments ── */}
      {plan && (<Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Attachments</CardTitle>
                <CardDescription>PDF or image files shared with this plan (max 10 MB each).</CardDescription>
              </div>
              {!isReadOnly && (<Button size="sm" variant="outline" disabled={uploadingFile} onClick={() => fileInputRef.current?.click()}>
                  {uploadingFile ? 'Uploading…' : '+ Upload file'}
                </Button>)}
            </div>
            <input ref={fileInputRef} type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file)
                    void uploadFile(file);
            }}/>
          </CardHeader>
          <CardContent className="space-y-2">
            {attachments.length === 0 && (<p className="text-sm text-muted-foreground">No attachments yet.</p>)}
            {attachments.map((a) => (<div key={a.id} className="flex items-center justify-between gap-3 rounded-md border p-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(a.fileSizeBytes)} · {formatDate(a.createdAt)}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {a.signedUrl && (<a href={a.signedUrl} target="_blank" rel="noopener noreferrer" className="rounded-md border px-2.5 py-1 text-xs hover:bg-muted">
                      Download
                    </a>)}
                  {!isReadOnly && (<ConfirmButton label="Remove" confirmLabel="Confirm" onConfirm={() => void deleteAttachment(a.id)} variant="outline"/>)}
                </div>
              </div>))}
          </CardContent>
        </Card>)}

      {/* ── Version history ── */}
      {plan && (<Card>
          <CardHeader>
            <button type="button" className="flex w-full items-center justify-between text-left" onClick={() => setVersionsOpen((v) => !v)}>
              <div>
                <CardTitle className="text-base">Version history</CardTitle>
                <CardDescription>All versions of this treatment plan.</CardDescription>
              </div>
              <span className="text-muted-foreground text-sm">{versionsOpen ? '▲ Hide' : '▼ Show'}</span>
            </button>
          </CardHeader>
          {versionsOpen && (<CardContent className="space-y-2">
              {versions.length === 0 && (<p className="text-sm text-muted-foreground">No version history yet.</p>)}
              {versions.map((v) => {
                    const cfg = STATUS_CONFIG[v.status] ?? STATUS_CONFIG.draft;
                    const isCurrent = v.id === plan.id;
                    return (<div key={v.id} className={`flex items-center justify-between rounded-md border p-2.5 ${isCurrent ? 'border-primary/40 bg-primary/5' : ''}`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">v{v.version}</span>
                        {isCurrent && <span className="text-xs text-primary font-medium">current</span>}
                        <Badge variant="outline" className={`text-xs ${cfg.className}`}>{cfg.label}</Badge>
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>Created {formatDate(v.createdAt)}</span>
                        {v.sentAt && <span>Sent {formatDate(v.sentAt)}</span>}
                        {v.acknowledgedAt && <span>Acknowledged {formatDate(v.acknowledgedAt)}</span>}
                      </div>
                    </div>
                  </div>);
                })}
            </CardContent>)}
        </Card>)}

      <SignaturePadDialog open={signOpen} onOpenChange={setSignOpen} saving={signing} title="Sign treatment plan" description="Pick draw or type. Signature is stored on the plan with a timestamp and audit log." onConfirm={async ({ method, signatureDataUrl }) => {
            await signPlan(method, signatureDataUrl);
        }}/>
    </div>);
}
