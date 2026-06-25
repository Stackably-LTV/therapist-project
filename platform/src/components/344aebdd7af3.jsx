'use client';
import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, FileText, RefreshCw } from 'lucide-react';
import { Button } from '@/components/2795b661f080';
function noteTypeLabel(type) {
    if (type === 'intake')
        return 'Intake note';
    if (type === 'termination')
        return 'Termination note';
    return 'Progress note';
}
function statusClasses(status) {
    if (status === 'signed')
        return 'border-emerald-500/30 bg-emerald-500/15 text-emerald-200';
    if (status === 'draft')
        return 'border-amber-500/30 bg-amber-500/15 text-amber-200';
    return 'border-slate-500/30 bg-slate-500/15 text-slate-200';
}
function asString(value) {
    return typeof value === 'string' ? value.trim() : '';
}
function notePreview(note) {
    const content = note.content_json || {};
    const candidates = [
        asString(content.subjective),
        asString(content.objective),
        asString(content.presentingProblem),
        asString(content.interventions),
        asString(content.updatedPlan),
    ].filter(Boolean);
    return candidates[0] || 'No note text saved yet.';
}
function formatDate(value) {
    if (!value)
        return 'Not saved';
    const date = new Date(value);
    if (Number.isNaN(date.getTime()))
        return value;
    return date.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}
export function VideoSessionNotesPanel({ sessionId, seekerId }) {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const notesUrl = seekerId
        ? `/therapist/clients/${seekerId}?tab=notes&session=${sessionId}`
        : `/therapist/sessions/${sessionId}/notes`;
    const loadNotes = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/therapist/sessions/${sessionId}/notes`, {
                cache: 'no-store',
            });
            const payload = (await response.json().catch(() => ({})));
            if (!response.ok)
                throw new Error(payload.error || 'Failed to load notes');
            setNotes(payload.notes ?? []);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load notes');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        void loadNotes();
        const timer = window.setInterval(() => void loadNotes(), 30000);
        return () => window.clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId]);
    const sortedNotes = useMemo(() => [...notes].sort((a, b) => {
        const aTime = new Date(a.updated_at || a.signed_at || 0).getTime();
        const bTime = new Date(b.updated_at || b.signed_at || 0).getTime();
        return bTime - aTime;
    }), [notes]);
    return (<aside className="hidden h-full w-[360px] shrink-0 border-l border-white/10 bg-slate-950 text-white shadow-2xl xl:flex xl:flex-col">
      <div className="border-b border-white/10 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Patient record
            </p>
            <h2 className="mt-1 text-lg font-semibold">Session notes</h2>
            <p className="mt-1 text-xs text-slate-400">
              Saved notes sync into this client's records.
            </p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={() => void loadNotes()} disabled={loading} className="text-slate-300 hover:bg-white/10 hover:text-white" aria-label="Refresh notes">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}/>
          </Button>
        </div>

        <Button asChild className="mt-4 w-full bg-white text-slate-950 hover:bg-slate-200">
          <a href={notesUrl} target="_blank" rel="noreferrer">
            Open full note editor
            <ArrowUpRight className="ml-2 h-4 w-4"/>
          </a>
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {error ? (<div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">
            {error}
          </div>) : null}

        {!error && loading && sortedNotes.length === 0 ? (<div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            Loading notes...
          </div>) : null}

        {!loading && !error && sortedNotes.length === 0 ? (<div className="rounded-lg border border-dashed border-white/15 bg-white/5 p-5 text-sm text-slate-300">
            <FileText className="mb-3 h-8 w-8 text-slate-500"/>
            <p className="font-medium text-white">No saved note yet</p>
            <p className="mt-1 text-xs text-slate-400">
              Open the editor to save an intake or progress note for this call.
            </p>
          </div>) : null}

        {sortedNotes.length > 0 ? (<div className="relative ml-3 space-y-4 border-l border-slate-700 pl-5">
            {sortedNotes.map((note) => (<div key={note.id} className="relative">
                <div className="absolute -left-[29px] top-1.5 h-4 w-4 rounded-full border-2 border-slate-950 bg-cyan-400 shadow-[0_0_0_3px_rgba(34,211,238,0.2)]"/>
                <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{noteTypeLabel(note.note_type)}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        v{note.version} - updated {formatDate(note.updated_at)}
                      </p>
                    </div>
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusClasses(note.status)}`}>
                      {note.status || 'draft'}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-300">
                    {notePreview(note)}
                  </p>
                  {note.signed_at ? (<p className="mt-3 text-xs text-emerald-200">
                      Signed {formatDate(note.signed_at)}
                      {note.signature_method ? ` via ${note.signature_method}` : ''}
                    </p>) : null}
                </div>
              </div>))}
          </div>) : null}
      </div>
    </aside>);
}
