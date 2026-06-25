"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/2795b661f080";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/c0ebd3fbafc6";
import { Input } from "@/components/c2f62fb0cb5e";
import { Badge } from "@/components/30348591d689";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ba221113eac7";
import { Tabs, TabsList, TabsTrigger } from "@/components/93bde5168d2a";
import { toast } from "sonner";
import { Plus, ArrowRight, Trash2, UserRound, RotateCcw, Archive } from "lucide-react";
import { AddPatientForm } from "@/components/1197cea2c44e";
export function TherapistPatientsHub({ clients, therapist, addPatientOpen, onAddPatientOpenChange, formCounts, noteCounts, }) {
    const [query, setQuery] = useState("");
    const [localAddOpen, setLocalAddOpen] = useState(false);
    const [resendingInviteId, setResendingInviteId] = useState(null);
    const [deletingInviteId, setDeletingInviteId] = useState(null);
    const [removingClientId, setRemovingClientId] = useState(null);
    const [hiddenClientIds, setHiddenClientIds] = useState(() => new Set());
    const [view, setView] = useState("active");
    const [archivedPatients, setArchivedPatients] = useState([]);
    const [archivedLoading, setArchivedLoading] = useState(false);
    const [archivedLoaded, setArchivedLoaded] = useState(false);
    const [restoringId, setRestoringId] = useState(null);
    const isAddOpen = addPatientOpen ?? localAddOpen;
    const setIsAddOpen = onAddPatientOpenChange ?? setLocalAddOpen;
    useEffect(() => {
        if (view !== "archived" || archivedLoaded || archivedLoading)
            return;
        setArchivedLoading(true);
        fetch("/api/therapist/patients?archived=1", { cache: "no-store" })
            .then(async (res) => {
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data?.error || "Failed to load archived patients");
            const rows = (data?.patients ?? []);
            const mapped = rows.map((r) => ({
                id: String(r.seeker_id ?? ""),
                name: String(r.profile?.full_name ?? r.full_name ?? "Patient"),
                archivedAt: r.archived_at ?? null,
            }));
            setArchivedPatients(mapped.filter((p) => p.id));
            setArchivedLoaded(true);
        })
            .catch((err) => {
            toast.error(err instanceof Error ? err.message : "Failed to load archived patients");
        })
            .finally(() => setArchivedLoading(false));
    }, [view, archivedLoaded, archivedLoading]);
    const restorePatient = async (patientId) => {
        const ok = window.confirm("Restore this patient to your active caseload?");
        if (!ok)
            return;
        setRestoringId(patientId);
        try {
            const res = await fetch(`/api/therapist/patients/${encodeURIComponent(patientId)}/unarchive`, {
                method: "POST",
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data?.error || "Failed to restore patient");
            toast.success("Patient restored. Reload to see them in your active caseload.");
            setArchivedPatients((prev) => prev.filter((p) => p.id !== patientId));
        }
        catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to restore patient");
        }
        finally {
            setRestoringId(null);
        }
    };
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        const base = q ? clients.filter((c) => `${c.name} ${c.email}`.toLowerCase().includes(q)) : clients;
        if (!hiddenClientIds.size)
            return base;
        return base.filter((c) => !hiddenClientIds.has(c.id));
    }, [clients, hiddenClientIds, query]);
    return (<div className="space-y-6">
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[980px] max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Add patient</DialogTitle>
            <DialogDescription>Create a new patient chart.</DialogDescription>
          </DialogHeader>
          <AddPatientForm existingClients={clients} therapist={therapist} onRequestClose={() => setIsAddOpen(false)}/>
        </DialogContent>
      </Dialog>

      <Card className="border-gray-200">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl text-gray-900">Patients</CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Add patients, then manage charts, forms, and notes from their profile.
            </CardDescription>
          </div>
          <Button onClick={() => setIsAddOpen(true)} className="h-10 px-4">
            <Plus className="mr-2 h-4 w-4"/>
            Add patient
          </Button>
        </CardHeader>
      </Card>

      <Tabs value={view} onValueChange={(v) => setView(v === "archived" ? "archived" : "active")}>
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="archived">
            <Archive className="mr-2 h-3.5 w-3.5"/>
            Archived
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {view === "archived" ? (<div className="space-y-3">
          <div className="text-sm font-semibold text-gray-900">Archived patients</div>
          {archivedLoading ? (<div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
              Loading archived patients…
            </div>) : archivedPatients.length === 0 ? (<div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
              No archived patients. Archived patients you remove from your caseload appear here.
            </div>) : (<div className="grid gap-3">
              {archivedPatients.map((p) => (<div key={p.id} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="truncate text-base font-semibold text-gray-900">{p.name}</div>
                      <div className="text-xs text-gray-500">
                        Archived {p.archivedAt ? new Date(p.archivedAt).toLocaleDateString() : "—"}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button asChild variant="outline" size="sm" className="h-9 rounded-full px-3">
                        <Link href={`/therapist/clients/${p.id}`}>
                          Open chart
                          <ArrowRight className="ml-2 h-4 w-4"/>
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" disabled={restoringId === p.id} onClick={() => void restorePatient(p.id)} className="h-9 rounded-full px-3">
                        <RotateCcw className="mr-2 h-4 w-4"/>
                        {restoringId === p.id ? "Restoring…" : "Restore"}
                      </Button>
                    </div>
                  </div>
                </div>))}
            </div>)}
        </div>) : (<>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-gray-900">Patient directory</div>
          <div className="text-xs text-gray-500">{filtered.length} shown</div>
        </div>
        <div className="w-full sm:w-80">
          <label className="text-xs font-medium text-gray-600" htmlFor="patient-search">
            Search patients
          </label>
          <Input id="patient-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or email" className="mt-2"/>
          <p className="mt-1 text-xs text-gray-400">Example: “Jordan Lee” or “jordan@”</p>
        </div>
      </div>

      {filtered.length === 0 ? (<div className="rounded-lg border border-gray-200 bg-white p-10 text-center">
          <UserRound className="mx-auto mb-3 h-10 w-10 text-gray-400"/>
          <div className="text-sm font-medium text-gray-900">No matching patients</div>
          <p className="mt-2 text-xs text-gray-500">
            Try a different name or add a new patient to get started.
          </p>
          <Button onClick={() => setIsAddOpen(true)} variant="outline" className="mt-4">
            <Plus className="mr-2 h-4 w-4"/>
            Add patient
          </Button>
        </div>) : (<div className="grid gap-3">
          {filtered.map((c) => {
                    const isNotAccepted = c.acceptanceStatus === "not_accepted";
                    const cardClasses = isNotAccepted
                        ? "rounded-xl border border-gray-200 bg-white p-4"
                        : "group rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";
                    const pendingInviteId = c.pendingInviteId || c.id;
                    const isResending = resendingInviteId === pendingInviteId;
                    const isDeleting = deletingInviteId === pendingInviteId;
                    const isRemoving = removingClientId === c.id;
                    const resendInvite = async () => {
                        if (!pendingInviteId)
                            return;
                        setResendingInviteId(pendingInviteId);
                        try {
                            const response = await fetch("/api/therapist/patients/invites/resend", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ inviteId: pendingInviteId }),
                            });
                            const payload = await response.json().catch(() => ({}));
                            if (!response.ok) {
                                throw new Error(payload?.error || "Failed to resend consent email");
                            }
                            toast.success("Consent email sent again.");
                        }
                        catch (error) {
                            toast.error(error instanceof Error ? error.message : "Failed to resend consent email");
                        }
                        finally {
                            setResendingInviteId(null);
                        }
                    };
                    const deleteInvite = async () => {
                        if (!pendingInviteId)
                            return;
                        const ok = window.confirm("Delete this pending invite? This cannot be undone.");
                        if (!ok)
                            return;
                        setDeletingInviteId(pendingInviteId);
                        try {
                            const response = await fetch(`/api/therapist/patients/invites/${encodeURIComponent(pendingInviteId)}`, {
                                method: "DELETE",
                            });
                            const payload = await response.json().catch(() => ({}));
                            if (!response.ok) {
                                throw new Error(payload?.error || "Failed to delete invite");
                            }
                            toast.success("Invite deleted.");
                            setHiddenClientIds((prev) => {
                                const next = new Set(prev);
                                next.add(c.id);
                                return next;
                            });
                        }
                        catch (error) {
                            toast.error(error instanceof Error ? error.message : "Failed to delete invite");
                        }
                        finally {
                            setDeletingInviteId(null);
                        }
                    };
                    const removeClient = async () => {
                        const ok = window.confirm("Archive this patient from your caseload? Their records stay in the system, but they will no longer appear as your active patient.");
                        if (!ok)
                            return;
                        setRemovingClientId(c.id);
                        try {
                            const response = await fetch(`/api/therapist/patients/${encodeURIComponent(c.id)}`, {
                                method: "DELETE",
                            });
                            const payload = await response.json().catch(() => ({}));
                            if (!response.ok) {
                                throw new Error(payload?.error || "Failed to remove client");
                            }
                            toast.success("Patient archived.");
                            setHiddenClientIds((prev) => {
                                const next = new Set(prev);
                                next.add(c.id);
                                return next;
                            });
                        }
                        catch (error) {
                            toast.error(error instanceof Error ? error.message : "Failed to remove client");
                        }
                        finally {
                            setRemovingClientId(null);
                        }
                    };
                    const content = (<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="truncate text-base font-semibold text-gray-900">
                    {c.name || "Patient"}
                  </div>
                  <div className="truncate text-sm text-gray-500">{c.email}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="secondary">Chart</Badge>
                    <Badge variant="outline">Forms: {formCounts?.[c.id] ?? 0}</Badge>
                    <Badge variant="outline">Notes: {noteCounts?.[c.id] ?? 0}</Badge>
                    {isNotAccepted ? (<Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
                        Not accepted
                      </Badge>) : null}
                  </div>
                </div>
                {isNotAccepted ? (<div className="flex flex-wrap items-center justify-end gap-2">
                    <Button variant="outline" size="sm" disabled={isResending || isDeleting} onClick={resendInvite} className="h-9 rounded-full px-3">
                      {isResending ? "Inviting..." : "Invite again"}
                    </Button>
                    <Button variant="destructive" size="sm" disabled={isDeleting || isResending} onClick={deleteInvite} className="h-9 rounded-full px-3">
                      <Trash2 className="mr-2 h-4 w-4"/>
                      {isDeleting ? "Deleting..." : "Delete invite"}
                    </Button>
                  </div>) : (<div className="flex flex-wrap items-center justify-end gap-2">
                    <Button asChild size="sm" variant="outline" className="h-9 rounded-full px-3">
                      <Link href={`/therapist/clients/${c.id}`}>
                        Open
                        <ArrowRight className="ml-2 h-4 w-4"/>
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" disabled={isRemoving} onClick={removeClient} className="h-9 rounded-full border-red-200 px-3 text-red-700 hover:bg-red-50 hover:text-red-800">
                      <Trash2 className="mr-2 h-4 w-4"/>
                      {isRemoving ? "Archiving..." : "Archive"}
                    </Button>
                  </div>)}
              </div>);
                    if (isNotAccepted) {
                        return (<div key={c.id} className={cardClasses}>
                  {content}
                </div>);
                    }
                    return (<div key={c.id} className={cardClasses}>
                {content}
              </div>);
                })}
        </div>)}
      </>)}
    </div>);
}
