"use client";
import { useEffect, useMemo, useState } from "react";
import { TherapistPatientsHub } from "@/components/ca33821be0c0";
export function TherapistRecordsClient({ initialCharts, initialNotes, initialTasks, clients, therapist, action, }) {
    const [addPatientOpen, setAddPatientOpen] = useState(false);
    const summary = useMemo(() => {
        const notes = initialNotes.length;
        const forms = initialCharts.length;
        const tasks = initialTasks.length;
        const openTasks = initialTasks.filter((task) => task?.status !== "completed").length;
        return { notes, forms, tasks, openTasks };
    }, [initialCharts, initialNotes, initialTasks]);
    const counts = useMemo(() => {
        const formCounts = {};
        for (const c of initialCharts) {
            const pid = (c?.seeker_id ?? c?.patient_id);
            if (!pid)
                continue;
            formCounts[pid] = (formCounts[pid] ?? 0) + 1;
        }
        const noteCounts = {};
        for (const n of initialNotes) {
            const pid = (n?.seeker_id ?? n?.patient_id);
            if (!pid)
                continue;
            noteCounts[pid] = (noteCounts[pid] ?? 0) + 1;
        }
        return { formCounts, noteCounts };
    }, [initialCharts, initialNotes]);
    useEffect(() => {
        if (action !== "add")
            return;
        setAddPatientOpen(true);
    }, [action]);
    return (<div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
              Therapist Records
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-gray-900">Records</h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-600">
              Manage patient charts, forms, and notes from one place. Keep every client
              up to date with clear documentation and fast access.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="min-w-[120px] rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-500">Patients</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{clients.length}</p>
            </div>
            <div className="min-w-[120px] rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-500">Forms</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{summary.forms}</p>
            </div>
            <div className="min-w-[120px] rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-500">Notes</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{summary.notes}</p>
            </div>
            <div className="min-w-[120px] rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-500">Open tasks</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{summary.openTasks}</p>
            </div>
          </div>
        </div>
      </div>

      <TherapistPatientsHub clients={clients} therapist={therapist} addPatientOpen={addPatientOpen} onAddPatientOpenChange={setAddPatientOpen} formCounts={counts.formCounts} noteCounts={counts.noteCounts}/>
    </div>);
}
