"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/2795b661f080";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, } from "@/components/ba221113eac7";
import { Input } from "@/components/c2f62fb0cb5e";
import { Label } from "@/components/78846397f3ca";
import { Textarea } from "@/components/e1d2ad49fd73";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/1712d8a01fd3";
import { Switch } from "@/components/395ec797588e";
import { Badge } from "@/components/30348591d689";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from "@/components/bc12d3573eef";
import Link from "next/link";
import { Plus, Pencil, Trash2, FileText, User, ExternalLink, Download, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { IntakeNoteEditor } from "@/components/be435334eac3";
import { emptyIntakeNoteData, renderIntakeNoteMarkdown } from "@/components/a68a034eeea3";
const NOTE_TYPES = [
    { value: "general", label: "General" },
    { value: "progress", label: "Progress" },
    { value: "intake", label: "Intake" },
    { value: "treatment", label: "Treatment" },
    { value: "assessment", label: "Assessment" },
    { value: "discharge", label: "Discharge" },
];
const DEFAULT_NOTE_TITLES = {
    general: "General Note",
    progress: "Progress Note",
    intake: "Intake Note",
    treatment: "Treatment Planning Note",
    assessment: "Assessment Note",
    discharge: "Discharge Note",
};
const NOTE_TYPE_TEMPLATES = {
    general: `Session Summary
- Presenting focus:
- Key discussion points:
- Therapeutic interventions:

Clinical Observations
- Mood / affect:
- Behavior / engagement:
- Risk / safety:

Follow-up
- Homework / action items:
- Coordination needed:
- Next session focus:
`,
    progress: `S: Subjective
- Client report:
- Mood / affect:
- Key updates since last session:

O: Objective
- MSE / observed behavior:
- Risk check:
- Interventions used:

A: Assessment
- Clinical impression:
- Progress toward goals:

P: Plan
- Next steps:
- Homework / action items:
- Follow-up:
`,
    treatment: `Treatment Goals
- Primary goals addressed:
- Goal status update:
- Barriers to progress:

Interventions and Action Steps
- Interventions used this session:
- Patient response:
- New action steps assigned:

Care Plan Updates
- Frequency / intensity changes:
- Coordination with care team:
- Plan before next session:
`,
    assessment: `Assessment Overview
- Assessment type / tools used:
- Data sources reviewed:
- Reliability / limitations:

Findings
- Symptom summary:
- Functional impact:
- Risk and protective factors:

Clinical Impression and Recommendations
- Diagnostic impression:
- Differential considerations:
- Recommended next steps:
`,
    discharge: `Discharge Summary
- Reason for discharge:
- Date of final session:
- Services completed:

Progress and Outcomes
- Progress toward treatment goals:
- Remaining concerns:
- Current risk / safety status:

Aftercare Plan
- Referrals and resources provided:
- Medication / provider follow-up:
- Patient instructions and warning signs:
`,
};
export function TherapistNotesClient({ initialNotes, clients, preselectedPatientId, hideHeader = false, createOpen, onCreateOpenChange, }) {
    const [notes, setNotes] = useState(initialNotes);
    const [isCreateOpen, setIsCreateOpen] = useState(!!createOpen || !!preselectedPatientId);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingNote, setEditingNote] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const prevCreateOpenRef = useRef(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [patientId, setPatientId] = useState(preselectedPatientId || "__none__");
    const [noteType, setNoteType] = useState("general");
    const [isPrivate, setIsPrivate] = useState(true);
    const [intakeData, setIntakeData] = useState(() => emptyIntakeNoteData());
    const [editIntakeData, setEditIntakeData] = useState(() => emptyIntakeNoteData());
    const selectedPatient = useMemo(() => {
        const pid = patientId === "__none__" ? null : patientId;
        if (!pid)
            return null;
        return clients.find((c) => c.id === pid) || null;
    }, [clients, patientId]);
    const canCreate = useMemo(() => {
        const fallback = noteType === "intake" ? "Intake Note" : "";
        return Boolean((title || fallback).trim());
    }, [noteType, title]);
    const handleCreateOpenChange = (open) => {
        setIsCreateOpen(open);
        onCreateOpenChange?.(open);
    };
    useEffect(() => {
        if (createOpen === undefined)
            return;
        setIsCreateOpen(createOpen);
    }, [createOpen]);
    const applyNoteTypeDefaults = (type) => {
        setNoteType(type);
        setTitle(DEFAULT_NOTE_TITLES[type] || "General Note");
        setContent(type === "intake" ? "" : NOTE_TYPE_TEMPLATES[type] || NOTE_TYPE_TEMPLATES.general);
    };
    const resetForm = (keepPatient = false) => {
        applyNoteTypeDefaults("general");
        setPatientId(keepPatient && preselectedPatientId ? preselectedPatientId : "__none__");
        setIsPrivate(true);
        setIntakeData(emptyIntakeNoteData());
    };
    const handleNoteTypeChange = (nextType) => {
        applyNoteTypeDefaults(nextType);
    };
    useEffect(() => {
        const justOpened = isCreateOpen && !prevCreateOpenRef.current;
        if (justOpened) {
            resetForm(Boolean(preselectedPatientId));
        }
        prevCreateOpenRef.current = isCreateOpen;
    }, [isCreateOpen, preselectedPatientId]);
    const handleCreate = async () => {
        const isIntake = noteType === "intake";
        const effectiveTitle = (title || (isIntake ? "Intake Note" : "")).trim();
        if (!effectiveTitle)
            return;
        setIsLoading(true);
        try {
            const res = await fetch("/api/therapist/notes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: effectiveTitle,
                    content: isIntake ? renderIntakeNoteMarkdown(intakeData) : content,
                    patientId: patientId === "__none__" ? null : patientId,
                    noteType,
                    isPrivate,
                    templateKey: isIntake ? "intake_v1" : null,
                    templateData: isIntake ? intakeData : {},
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data.error || "Failed to create note");
            setNotes((current) => [data.note, ...current]);
            handleCreateOpenChange(false);
            resetForm();
            toast.success("Note created");
        }
        catch (error) {
            console.error("Failed to create note:", error);
            toast.error(error instanceof Error ? error.message : "Failed to create note");
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleEdit = async () => {
        if (!editingNote || !title.trim())
            return;
        const isIntake = editingNote.note_type === "intake";
        setIsLoading(true);
        try {
            const res = await fetch(`/api/therapist/notes/${editingNote.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    content: isIntake ? renderIntakeNoteMarkdown(editIntakeData) : content,
                    patientId: patientId === "__none__" ? null : patientId,
                    noteType,
                    isPrivate,
                    templateKey: isIntake ? "intake_v1" : null,
                    templateData: isIntake ? editIntakeData : {},
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data.error || "Failed to update note");
            setNotes((current) => current.map((n) => (n.id === data.note.id ? data.note : n)));
            setIsEditOpen(false);
            setEditingNote(null);
            resetForm();
            toast.success("Note updated");
        }
        catch (error) {
            console.error("Failed to update note:", error);
            toast.error(error instanceof Error ? error.message : "Failed to update note");
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleDelete = async (noteId) => {
        if (!confirm("Are you sure you want to delete this note?"))
            return;
        try {
            const res = await fetch(`/api/therapist/notes/${noteId}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setNotes(notes.filter((n) => n.id !== noteId));
            }
        }
        catch (error) {
            console.error("Failed to delete note:", error);
        }
    };
    const openEditDialog = (note) => {
        setEditingNote(note);
        setTitle(note.title);
        setContent(note.content || "");
        setPatientId(preselectedPatientId ?? note.patient_id ?? note.seeker_id ?? "__none__");
        setNoteType(note.note_type);
        setIsPrivate(note.is_private);
        if (note.note_type === "intake") {
            const raw = note.template_data;
            const merged = raw && typeof raw === "object" ? { ...emptyIntakeNoteData(), ...raw } : emptyIntakeNoteData();
            setEditIntakeData(merged);
        }
        else {
            setEditIntakeData(emptyIntakeNoteData());
        }
        setIsEditOpen(true);
    };
    const getNoteTypeLabel = (type) => {
        return NOTE_TYPES.find((t) => t.value === type)?.label || type;
    };
    const getNoteTypeColor = (type) => {
        const colors = {
            general: "bg-gray-100 text-gray-800",
            progress: "bg-blue-100 text-blue-800",
            intake: "bg-green-100 text-green-800",
            treatment: "bg-purple-100 text-purple-800",
            assessment: "bg-orange-100 text-orange-800",
            discharge: "bg-red-100 text-red-800",
        };
        return colors[type] || colors.general;
    };
    const stripMarkdown = (value) => {
        return value
            .replace(/`{3}[\s\S]*?`{3}/g, " ")
            .replace(/`([^`]+)`/g, "$1")
            .replace(/^#{1,6}\s+/gm, "")
            .replace(/^[-*+]\s+/gm, "")
            .replace(/\*\*([^*]+)\*\*/g, "$1")
            .replace(/\*([^*]+)\*/g, "$1")
            .replace(/_([^_]+)_/g, "$1")
            .replace(/\[(.*?)\]\(.*?\)/g, "$1")
            .replace(/\s+/g, " ")
            .trim();
    };
    const getNotePreview = (note) => {
        if (note.note_type === "intake" && note.template_data) {
            const markdown = renderIntakeNoteMarkdown(note.template_data);
            return stripMarkdown(markdown);
        }
        if (!note.content)
            return "";
        return stripMarkdown(note.content);
    };
    return (<div className="space-y-8">
      {!hideHeader ? (<div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notes</h1>
            <p className="mt-2 text-gray-600">Create and manage notes for your clients</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={handleCreateOpenChange}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="mr-2 h-4 w-4"/>
                New Note
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[980px] max-h-[85vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Create Note</DialogTitle>
                <DialogDescription>
                  Create a new note. You can optionally assign it to a client.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="noteType">Note Type</Label>
                  <Select value={noteType} onValueChange={handleNoteTypeChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {NOTE_TYPES.map((type) => (<SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note title"/>
                </div>

                {noteType === "intake" ? (<IntakeNoteEditor value={intakeData} onChange={setIntakeData} patientDisplay={{ name: selectedPatient?.name }}/>) : (<div className="grid gap-2">
                    <Label htmlFor="content">Content</Label>
                    <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Note content..." rows={8}/>
                  </div>)}
                {!preselectedPatientId ? (<div className="grid gap-2">
                    <Label htmlFor="patient">Client (Optional)</Label>
                    <Select value={patientId} onValueChange={setPatientId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select client"/>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">No client</SelectItem>
                        {clients.map((client) => (<SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>) : null}
                <div className="flex items-center gap-2">
                  <Switch id="private" checked={isPrivate} onCheckedChange={setIsPrivate}/>
                  <Label htmlFor="private">
                    Private (only you can see this note). Turn off to share with the assigned patient.
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => handleCreateOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={isLoading || !canCreate}>
                  {isLoading ? "Creating..." : "Create Note"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>) : (<Dialog open={isCreateOpen} onOpenChange={handleCreateOpenChange}>
          <DialogContent className="sm:max-w-[980px] max-h-[85vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Create Note</DialogTitle>
              <DialogDescription>
                Create a new note. You can optionally assign it to a client.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="noteType">Note Type</Label>
                <Select value={noteType} onValueChange={handleNoteTypeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTE_TYPES.map((type) => (<SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note title"/>
              </div>

              {noteType === "intake" ? (<IntakeNoteEditor value={intakeData} onChange={setIntakeData} patientDisplay={{ name: selectedPatient?.name }}/>) : (<div className="grid gap-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Note content..." rows={8}/>
                </div>)}
              {!preselectedPatientId ? (<div className="grid gap-2">
                  <Label htmlFor="patient">Client (Optional)</Label>
                  <Select value={patientId} onValueChange={setPatientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client"/>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">No client</SelectItem>
                      {clients.map((client) => (<SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>) : null}
              <div className="flex items-center gap-2">
                <Switch id="private" checked={isPrivate} onCheckedChange={setIsPrivate}/>
                <Label htmlFor="private">
                  Private (only you can see this note). Turn off to share with the assigned patient.
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleCreateOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isLoading || !canCreate}>
                {isLoading ? "Creating..." : "Create Note"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>)}

      {notes.length === 0 ? (<div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4"/>
          <p className="text-gray-500 mb-4">No notes yet</p>
          <p className="text-sm text-gray-400 mb-6">
            Create your first note to get started
          </p>
          <Button onClick={() => {
                resetForm();
                handleCreateOpenChange(true);
            }}>
            <Plus className="mr-2 h-4 w-4"/>
            Create Note
          </Button>
        </div>) : (<div className="grid gap-4">
          {notes.map((note) => (<div key={note.id} className="bg-white rounded-lg shadow hover:shadow-md transition p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {note.title}
                    </h3>
                    <Badge className={getNoteTypeColor(note.note_type)}>
                      {getNoteTypeLabel(note.note_type)}
                    </Badge>
                    {note.is_private && (<Badge variant="outline" className="text-xs">
                        Private
                      </Badge>)}
                  </div>
                  
                  {note.patient && (<div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <User className="h-4 w-4"/>
                      <span>{note.patient.name}</span>
                    </div>)}

                  {/* Preview removed per request */}

                  <p className="text-xs text-gray-400">
                    Created{" "}
                    {new Date(note.created_at).toLocaleDateString("en-US", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                })}
                    {note.updated_at !== note.created_at && (<> · Updated {new Date(note.updated_at).toLocaleDateString()}</>)}
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Note actions">
                      <MoreHorizontal className="h-4 w-4"/>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/therapist/notes/${note.id}`}>
                        <ExternalLink className="mr-2 h-4 w-4"/>
                        Open
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/therapist/notes/${note.id}/print`}>
                        <Download className="mr-2 h-4 w-4"/>
                        Download PDF
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => note.note_type === "intake"
                    ? (window.location.href = `/therapist/notes/${note.id}`)
                    : openEditDialog(note)}>
                      <Pencil className="mr-2 h-4 w-4"/>
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleDelete(note.id)} className="text-red-600">
                      <Trash2 className="mr-2 h-4 w-4"/>
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>))}
        </div>)}

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[980px] max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
            <DialogDescription>
              Update note details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-noteType">Note Type</Label>
              <Select value={noteType} onValueChange={handleNoteTypeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NOTE_TYPES.map((type) => (<SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note title"/>
            </div>

            {noteType === "intake" ? (<IntakeNoteEditor value={editIntakeData} onChange={setEditIntakeData} patientDisplay={{ name: selectedPatient?.name }}/>) : (<div className="grid gap-2">
                <Label htmlFor="edit-content">Content</Label>
                <Textarea id="edit-content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Note content..." rows={8}/>
              </div>)}
            {!preselectedPatientId ? (<div className="grid gap-2">
                <Label htmlFor="edit-patient">Client (Optional)</Label>
                <Select value={patientId} onValueChange={setPatientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client"/>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No client</SelectItem>
                    {clients.map((client) => (<SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>))}
                  </SelectContent>
                </Select>
              </div>) : null}
            <div className="flex items-center gap-2">
              <Switch id="edit-private" checked={isPrivate} onCheckedChange={setIsPrivate}/>
              <Label htmlFor="edit-private">
                Private (only you can see this note). Turn off to share with the assigned patient.
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isLoading || !title.trim()}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>);
}
