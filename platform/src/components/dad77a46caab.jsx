'use client';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
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
const STATUS_CONFIG = {
    sent: { label: 'Awaiting Acknowledgment', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    active: { label: 'Active', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    archived: { label: 'Archived', className: 'bg-muted/60 text-muted-foreground border-border' },
    draft: { label: 'Draft', className: 'bg-muted text-muted-foreground border-border' },
};
function PlanCard({ entry, onAcknowledged }) {
    const { bundle, attachments, therapistName, versions } = entry;
    const { plan, goals, objectives, interventions } = bundle;
    const [versionsOpen, setVersionsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const objectivesByGoal = new Map();
    for (const o of objectives) {
        const arr = objectivesByGoal.get(o.goalId) || [];
        arr.push(o);
        objectivesByGoal.set(o.goalId, arr);
    }
    const statusCfg = STATUS_CONFIG[plan.status] ?? STATUS_CONFIG.draft;
    const isSent = plan.status === 'sent';
    const isActive = plan.status === 'active';
    const handleAcknowledge = () => {
        startTransition(async () => {
            try {
                const res = await fetch('/api/seeker/treatment-plan-ack', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ planId: plan.id }),
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok)
                    throw new Error(data?.error || 'Failed to acknowledge');
                toast.success('Plan acknowledged');
                onAcknowledged(plan.id);
            }
            catch (e) {
                toast.error(e instanceof Error ? e.message : 'Failed to acknowledge plan');
            }
        });
    };
    const handlePrint = () => window.open(`/treatment-plan/${plan.id}`, '_blank');
    return (<div className={`rounded-xl border shadow-sm overflow-hidden`} data-plan-id={plan.id}>
      {/* Status banner */}
      {isSent && (<div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-amber-800">Your therapist has shared a treatment plan — please review and acknowledge</p>
            {plan.sentAt && <p className="text-xs text-amber-600 mt-0.5">Sent {formatDate(plan.sentAt)}</p>}
          </div>
          <button type="button" onClick={handleAcknowledge} disabled={isPending} className="no-print rounded-md bg-amber-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60">
            {isPending ? 'Acknowledging…' : 'Acknowledge Plan'}
          </button>
        </div>)}
      {isActive && (<div className="bg-emerald-50 border-b border-emerald-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-emerald-800">Treatment plan active</p>
            {plan.acknowledgedAt && <p className="text-xs text-emerald-600 mt-0.5">Acknowledged {formatDate(plan.acknowledgedAt)}</p>}
          </div>
          <button type="button" onClick={handlePrint} className="no-print rounded-md border border-emerald-300 bg-white px-3 py-1.5 text-sm text-emerald-700 hover:bg-emerald-50">
            Print / Save as PDF
          </button>
        </div>)}

      {/* Plan body */}
      <div className="p-4 space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            {plan.moduleName && (<p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">{plan.moduleName}</p>)}
            <p className="font-semibold text-base">{therapistName}</p>
            {plan.diagnosisName && <p className="text-sm text-muted-foreground mt-0.5">{plan.diagnosisName}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusCfg.className}`}>
              {statusCfg.label}
            </span>
            <span className="text-xs text-muted-foreground">v{plan.version}</span>
          </div>
        </div>

        {/* Key fields */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {plan.frequency && (<div className="rounded-lg bg-muted/40 p-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Frequency</p>
              <p>{plan.frequency}</p>
            </div>)}
          {plan.timeline && (<div className="rounded-lg bg-muted/40 p-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Timeline</p>
              <p>{plan.timeline}</p>
            </div>)}
        </div>

        {/* Homework */}
        {plan.homework && (<div className="rounded-lg border p-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Homework / Between-Session Tasks</p>
            <p className="text-sm whitespace-pre-wrap">{plan.homework}</p>
          </div>)}

        {/* Additional info */}
        {plan.additionalInfo && (<div className="text-sm">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Additional Information</p>
            <p className="whitespace-pre-wrap">{plan.additionalInfo}</p>
          </div>)}

        {/* Goals */}
        {goals.length > 0 && (<div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Goals &amp; Objectives</p>
            {goals.map((goal) => {
                const objs = objectivesByGoal.get(goal.id) || [];
                return (<div key={goal.id} className="rounded-lg border p-3 space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{goal.title}</p>
                      {goal.description && <p className="text-xs text-muted-foreground mt-0.5">{goal.description}</p>}
                    </div>
                    <span className={`text-xs rounded-full border px-2 py-0.5 capitalize ${goal.status === 'achieved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        goal.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-muted text-muted-foreground border-border'}`}>
                      {goal.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${goal.progress}%` }}/>
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">{goal.progress}%</span>
                  </div>

                  {goal.targetDate && (<p className="text-xs text-muted-foreground">Target: {formatDate(goal.targetDate)}</p>)}

                  {/* Objectives */}
                  {objs.length > 0 && (<div className="space-y-1.5 pl-3 border-l-2 border-muted mt-2">
                      {objs.map((obj) => (<div key={obj.id} className="text-sm">
                          <p>{obj.description}</p>
                          {obj.measurableCriteria && (<p className="text-xs text-muted-foreground">Criteria: {obj.measurableCriteria}</p>)}
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-0.5">
                            <span className="capitalize">{obj.status.replace('_', ' ')}</span>
                            {obj.dueDate && <span>Due {formatDate(obj.dueDate)}</span>}
                          </div>
                        </div>))}
                    </div>)}
                </div>);
            })}
          </div>)}

        {/* Interventions */}
        {interventions.length > 0 && (<div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Interventions</p>
            {interventions.map((i) => (<div key={i.id} className="flex items-start gap-2 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground shrink-0"/>
                <div>
                  <p>{i.description}</p>
                  {i.frequency && <p className="text-xs text-muted-foreground">{i.frequency}</p>}
                </div>
              </div>))}
          </div>)}

        {/* Attachments */}
        {attachments.length > 0 && (<div className="space-y-2 no-print">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Attachments</p>
            {attachments.map((a) => (<div key={a.id} className="flex items-center justify-between gap-3 rounded-md border p-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.fileName}</p>
                  {a.fileSizeBytes != null && (<p className="text-xs text-muted-foreground">{formatBytes(a.fileSizeBytes)}</p>)}
                </div>
                <AttachmentDownload planId={plan.id} attachmentId={a.id} fileName={a.fileName}/>
              </div>))}
          </div>)}

        {/* Version history */}
        {versions.length > 1 && (<div className="no-print">
            <button type="button" className="flex w-full items-center justify-between text-left text-xs font-medium text-muted-foreground hover:text-foreground py-1" onClick={() => setVersionsOpen((v) => !v)}>
              <span>Version history ({versions.length} versions)</span>
              <span>{versionsOpen ? '▲' : '▼'}</span>
            </button>
            {versionsOpen && (<div className="mt-2 space-y-1.5 border-t pt-2">
                {versions.map((v) => {
                    const cfg = STATUS_CONFIG[v.status] ?? STATUS_CONFIG.draft;
                    const isCurrent = v.id === plan.id;
                    return (<div key={v.id} className={`flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs ${isCurrent ? 'bg-primary/5 border border-primary/20' : 'border'}`}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">v{v.version}</span>
                        {isCurrent && <span className="text-primary font-medium">current</span>}
                        <span className={`rounded-full border px-1.5 py-0.5 text-xs ${cfg.className}`}>{cfg.label}</span>
                      </div>
                      <div className="flex gap-2 text-muted-foreground">
                        <span>{formatDate(v.createdAt)}</span>
                        {v.acknowledgedAt && <span>Ack. {formatDate(v.acknowledgedAt)}</span>}
                      </div>
                    </div>);
                })}
              </div>)}
          </div>)}
      </div>
    </div>);
}
function AttachmentDownload({ planId, attachmentId, fileName }) {
    const [url, setUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const fetchAndOpen = async () => {
        if (url) {
            window.open(url, '_blank');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`/api/seeker/treatment-plans/${planId}/attachments`);
            const data = await res.json().catch(() => ({}));
            const match = (data?.attachments || []).find((a) => a.id === attachmentId);
            if (match?.signedUrl) {
                setUrl(match.signedUrl);
                window.open(match.signedUrl, '_blank');
            }
        }
        catch {
            toast.error('Failed to load attachment');
        }
        finally {
            setLoading(false);
        }
    };
    return (<button type="button" onClick={() => void fetchAndOpen()} disabled={loading} className="shrink-0 rounded-md border px-2.5 py-1 text-xs hover:bg-muted disabled:opacity-60">
      {loading ? 'Loading…' : 'Download'}
    </button>);
}
export function SeekerPlanSection({ plans }) {
    const [localPlans, setLocalPlans] = useState(plans);
    const handleAcknowledged = (planId) => {
        setLocalPlans((prev) => prev.map((entry) => entry.bundle.plan.id === planId
            ? { ...entry, bundle: { ...entry.bundle, plan: { ...entry.bundle.plan, status: 'active', acknowledgedAt: new Date().toISOString() } } }
            : entry));
    };
    if (localPlans.length === 0) {
        return (<p className="text-sm text-gray-500">
        No treatment plans have been shared with you yet. Your therapist will send one when ready.
      </p>);
    }
    return (<div className="space-y-4">
      {localPlans.map((entry) => (<PlanCard key={entry.bundle.plan.id} entry={entry} onAcknowledged={handleAcknowledged}/>))}
    </div>);
}
