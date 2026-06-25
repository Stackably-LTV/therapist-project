"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/2795b661f080";
import { Input } from "@/components/c2f62fb0cb5e";
import { Textarea } from "@/components/e1d2ad49fd73";
import { Badge } from "@/components/30348591d689";
import { Download, Save } from "lucide-react";
import { toast } from "sonner";
import { IntakeNoteEditor } from "@/components/be435334eac3";
import { emptyIntakeNoteData, renderIntakeNoteMarkdown } from "@/components/a68a034eeea3";
import { ProgressNoteEditor } from "@/components/3505ab40c225";
import { emptyProgressNoteData, renderProgressNoteMarkdown, } from "@/components/4fe1b027890c";
export function TherapistNoteEditorClient({ initialNote, currentTherapistName, patientDob, }) {
    const [note, setNote] = useState(initialNote);
    const [saving, setSaving] = useState(false);
    const [savedBanner, setSavedBanner] = useState(null);
    const isIntake = note.note_type === "intake";
    const isProgress = note.note_type === "progress" || note.note_type === "session";
    const templateKey = note.template_key || (isIntake ? "intake_v1" : isProgress ? "progress_v1" : null);
    const [intakeData, setIntakeData] = useState(() => {
        const raw = note.template_data;
        const base = emptyIntakeNoteData();
        const merged = raw && typeof raw === "object" ? { ...base, ...raw } : base;
        if (!merged.meta?.clinicianName && currentTherapistName) {
            merged.meta = { ...(merged.meta || {}), clinicianName: currentTherapistName };
        }
        return merged;
    });
    const [progressData, setProgressData] = useState(() => {
        const raw = note.template_data;
        const base = emptyProgressNoteData();
        const merged = raw && typeof raw === "object" && raw.subjective !== undefined
            ? { ...base, ...raw }
            : base;
        if (!merged.meta?.clinicianName && currentTherapistName) {
            merged.meta = { ...(merged.meta || {}), clinicianName: currentTherapistName };
        }
        if (!merged.meta?.startAt) {
            merged.meta = { ...(merged.meta || {}), startAt: new Date().toISOString() };
        }
        return merged;
    });
    const [plainContent, setPlainContent] = useState(note.content || "");
    const renderedMarkdown = useMemo(() => {
        if (isIntake)
            return renderIntakeNoteMarkdown(intakeData);
        if (isProgress)
            return renderProgressNoteMarkdown(progressData);
        return null;
    }, [intakeData, progressData, isIntake, isProgress]);
    const saveDraft = async () => {
        setSaving(true);
        try {
            const body = {
                title: note.title,
                patientId: note.patient_id,
                noteType: note.note_type,
                isPrivate: note.is_private,
            };
            if (isIntake) {
                body.templateKey = templateKey;
                body.templateData = intakeData;
                body.content = renderedMarkdown;
            }
            else if (isProgress) {
                body.templateKey = templateKey;
                body.templateData = progressData;
                body.content = renderedMarkdown;
            }
            else {
                body.templateKey = null;
                body.templateData = {};
                body.content = plainContent;
            }
            const res = await fetch(`/api/therapist/notes/${note.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data?.error || "Failed to save");
            setNote(data.note);
            toast.success("Saved");
            setSavedBanner("Your note has been saved.");
            window.setTimeout(() => setSavedBanner(null), 4500);
        }
        catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to save");
        }
        finally {
            setSaving(false);
        }
    };
    const intakeLooksComplete = isIntake &&
        Boolean(intakeData.presentingProblem?.trim()) &&
        Boolean(intakeData.plan?.trim()) &&
        Boolean(intakeData.diagnosis?.primaryIcd10?.trim()) &&
        Boolean(intakeData.signOff?.signed);
    return (<div className="mx-auto w-full max-w-6xl px-4 py-6">
      {savedBanner ? (<div className="mb-4 rounded-lg border bg-green-50 px-4 py-2 text-sm text-green-800">{savedBanner}</div>) : null}
      {intakeLooksComplete ? (<div className="mb-4 rounded-lg border bg-blue-50 px-4 py-2 text-sm text-blue-900">
          Your Intake Note is complete. It is recommended that you create a Treatment Plan now.
        </div>) : null}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 truncate">{note.title}</h1>
            <Badge variant="secondary" className="capitalize">
              {note.note_type}
            </Badge>
            {note.is_private ? (<Badge variant="outline" className="text-xs">
                Private
              </Badge>) : null}
          </div>
          {note.patient ? (<div className="mt-1 text-sm text-gray-600">
              Patient:{" "}
              <Link href={`/therapist/clients/${note.patient.id}`} className="text-indigo-600 hover:underline">
                {note.patient.name}
              </Link>
            </div>) : null}
          <div className="mt-1 text-xs text-gray-400">
            Updated {new Date(note.updated_at).toLocaleString("en-US")}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="gap-2">
            <Link href={`/therapist/notes/${note.id}/print`}>
              <Download className="h-4 w-4"/> Download PDF
            </Link>
          </Button>

          <Button onClick={saveDraft} disabled={saving} className="gap-2">
            <Save className="h-4 w-4"/> {saving ? "Saving…" : "Save draft"}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border bg-gray-50 p-3">
        <div className="rounded-xl bg-white p-4">
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <div className="text-xs font-medium text-gray-600">Title</div>
              <Input value={note.title} onChange={(e) => setNote({ ...note, title: e.target.value })}/>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        {isIntake ? (<IntakeNoteEditor value={intakeData} onChange={setIntakeData} patientDisplay={{ name: note.patient?.name, dob: patientDob ?? null }}/>) : isProgress ? (<ProgressNoteEditor value={progressData} onChange={setProgressData} patientDisplay={{ name: note.patient?.name, dob: patientDob ?? null }}/>) : (<div className="rounded-xl border bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Content</h3>
            </div>
            <Textarea value={plainContent} onChange={(e) => setPlainContent(e.target.value)} rows={14}/>
          </div>)}
      </div>
    </div>);
}
