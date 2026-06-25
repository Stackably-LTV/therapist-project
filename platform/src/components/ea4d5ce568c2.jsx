'use client';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/2795b661f080';
import { Input } from '@/components/c2f62fb0cb5e';
import { Label } from '@/components/78846397f3ca';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/1712d8a01fd3';
import { Textarea } from '@/components/e1d2ad49fd73';
import { toast } from 'sonner';
import { TaskStatusBadge } from '@/components/37dbbb6eba06';
import { CARE_TASK_STATUSES, CARE_TASK_STATUS_LABELS, isCareTaskStatus, } from '@/components/984f0d44ede2';
import { useCareTaskStore } from '@/components/b79c1613853a';
const EMPTY_TASKS = [];
function toTaskItem(raw, clientId) {
    const status = isCareTaskStatus(raw.status) ? raw.status : 'pending';
    const priority = raw.priority === 'low' || raw.priority === 'high' || raw.priority === 'normal'
        ? raw.priority
        : 'normal';
    return {
        id: String(raw.id),
        seekerId: clientId,
        title: String(raw.title || 'Untitled task'),
        description: raw.description ? String(raw.description) : undefined,
        status,
        priority,
        source: String(raw.source || 'records'),
        dueDate: raw.due_date ? String(raw.due_date) : undefined,
        assignedAt: raw.assigned_at ? String(raw.assigned_at) : undefined,
        completedAt: raw.completed_at ? String(raw.completed_at) : null,
    };
}
export function PatientTasksTab({ clientId, clientName, initialTasks, }) {
    const hydrateClientTasks = useCareTaskStore((s) => s.hydrateClientTasks);
    const upsertClientTask = useCareTaskStore((s) => s.upsertClientTask);
    const removeClientTask = useCareTaskStore((s) => s.removeClientTask);
    const updateClientTaskStatus = useCareTaskStore((s) => s.updateClientTaskStatus);
    const tasks = useCareTaskStore((s) => s.tasksByClientId[clientId] || EMPTY_TASKS);
    const [assigningTask, setAssigningTask] = useState(false);
    const [statusUpdatingById, setStatusUpdatingById] = useState({});
    const [taskTitle, setTaskTitle] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [taskDueDate, setTaskDueDate] = useState('');
    const [taskPriority, setTaskPriority] = useState('normal');
    useEffect(() => {
        hydrateClientTasks(clientId, initialTasks.map((task) => toTaskItem(task, clientId)));
    }, [clientId, initialTasks, hydrateClientTasks]);
    const sortedTasks = useMemo(() => [...tasks].sort((a, b) => new Date(b.assignedAt || 0).getTime() -
        new Date(a.assignedAt || 0).getTime()), [tasks]);
    const assignTask = async () => {
        if (!taskTitle.trim()) {
            toast.message('Task title is required.');
            return;
        }
        const tempId = `temp-${Date.now()}`;
        const dueIso = taskDueDate ? new Date(taskDueDate).toISOString() : undefined;
        upsertClientTask(clientId, {
            id: tempId,
            seekerId: clientId,
            title: taskTitle.trim(),
            description: taskDescription.trim() || undefined,
            status: 'pending',
            priority: taskPriority,
            source: 'records',
            dueDate: dueIso,
            assignedAt: new Date().toISOString(),
            completedAt: null,
        });
        setAssigningTask(true);
        try {
            const response = await fetch('/api/tasks/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId,
                    title: taskTitle.trim(),
                    description: taskDescription.trim(),
                    dueDate: dueIso,
                    priority: taskPriority,
                    source: 'records',
                    sourceContext: { createdFrom: 'patient_client_tab' },
                }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data?.error || 'Failed to assign task');
            }
            removeClientTask(clientId, tempId);
            upsertClientTask(clientId, toTaskItem({
                ...data.task,
                description: taskDescription.trim() || null,
                priority: taskPriority,
                completed_at: null,
            }, clientId));
            setTaskTitle('');
            setTaskDescription('');
            setTaskDueDate('');
            setTaskPriority('normal');
            toast.success('Task assigned');
        }
        catch (error) {
            removeClientTask(clientId, tempId);
            toast.error(error instanceof Error ? error.message : 'Failed to assign task');
        }
        finally {
            setAssigningTask(false);
        }
    };
    const handleStatusChange = async (taskId, status) => {
        const previous = tasks.find((task) => task.id === taskId)?.status;
        if (!previous || previous === status)
            return;
        updateClientTaskStatus(clientId, taskId, status);
        setStatusUpdatingById((prev) => ({ ...prev, [taskId]: true }));
        try {
            const response = await fetch('/api/tasks/update-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskId, status }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok)
                throw new Error(data?.error || 'Failed to update status');
        }
        catch (error) {
            updateClientTaskStatus(clientId, taskId, previous);
            toast.error(error instanceof Error ? error.message : 'Failed to update status');
        }
        finally {
            setStatusUpdatingById((prev) => ({ ...prev, [taskId]: false }));
        }
    };
    return (<div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">Assign task from records</h3>
        <p className="mt-1 text-sm text-gray-600">
          Create actionable tasks for {clientName}. Tasks sync to seeker dashboard and messaging context.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-1 md:col-span-2">
            <Label htmlFor="client-task-title">Task title</Label>
            <Input id="client-task-title" value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Example: Fill mood tracker before next session"/>
          </div>
          <div className="space-y-1">
            <Label htmlFor="client-task-priority">Priority</Label>
            <Select value={taskPriority} onValueChange={(value) => setTaskPriority(value)}>
              <SelectTrigger id="client-task-priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="client-task-due">Due date (optional)</Label>
            <Input id="client-task-due" type="datetime-local" value={taskDueDate} onChange={(event) => setTaskDueDate(event.target.value)}/>
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label htmlFor="client-task-description">Description (optional)</Label>
            <Textarea id="client-task-description" rows={3} value={taskDescription} onChange={(event) => setTaskDescription(event.target.value)} placeholder="Clear instructions improve task completion."/>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="button" onClick={() => void assignTask()} disabled={assigningTask || !taskTitle.trim()}>
            {assigningTask ? 'Assigning...' : 'Assign task'}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">Task tracker</h3>
        <p className="mt-1 text-sm text-gray-600">Live task progress for this client.</p>
        <div className="mt-4 space-y-3">
          {sortedTasks.length === 0 ? (<p className="text-sm text-gray-500">No tasks assigned yet.</p>) : (sortedTasks.map((task) => {
            const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : null;
            const priorityStyles = {
                low: 'border-l-4 border-l-slate-300 bg-slate-50/80',
                normal: 'border-l-4 border-l-blue-400 bg-blue-50/50',
                high: 'border-l-4 border-l-amber-500 bg-amber-50/60',
            };
            const cardClass = priorityStyles[task.priority] || priorityStyles.normal;
            return (<div key={task.id} className={`rounded-xl border border-gray-200 p-4 shadow-sm transition-shadow hover:shadow-md ${cardClass}`}>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900">{task.title}</p>
                      {task.description ? (<p className="mt-1 text-sm text-gray-600 line-clamp-2">{task.description}</p>) : null}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <TaskStatusBadge status={task.status}/>
                        {dueDate ? (<span className="text-xs text-gray-500">Due {dueDate}</span>) : null}
                      </div>
                    </div>
                    <div className="shrink-0 sm:ml-3">
                      <Select value={task.status} disabled={Boolean(statusUpdatingById[task.id])} onValueChange={(value) => void handleStatusChange(task.id, value)}>
                        <SelectTrigger className="h-8 w-[140px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CARE_TASK_STATUSES.map((status) => (<SelectItem key={status} value={status} className="text-xs">
                              {CARE_TASK_STATUS_LABELS[status]}
                            </SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>);
        }))}
        </div>
      </div>
    </div>);
}
