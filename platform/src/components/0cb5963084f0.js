import { z } from 'zod';
/**
 * Treatment Plan Schemas
 * Stored in session_data_json for flexibility
 */
export const goalSchema = z.object({
    id: z.string(),
    title: z.string().min(1, 'Goal title is required'),
    description: z.string().optional(),
    targetDate: z.string().optional(),
    status: z.enum(['not_started', 'in_progress', 'achieved', 'revised']).default('not_started'),
    progress: z.number().min(0).max(100).default(0),
    interventions: z.array(z.string()).default([]),
    createdAt: z.string(),
    updatedAt: z.string(),
});
export const taskSchema = z.object({
    id: z.string(),
    title: z.string().min(1, 'Task title is required'),
    description: z.string().optional(),
    dueDate: z.string().optional(),
    completed: z.boolean().default(false),
    completedAt: z.string().optional(),
    createdAt: z.string(),
});
export const progressNoteSchema = z.object({
    id: z.string(),
    sessionId: z.string(),
    date: z.string(),
    summary: z.string(),
    keyTopics: z.array(z.string()).default([]),
    observations: z.string().optional(),
    assessments: z.string().optional(),
    interventions: z.array(z.string()).default([]),
    homework: z.array(z.string()).default([]),
    nextSessionGoals: z.array(z.string()).default([]),
    riskAssessment: z
        .object({
        level: z.enum(['none', 'low', 'moderate', 'high']),
        notes: z.string().optional(),
    })
        .optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
});
export const treatmentPlanSchema = z.object({
    id: z.string(),
    clientId: z.string(),
    therapistId: z.string(),
    diagnosis: z.string().optional(),
    presentingConcerns: z.array(z.string()).default([]),
    goals: z.array(goalSchema).default([]),
    approach: z.string().optional(), // e.g., "CBT", "DBT", "Psychodynamic"
    frequency: z.string().optional(), // e.g., "Weekly", "Bi-weekly"
    estimatedDuration: z.string().optional(), // e.g., "12 weeks", "6 months"
    notes: z.string().optional(),
    status: z
        .enum(['draft', 'sent', 'active', 'completed', 'on_hold', 'terminated', 'archived'])
        .default('draft'),
    createdAt: z.string(),
    updatedAt: z.string(),
});
export const clientProgressSchema = z.object({
    overallProgress: z.number().min(0).max(100),
    goalsAchieved: z.number(),
    totalGoals: z.number(),
    sessionsCompleted: z.number(),
    tasksCompleted: z.number(),
    totalTasks: z.number(),
    recentMilestones: z.array(z.object({
        date: z.string(),
        description: z.string(),
    })),
    nextMilestone: z
        .object({
        date: z.string(),
        description: z.string(),
    })
        .optional(),
});
// Validation helpers
export function validateGoal(data) {
    return goalSchema.parse(data);
}
export function validateTask(data) {
    return taskSchema.parse(data);
}
export function validateProgressNote(data) {
    return progressNoteSchema.parse(data);
}
export function validateTreatmentPlan(data) {
    return treatmentPlanSchema.parse(data);
}
