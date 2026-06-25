export const CARE_TASK_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'];
export const CARE_TASK_PRIORITIES = ['low', 'normal', 'high'];
export const CARE_TASK_STATUS_LABELS = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
};
export function isCareTaskStatus(value) {
    return typeof value === 'string' && CARE_TASK_STATUSES.includes(value);
}
