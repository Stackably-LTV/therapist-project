import { z } from 'zod';
// ============================================================================
// SESSION DATA SCHEMA (session_data_json field)
// ============================================================================
export const sessionDataSchema = z.object({
    // Video session (Agora)
    agoraChannelName: z.string().optional(),
    recordingConsent: z.object({
        granted: z.boolean(),
        consentedAt: z.string(),
        recordingUrl: z.string().url().optional()
    }).optional(),
    // Progress notes
    notes: z.object({
        summary: z.string(),
        clientState: z.string(),
        interventions: z.array(z.string()),
        homeworkAssigned: z.string(),
        nextSteps: z.string(),
        isAiGenerated: z.boolean(),
        createdAt: z.string(),
        createdBy: z.string().uuid()
    }).optional(),
    // Tasks assigned to client
    tasks: z.array(z.object({
        id: z.string().uuid(),
        title: z.string(),
        description: z.string(),
        dueDate: z.string(),
        completed: z.boolean(),
        completedAt: z.string().optional()
    })).optional(),
    // Dynamic assessment forms
    assessments: z.array(z.object({
        formId: z.string(),
        formTitle: z.string(),
        responses: z.record(z.string(), z.unknown()),
        completedAt: z.string()
    })).optional(),
    // Treatment plan (if created during session)
    treatmentPlan: z.object({
        goals: z.array(z.object({
            id: z.string().uuid(),
            description: z.string(),
            targetDate: z.string(),
            status: z.enum(['not_started', 'in_progress', 'achieved'])
        })),
        assessmentSchedule: z.string().optional(),
        interventionStrategies: z.array(z.string()).optional()
    }).optional(),
    // Session metadata
    cancellationReason: z.string().optional(),
    cancellationInitiatedBy: z.enum(['client', 'therapist']).optional(),
    noShowReason: z.string().optional(),
    techIssues: z.array(z.string()).optional()
});
// ============================================================================
// TREATMENT PLAN SCHEMA (standalone)
// ============================================================================
export const treatmentPlanSchema = z.object({
    goals: z.array(z.object({
        id: z.string().uuid(),
        description: z.string(),
        targetDate: z.string(),
        status: z.enum(['not_started', 'in_progress', 'achieved'])
    })),
    assessmentSchedule: z.string().optional(),
    interventionStrategies: z.array(z.string()).optional()
});
// ============================================================================
// PROGRESS NOTES SCHEMA (standalone)
// ============================================================================
export const progressNotesSchema = z.object({
    summary: z.string().min(50).max(5000),
    clientState: z.string().min(20).max(2000),
    interventions: z.array(z.string()).min(1),
    homeworkAssigned: z.string().max(1000),
    nextSteps: z.string().min(20).max(1000),
    isAiGenerated: z.boolean(),
    createdAt: z.string(),
    createdBy: z.string().uuid()
});
// ============================================================================
// TASK SCHEMA (standalone)
// ============================================================================
export const taskSchema = z.object({
    id: z.string().uuid(),
    title: z.string().min(3).max(200),
    description: z.string().max(2000),
    dueDate: z.string(),
    completed: z.boolean(),
    completedAt: z.string().optional()
});
// ============================================================================
// INSURANCE JSON SCHEMA (billing table)
// ============================================================================
export const insuranceJsonSchema = z.object({
    provider: z.string().optional(),
    policyNumber: z.string().optional(),
    claimNumber: z.string().optional(),
    claimStatus: z.enum(['submitted', 'approved', 'denied']).optional(),
    coveredAmount: z.number().optional(),
    patientResponsibility: z.number().optional()
});
