"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/2795b661f080";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/bc12d3573eef";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, } from "@/components/ba221113eac7";
import { Input } from "@/components/c2f62fb0cb5e";
import { Label } from "@/components/78846397f3ca";
import { Textarea } from "@/components/e1d2ad49fd73";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/1712d8a01fd3";
import { Switch } from "@/components/395ec797588e";
import { Badge } from "@/components/30348591d689";
import { Plus, Pencil, Trash2, ClipboardCheck, User, Send, Eye, X } from "lucide-react";
import { DiagnosisSearchDropdown } from "@/components/5055abb6c22e";
const CHART_TYPES = [
    { value: "intake", label: "Intake Form" },
    { value: "assessment", label: "Assessment" },
    { value: "progress_summary", label: "Progress Summary" },
    { value: "discharge_summary", label: "Discharge Summary" },
    { value: "treatment_summary", label: "Treatment Summary" },
    { value: "custom", label: "Custom" },
];
const CHART_STATUSES = [
    { value: "draft", label: "Draft", color: "bg-gray-100 text-gray-800" },
    { value: "assigned", label: "Assigned", color: "bg-blue-100 text-blue-800" },
    { value: "completed", label: "Completed", color: "bg-green-100 text-green-800" },
    { value: "reviewed", label: "Reviewed", color: "bg-purple-100 text-purple-800" },
];
const CHART_TEMPLATES = {
    intake: {
        title: "Intake Form",
        description: "Capture the client’s initial presentation and clinical baseline.",
        sections: [
            {
                title: "Presenting Concerns",
                fields: [
                    { key: "referralSource", label: "Referral source", type: "text", placeholder: "Self, PCP, school, court, etc." },
                    { key: "presentingConcern", label: "Presenting concern", type: "textarea", rows: 4, placeholder: "Client’s primary reason for seeking care." },
                    { key: "clientGoals", label: "Client goals", type: "textarea", rows: 3, placeholder: "Desired outcomes from treatment." },
                ],
            },
            {
                title: "History",
                fields: [
                    { key: "historyOfPresentingProblem", label: "History of present problem", type: "textarea", rows: 4 },
                    { key: "priorTreatment", label: "Prior treatment and response", type: "textarea", rows: 3 },
                    { key: "medicalHistory", label: "Medical history", type: "textarea", rows: 3 },
                    { key: "medications", label: "Current medications", type: "textarea", rows: 2 },
                    { key: "substanceUse", label: "Substance use", type: "textarea", rows: 2 },
                ],
            },
            {
                title: "Psychosocial",
                fields: [
                    { key: "familyHistory", label: "Family history", type: "textarea", rows: 3 },
                    { key: "traumaHistory", label: "Trauma history", type: "textarea", rows: 3 },
                    { key: "supports", label: "Supports and resources", type: "textarea", rows: 2 },
                    { key: "strengths", label: "Strengths", type: "textarea", rows: 2 },
                ],
            },
            {
                title: "Risk and Safety",
                fields: [
                    { key: "riskLevel", label: "Risk level", type: "select", options: ["none", "low", "moderate", "high"], defaultValue: "none" },
                    { key: "riskFactors", label: "Risk factors", type: "textarea", rows: 2 },
                    { key: "protectiveFactors", label: "Protective factors", type: "textarea", rows: 2 },
                    { key: "safetyPlan", label: "Safety plan", type: "textarea", rows: 2 },
                ],
            },
            {
                title: "Diagnosis and Plan",
                fields: [
                    { key: "diagnosisPrimary", label: "Primary diagnosis (ICD-10)", type: "diagnosis_single", placeholder: "Search ICD-10 codes (F01-F99 supported)." },
                    { key: "diagnosisSecondary", label: "Secondary diagnoses (ICD-10)", type: "diagnosis_multi" },
                    { key: "clinicalImpression", label: "Clinical impression", type: "textarea", rows: 3 },
                    { key: "initialPlan", label: "Initial plan", type: "textarea", rows: 3 },
                    { key: "recommendedFrequency", label: "Recommended frequency", type: "text", placeholder: "e.g., weekly, biweekly" },
                ],
            },
        ],
    },
    assessment: {
        title: "Assessment",
        description: "Summarize assessment findings and diagnostic impressions.",
        sections: [
            {
                title: "Assessment Overview",
                fields: [
                    { key: "assessmentDate", label: "Assessment date", type: "date" },
                    { key: "assessmentTools", label: "Assessment tools used", type: "textarea", rows: 2, placeholder: "Screeners, measures, inventories." },
                    { key: "symptomSummary", label: "Symptom summary", type: "textarea", rows: 3 },
                    { key: "functionalImpact", label: "Functional impact", type: "textarea", rows: 3 },
                ],
            },
            {
                title: "Clinical Findings",
                fields: [
                    { key: "mentalStatus", label: "Mental status exam summary", type: "textarea", rows: 3 },
                    { key: "diagnosisPrimary", label: "Primary diagnosis (ICD-10)", type: "diagnosis_single" },
                    { key: "diagnosisSecondary", label: "Secondary diagnoses (ICD-10)", type: "diagnosis_multi" },
                    { key: "diagnosticRationale", label: "Diagnostic rationale", type: "textarea", rows: 3 },
                ],
            },
            {
                title: "Risk and Safety",
                fields: [
                    { key: "riskLevel", label: "Risk level", type: "select", options: ["none", "low", "moderate", "high"], defaultValue: "none" },
                    { key: "riskNotes", label: "Risk notes", type: "textarea", rows: 2 },
                    { key: "protectiveFactors", label: "Protective factors", type: "textarea", rows: 2 },
                    { key: "safetyPlan", label: "Safety plan", type: "textarea", rows: 2 },
                ],
            },
            {
                title: "Recommendations",
                fields: [
                    { key: "recommendations", label: "Recommendations", type: "textarea", rows: 3 },
                    { key: "nextSteps", label: "Next steps", type: "textarea", rows: 2 },
                ],
            },
        ],
    },
    progress_summary: {
        title: "Progress Summary",
        description: "Capture progress across a treatment period.",
        sections: [
            {
                title: "Timeframe and Attendance",
                fields: [
                    { key: "dateRange", label: "Date range", type: "text", placeholder: "e.g., Jan 5 – Mar 28" },
                    { key: "attendanceSummary", label: "Attendance summary", type: "textarea", rows: 2 },
                ],
            },
            {
                title: "Clinical Progress",
                fields: [
                    { key: "goalsProgress", label: "Progress toward goals", type: "textarea", rows: 3 },
                    { key: "interventionsUsed", label: "Interventions used", type: "textarea", rows: 3 },
                    { key: "responseToTreatment", label: "Response to treatment", type: "textarea", rows: 3 },
                    { key: "barriers", label: "Barriers to progress", type: "textarea", rows: 2 },
                ],
            },
            {
                title: "Risk and Care Coordination",
                fields: [
                    { key: "riskUpdates", label: "Risk updates", type: "textarea", rows: 2 },
                    { key: "medicationAdherence", label: "Medication adherence", type: "textarea", rows: 2 },
                    { key: "careCoordination", label: "Care coordination", type: "textarea", rows: 2 },
                ],
            },
            {
                title: "Plan",
                fields: [
                    { key: "planNextSteps", label: "Plan and next steps", type: "textarea", rows: 3 },
                ],
            },
        ],
    },
    discharge_summary: {
        title: "Discharge Summary",
        description: "Summarize treatment course and aftercare needs.",
        sections: [
            {
                title: "Discharge Details",
                fields: [
                    { key: "dischargeDate", label: "Discharge date", type: "date" },
                    {
                        key: "dischargeReason",
                        label: "Reason for discharge",
                        type: "select",
                        options: ["treatment_completed", "client_withdrew", "lost_to_follow_up", "referred_out", "other"],
                        defaultValue: "treatment_completed",
                    },
                    { key: "dischargeReasonNotes", label: "Discharge notes", type: "textarea", rows: 2 },
                ],
            },
            {
                title: "Treatment Summary",
                fields: [
                    { key: "treatmentProvided", label: "Treatment provided", type: "textarea", rows: 3 },
                    { key: "progressSummary", label: "Progress summary", type: "textarea", rows: 3 },
                    { key: "goalsMet", label: "Goals met", type: "textarea", rows: 2 },
                    { key: "currentStatus", label: "Current clinical status", type: "textarea", rows: 2 },
                ],
            },
            {
                title: "Aftercare",
                fields: [
                    { key: "medicationPlan", label: "Medication plan", type: "textarea", rows: 2 },
                    { key: "riskAssessment", label: "Risk assessment", type: "textarea", rows: 2 },
                    { key: "aftercarePlan", label: "Aftercare plan", type: "textarea", rows: 3 },
                    { key: "referrals", label: "Referrals", type: "textarea", rows: 2 },
                    { key: "followUp", label: "Follow-up instructions", type: "textarea", rows: 2 },
                ],
            },
        ],
    },
    treatment_summary: {
        title: "Treatment Summary",
        description: "Document diagnosis, modalities, and outcomes.",
        sections: [
            {
                title: "Treatment Timeline",
                fields: [
                    { key: "treatmentStart", label: "Treatment start", type: "date" },
                    { key: "treatmentEnd", label: "Treatment end", type: "date" },
                    { key: "frequency", label: "Session frequency", type: "text" },
                ],
            },
            {
                title: "Clinical Overview",
                fields: [
                    { key: "primaryDiagnosis", label: "Primary diagnosis (ICD-10)", type: "diagnosis_single" },
                    { key: "secondaryDiagnoses", label: "Secondary diagnoses (ICD-10)", type: "diagnosis_multi" },
                    { key: "modalities", label: "Modalities used", type: "textarea", rows: 2 },
                    { key: "treatmentGoals", label: "Treatment goals", type: "textarea", rows: 3 },
                ],
            },
            {
                title: "Outcomes",
                fields: [
                    { key: "progressSummary", label: "Progress summary", type: "textarea", rows: 3 },
                    { key: "outcomes", label: "Outcomes and response", type: "textarea", rows: 3 },
                    { key: "recommendations", label: "Recommendations", type: "textarea", rows: 2 },
                ],
            },
        ],
    },
    custom: {
        title: "Custom Form",
        description: "Use this for freeform clinical notes or special templates.",
        sections: [
            {
                title: "Notes",
                fields: [
                    { key: "narrative", label: "Narrative", type: "textarea", rows: 8, placeholder: "Enter your note..." },
                ],
            },
        ],
    },
};
function getChartTemplate(type) {
    return CHART_TEMPLATES[type] ?? CHART_TEMPLATES.custom;
}
function getDefaultChartTitle(type) {
    const title = getChartTemplate(type).title;
    return title?.trim() ? title : "Chart";
}
function buildDefaultFields(type) {
    const template = getChartTemplate(type);
    const fields = {};
    template.sections.forEach((section) => {
        section.fields.forEach((field) => {
            if (field.defaultValue !== undefined) {
                fields[field.key] = field.defaultValue;
                return;
            }
            fields[field.key] = field.type === "checkbox" ? false : field.type === "diagnosis_multi" ? [] : "";
        });
    });
    return fields;
}
function normalizeContentFields(content, type) {
    const defaults = buildDefaultFields(type);
    if (!content || typeof content !== "object")
        return defaults;
    const rawFields = content.fields;
    if (rawFields && typeof rawFields === "object") {
        return { ...defaults, ...rawFields };
    }
    const textFallback = content.text;
    if (textFallback) {
        return { ...defaults, narrative: String(textFallback) };
    }
    return defaults;
}
function buildContentPayload(type, fields) {
    return {
        schemaVersion: 1,
        chartType: type,
        fields,
    };
}
function getChartPreview(content, type) {
    if (!content || typeof content !== "object")
        return "";
    const fields = normalizeContentFields(content, type);
    const keys = [
        "presentingConcern",
        "symptomSummary",
        "progressSummary",
        "treatmentProvided",
        "treatmentGoals",
        "recommendations",
        "clinicalImpression",
        "planNextSteps",
        "narrative",
    ];
    for (const key of keys) {
        const value = fields[key];
        if (typeof value === "string" && value.trim())
            return value.trim();
    }
    return "";
}
function formatFieldValue(value) {
    if (typeof value === "boolean")
        return value ? "Yes" : "No";
    if (Array.isArray(value)) {
        const cleaned = value.map((v) => String(v || "").trim()).filter(Boolean);
        return cleaned.length ? cleaned.join("\n") : null;
    }
    if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed.length ? trimmed : null;
    }
    return null;
}
export function PatientChartsClient({ initialCharts, clients, hideHeader = false, createOpen, onCreateOpenChange, fixedPatientId, hidePatientRow = false, }) {
    const [charts, setCharts] = useState(initialCharts);
    const [isCreateOpen, setIsCreateOpen] = useState(!!createOpen);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [editingChart, setEditingChart] = useState(null);
    const [viewingChart, setViewingChart] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [title, setTitle] = useState(() => getDefaultChartTitle("custom"));
    const [chartType, setChartType] = useState("custom");
    const [contentFields, setContentFields] = useState({});
    const [patientId, setPatientId] = useState(fixedPatientId ?? "__none__");
    const [isShared, setIsShared] = useState(true);
    const resetForm = () => {
        setChartType("custom");
        setTitle(getDefaultChartTitle("custom"));
        setContentFields(buildDefaultFields("custom"));
        setPatientId(fixedPatientId ?? "__none__");
        setIsShared(true);
    };
    const handleCreateChartTypeChange = (nextType) => {
        setChartType(nextType);
        setTitle(getDefaultChartTitle(nextType));
    };
    const handleCreateOpenChange = (open) => {
        setIsCreateOpen(open);
        onCreateOpenChange?.(open);
    };
    useEffect(() => {
        if (createOpen === undefined)
            return;
        setIsCreateOpen(createOpen);
    }, [createOpen]);
    useEffect(() => {
        if (isEditOpen || editingChart)
            return;
        setContentFields(buildDefaultFields(chartType));
    }, [chartType, editingChart, isEditOpen]);
    useEffect(() => {
        if (!fixedPatientId)
            return;
        setPatientId(fixedPatientId);
    }, [fixedPatientId]);
    const handleCreate = async () => {
        if (!title.trim())
            return;
        setIsLoading(true);
        try {
            const res = await fetch("/api/therapist/charts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    chartType,
                    content: buildContentPayload(chartType, contentFields),
                    patientId: patientId === "__none__" ? null : patientId,
                    isShared,
                }),
            });
            if (res.ok) {
                const { chart } = await res.json();
                setCharts([chart, ...charts]);
                handleCreateOpenChange(false);
                resetForm();
            }
        }
        catch (error) {
            console.error("Failed to create chart:", error);
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleEdit = async () => {
        if (!editingChart || !title.trim())
            return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/therapist/charts/${editingChart.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    chartType,
                    content: buildContentPayload(chartType, contentFields),
                    patientId: patientId === "__none__" ? null : patientId,
                    isShared,
                }),
            });
            if (res.ok) {
                const { chart } = await res.json();
                setCharts(charts.map((c) => (c.id === chart.id ? chart : c)));
                setIsEditOpen(false);
                setEditingChart(null);
                resetForm();
            }
        }
        catch (error) {
            console.error("Failed to update chart:", error);
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleAssign = async (chartId, newPatientId) => {
        try {
            const res = await fetch(`/api/therapist/charts/${chartId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    patientId: newPatientId,
                    status: "assigned",
                    isShared: true,
                }),
            });
            if (res.ok) {
                const { chart } = await res.json();
                setCharts(charts.map((c) => (c.id === chart.id ? chart : c)));
            }
        }
        catch (error) {
            console.error("Failed to assign chart:", error);
        }
    };
    const handleStatusChange = async (chartId, newStatus) => {
        try {
            const res = await fetch(`/api/therapist/charts/${chartId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                const { chart } = await res.json();
                setCharts(charts.map((c) => (c.id === chart.id ? chart : c)));
            }
        }
        catch (error) {
            console.error("Failed to update status:", error);
        }
    };
    const handleDelete = async (chartId) => {
        if (!confirm("Are you sure you want to delete this chart?"))
            return;
        try {
            const res = await fetch(`/api/therapist/charts/${chartId}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setCharts(charts.filter((c) => c.id !== chartId));
            }
        }
        catch (error) {
            console.error("Failed to delete chart:", error);
        }
    };
    const openEditDialog = (chart) => {
        setEditingChart(chart);
        setTitle(chart.title);
        setChartType(chart.chart_type);
        setContentFields(normalizeContentFields(chart.content, chart.chart_type));
        setPatientId(fixedPatientId ?? (chart.patient_id || "__none__"));
        setIsShared(chart.is_shared);
        setIsEditOpen(true);
    };
    const openViewDialog = (chart) => {
        setViewingChart(chart);
        setIsViewOpen(true);
    };
    const getChartTypeLabel = (type) => {
        return CHART_TYPES.find((t) => t.value === type)?.label || type;
    };
    const getStatusInfo = (status) => {
        return CHART_STATUSES.find((s) => s.value === status) || CHART_STATUSES[0];
    };
    const chartTemplate = useMemo(() => getChartTemplate(chartType), [chartType]);
    const updateFieldValue = (key, value) => {
        setContentFields((prev) => ({ ...prev, [key]: value }));
    };
    const draftCharts = charts.filter((c) => c.status === "draft");
    const assignedCharts = charts.filter((c) => c.status === "assigned");
    const completedCharts = charts.filter((c) => ["completed", "reviewed"].includes(c.status));
    return (<div className="space-y-8">
      {!hideHeader ? (<div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Forms</h1>
            <p className="mt-2 text-gray-600">Create and assign forms to patients</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={handleCreateOpenChange}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="mr-2 h-4 w-4"/>
                New Chart
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Chart</DialogTitle>
                <DialogDescription>
                  {fixedPatientId
                ? "Create a new chart for this patient."
                : "Create a new chart. You can assign it to a patient now or later."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" value={title} readOnly placeholder="Auto-generated from chart type"/>
                  <p className="text-xs text-muted-foreground">Auto-generated from chart type.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`grid gap-2 ${fixedPatientId ? "col-span-2" : ""}`}>
                    <Label htmlFor="chartType">Chart Type</Label>
                    <Select value={chartType} onValueChange={handleCreateChartTypeChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CHART_TYPES.map((type) => (<SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  {!fixedPatientId ? (<div className="grid gap-2">
                      <Label htmlFor="patient">Assign to Patient</Label>
                      <Select value={patientId} onValueChange={setPatientId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select patient"/>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">No patient (draft)</SelectItem>
                          {clients.map((client) => (<SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>) : null}
                </div>
                <ChartFields template={chartTemplate} values={contentFields} onChange={updateFieldValue}/>
                <div className="flex items-center gap-2">
                  <Switch id="shared" checked={isShared} onCheckedChange={setIsShared}/>
                  <Label htmlFor="shared">Share with patient (patient can view this chart)</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => handleCreateOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={isLoading || !title.trim()}>
                  {isLoading
                ? "Creating..."
                : fixedPatientId || patientId !== "__none__"
                    ? "Create"
                    : "Save as Draft"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>) : (<Dialog open={isCreateOpen} onOpenChange={handleCreateOpenChange}>
          <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Chart</DialogTitle>
              <DialogDescription>
                {fixedPatientId
                ? "Create a new chart for this patient."
                : "Create a new chart. You can assign it to a patient now or later."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={title} readOnly placeholder="Auto-generated from chart type"/>
                <p className="text-xs text-muted-foreground">Auto-generated from chart type.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className={`grid gap-2 ${fixedPatientId ? "col-span-2" : ""}`}>
                  <Label htmlFor="chartType">Chart Type</Label>
                  <Select value={chartType} onValueChange={handleCreateChartTypeChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CHART_TYPES.map((type) => (<SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                {!fixedPatientId ? (<div className="grid gap-2">
                    <Label htmlFor="patient">Assign to Patient</Label>
                    <Select value={patientId} onValueChange={setPatientId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select patient"/>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">No patient (draft)</SelectItem>
                        {clients.map((client) => (<SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>) : null}
              </div>
              <ChartFields template={chartTemplate} values={contentFields} onChange={updateFieldValue}/>
              <div className="flex items-center gap-2">
                <Switch id="shared" checked={isShared} onCheckedChange={setIsShared}/>
                <Label htmlFor="shared">Share with patient (patient can view this chart)</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleCreateOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isLoading || !title.trim()}>
                {isLoading
                ? "Creating..."
                : fixedPatientId || patientId !== "__none__"
                    ? "Create"
                    : "Save as Draft"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>)}

      {charts.length === 0 ? (<div className="bg-white rounded-lg shadow p-12 text-center">
          <ClipboardCheck className="mx-auto h-12 w-12 text-gray-400 mb-4"/>
          <p className="text-gray-500 mb-4">No charts yet</p>
          <p className="text-sm text-gray-400 mb-6">
            Create your first chart to get started
          </p>
          <Button onClick={() => {
                resetForm();
                handleCreateOpenChange(true);
            }}>
            <Plus className="mr-2 h-4 w-4"/>
            Create Chart
          </Button>
        </div>) : (<div className="space-y-8">
          {draftCharts.length > 0 && (<div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Drafts ({draftCharts.length})</h2>
              <div className="grid gap-4">
                {draftCharts.map((chart) => (<ChartCard key={chart.id} chart={chart} clients={clients} onEdit={() => openEditDialog(chart)} onView={() => openViewDialog(chart)} onDelete={() => handleDelete(chart.id)} onAssign={(patientId) => handleAssign(chart.id, patientId)} onStatusChange={(status) => handleStatusChange(chart.id, status)} getChartTypeLabel={getChartTypeLabel} getStatusInfo={getStatusInfo} fixedPatientId={fixedPatientId} hidePatientRow={hidePatientRow}/>))}
              </div>
            </div>)}

          {assignedCharts.length > 0 && (<div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Assigned ({assignedCharts.length})</h2>
              <div className="grid gap-4">
                {assignedCharts.map((chart) => (<ChartCard key={chart.id} chart={chart} clients={clients} onEdit={() => openEditDialog(chart)} onView={() => openViewDialog(chart)} onDelete={() => handleDelete(chart.id)} onAssign={(patientId) => handleAssign(chart.id, patientId)} onStatusChange={(status) => handleStatusChange(chart.id, status)} getChartTypeLabel={getChartTypeLabel} getStatusInfo={getStatusInfo} fixedPatientId={fixedPatientId} hidePatientRow={hidePatientRow}/>))}
              </div>
            </div>)}

          {completedCharts.length > 0 && (<div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Completed ({completedCharts.length})</h2>
              <div className="grid gap-4">
                {completedCharts.map((chart) => (<ChartCard key={chart.id} chart={chart} clients={clients} onEdit={() => openEditDialog(chart)} onView={() => openViewDialog(chart)} onDelete={() => handleDelete(chart.id)} onAssign={(patientId) => handleAssign(chart.id, patientId)} onStatusChange={(status) => handleStatusChange(chart.id, status)} getChartTypeLabel={getChartTypeLabel} getStatusInfo={getStatusInfo} fixedPatientId={fixedPatientId} hidePatientRow={hidePatientRow}/>))}
              </div>
            </div>)}
        </div>)}

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Chart</DialogTitle>
            <DialogDescription>Update chart details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Chart title"/>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className={`grid gap-2 ${fixedPatientId ? "col-span-2" : ""}`}>
                <Label htmlFor="edit-chartType">Chart Type</Label>
                <Select value={chartType} onValueChange={setChartType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHART_TYPES.map((type) => (<SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              {!fixedPatientId ? (<div className="grid gap-2">
                  <Label htmlFor="edit-patient">Assign to Patient</Label>
                  <Select value={patientId} onValueChange={setPatientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select patient"/>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">No patient</SelectItem>
                      {clients.map((client) => (<SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>) : null}
            </div>
            <ChartFields template={chartTemplate} values={contentFields} onChange={updateFieldValue}/>
            <div className="flex items-center gap-2">
              <Switch id="edit-shared" checked={isShared} onCheckedChange={setIsShared}/>
              <Label htmlFor="edit-shared">
                Share with patient
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

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingChart?.title}</DialogTitle>
            <DialogDescription>
              {viewingChart && getChartTypeLabel(viewingChart.chart_type)}
              {viewingChart?.patient && ` - ${viewingChart.patient.name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {viewingChart ? (<div className="space-y-6">
                {getChartTemplate(viewingChart.chart_type).sections.map((section) => {
                const values = normalizeContentFields(viewingChart.content, viewingChart.chart_type);
                const visibleFields = section.fields.filter((field) => formatFieldValue(values[field.key]) !== null);
                if (!visibleFields.length)
                    return null;
                return (<div key={section.title} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <div className="mb-3">
                        <h4 className="text-sm font-semibold text-gray-900">{section.title}</h4>
                        {section.description && (<p className="text-xs text-gray-500">{section.description}</p>)}
                      </div>
                      <div className="space-y-3">
                        {visibleFields.map((field) => {
                        const value = formatFieldValue(values[field.key]);
                        return (<div key={field.key}>
                              <p className="text-xs font-semibold text-gray-600">{field.label}</p>
                              <p className="text-sm text-gray-800 whitespace-pre-wrap">{value}</p>
                            </div>);
                    })}
                      </div>
                    </div>);
            })}
              </div>) : (<div className="bg-gray-50 rounded-lg p-4 min-h-[200px]">No content</div>)}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>);
}
function ChartFields({ template, values, onChange, }) {
    const extractDxCode = (s) => {
        const m = String(s || '').trim().match(/^[A-Z][0-9]{2}(?:\.[0-9A-Za-z]+)?/);
        return m?.[0] || '';
    };
    return (<div className="space-y-6">
      {template.sections.map((section) => (<div key={section.title} className="rounded-lg border border-gray-200 p-4">
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-900">{section.title}</h4>
            {section.description && (<p className="text-xs text-gray-500">{section.description}</p>)}
          </div>
          <div className="grid gap-4">
            {section.fields.map((field) => {
                const fieldId = `field-${field.key}`;
                const currentValue = values[field.key];
                if (field.type === "diagnosis_single") {
                    const selected = typeof currentValue === "string" ? currentValue.trim() : "";
                    return (<div key={field.key} className="grid gap-2">
                    <Label htmlFor={fieldId}>{field.label}</Label>
                    {selected ? (<div className="flex flex-wrap items-center gap-2 rounded-md border bg-gray-50 px-3 py-2">
                        <Badge variant="secondary">{selected}</Badge>
                        <Button type="button" variant="ghost" size="sm" className="ml-auto h-7 px-2 text-xs" onClick={() => onChange(field.key, "")}>
                          Clear
                        </Button>
                      </div>) : (<div className="text-xs text-gray-500">No diagnosis selected yet.</div>)}
                    <DiagnosisSearchDropdown disabled={false} placeholder={field.placeholder || "Search diagnosis"} onSelect={(d) => onChange(field.key, `${d.code} — ${d.name}`)}/>
                    {field.helper && <p className="text-xs text-gray-500">{field.helper}</p>}
                  </div>);
                }
                if (field.type === "diagnosis_multi") {
                    const selectedList = Array.isArray(currentValue)
                        ? currentValue
                        : typeof currentValue === "string" && currentValue.trim()
                            ? [currentValue.trim()]
                            : [];
                    return (<div key={field.key} className="grid gap-2">
                    <Label htmlFor={fieldId}>{field.label}</Label>
                    {selectedList.length ? (<div className="flex flex-wrap gap-2 rounded-md border bg-gray-50 px-3 py-2">
                        {selectedList.map((item) => (<span key={item} className="inline-flex items-center gap-1 rounded-full border bg-white px-2 py-0.5 text-xs">
                            {item}
                            <button type="button" className="ml-1 rounded p-0.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900" onClick={() => onChange(field.key, selectedList.filter((x) => x !== item))} aria-label="Remove diagnosis">
                              <X className="h-3 w-3"/>
                            </button>
                          </span>))}
                        <Button type="button" variant="ghost" size="sm" className="ml-auto h-7 px-2 text-xs" onClick={() => onChange(field.key, [])}>
                          Clear all
                        </Button>
                      </div>) : (<div className="text-xs text-gray-500">No diagnoses added yet.</div>)}
                    <DiagnosisSearchDropdown disabled={false} placeholder={field.placeholder || "Search and add diagnosis"} onSelect={(d) => {
                            const nextItem = `${d.code} — ${d.name}`;
                            const nextCode = extractDxCode(nextItem);
                            const exists = selectedList.some((x) => extractDxCode(x) === nextCode);
                            if (exists)
                                return;
                            onChange(field.key, [...selectedList, nextItem]);
                        }}/>
                    {field.helper && <p className="text-xs text-gray-500">{field.helper}</p>}
                  </div>);
                }
                if (field.type === "textarea") {
                    return (<div key={field.key} className="grid gap-2">
                    <Label htmlFor={fieldId}>{field.label}</Label>
                    <Textarea id={fieldId} value={typeof currentValue === "string" ? currentValue : ""} onChange={(e) => onChange(field.key, e.target.value)} rows={field.rows ?? 4} placeholder={field.placeholder}/>
                    {field.helper && <p className="text-xs text-gray-500">{field.helper}</p>}
                  </div>);
                }
                if (field.type === "select") {
                    return (<div key={field.key} className="grid gap-2">
                    <Label htmlFor={fieldId}>{field.label}</Label>
                    <Select value={typeof currentValue === "string" ? currentValue : ""} onValueChange={(value) => onChange(field.key, value)}>
                      <SelectTrigger id={fieldId}>
                        <SelectValue placeholder="Select an option"/>
                      </SelectTrigger>
                      <SelectContent>
                        {(field.options || []).map((option) => (<SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>))}
                      </SelectContent>
                    </Select>
                    {field.helper && <p className="text-xs text-gray-500">{field.helper}</p>}
                  </div>);
                }
                if (field.type === "checkbox") {
                    return (<div key={field.key} className="flex items-center gap-2">
                    <Switch id={fieldId} checked={Boolean(currentValue)} onCheckedChange={(checked) => onChange(field.key, checked)}/>
                    <Label htmlFor={fieldId}>{field.label}</Label>
                  </div>);
                }
                return (<div key={field.key} className="grid gap-2">
                  <Label htmlFor={fieldId}>{field.label}</Label>
                  <Input id={fieldId} type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"} value={typeof currentValue === "string" ? currentValue : ""} onChange={(e) => onChange(field.key, e.target.value)} placeholder={field.placeholder}/>
                  {field.helper && <p className="text-xs text-gray-500">{field.helper}</p>}
                </div>);
            })}
          </div>
        </div>))}
    </div>);
}
function ChartCard({ chart, clients, onEdit, onView, onDelete, onAssign, onStatusChange, getChartTypeLabel, getStatusInfo, fixedPatientId, hidePatientRow, }) {
    const [assignOpen, setAssignOpen] = useState(false);
    const statusInfo = getStatusInfo(chart.status);
    const preview = getChartPreview(chart.content, chart.chart_type);
    return (<div className="bg-white rounded-lg shadow hover:shadow-md transition p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {chart.title}
            </h3>
            <Badge variant="secondary">{getChartTypeLabel(chart.chart_type)}</Badge>
            <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
            {chart.is_shared && (<Badge variant="outline" className="text-xs">Shared</Badge>)}
          </div>

          {!hidePatientRow && chart.patient && (<div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <User className="h-4 w-4"/>
              <span className="truncate">{chart.patient.name}</span>
              <Link href={`/therapist/clients/${chart.patient.id}`} className="text-xs text-indigo-600 hover:text-indigo-700">
                Open
              </Link>
            </div>)}

          {preview && (<p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {preview}
            </p>)}

          <p className="text-xs text-gray-400">
            Created {new Date(chart.created_at).toLocaleDateString()}
            {chart.assigned_at && ` · Assigned ${new Date(chart.assigned_at).toLocaleDateString()}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {chart.status === "draft" && !fixedPatientId && (<Dialog open={assignOpen} onOpenChange={setAssignOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Send className="h-4 w-4 mr-1"/>
                  Assign
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Chart</DialogTitle>
                  <DialogDescription>Select a patient to assign this chart to</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-2">
                  {clients.map((client) => (<Button key={client.id} variant="outline" className="w-full justify-start" onClick={() => {
                    onAssign(client.id);
                    setAssignOpen(false);
                }}>
                      <User className="h-4 w-4 mr-2"/>
                      {client.name}
                    </Button>))}
                </div>
              </DialogContent>
            </Dialog>)}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <span className="sr-only">Actions</span>
                <Pencil className="h-4 w-4"/>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onView}>
                <Eye className="mr-2 h-4 w-4"/>
                View
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onEdit}>
                <Pencil className="mr-2 h-4 w-4"/>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onDelete} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4"/>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {chart.status === "assigned" && (<Button variant="outline" size="sm" onClick={() => onStatusChange("completed")}>
              Mark Complete
            </Button>)}

          {chart.status === "completed" && (<Button variant="outline" size="sm" onClick={() => onStatusChange("reviewed")}>
              Mark Reviewed
            </Button>)}

        </div>
      </div>
    </div>);
}
