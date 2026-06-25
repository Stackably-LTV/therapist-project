import { CARE_TASK_STATUS_LABELS } from '@/components/984f0d44ede2';
const STATUS_CLASSNAME = {
    pending: 'bg-amber-100 text-amber-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-slate-200 text-slate-700',
};
export function TaskStatusBadge({ status }) {
    return (<span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSNAME[status]}`}>
      {CARE_TASK_STATUS_LABELS[status]}
    </span>);
}
