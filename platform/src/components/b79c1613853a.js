import { create } from 'zustand';
import { isCareTaskStatus } from '@/components/984f0d44ede2';
export const useCareTaskStore = create((set) => ({
    tasksByClientId: {},
    hydrateClientTasks: (clientId, tasks) => set((state) => ({
        tasksByClientId: {
            ...state.tasksByClientId,
            [clientId]: tasks,
        },
    })),
    upsertClientTask: (clientId, task) => set((state) => {
        const existing = state.tasksByClientId[clientId] ?? [];
        const index = existing.findIndex((item) => item.id === task.id);
        const next = index >= 0
            ? existing.map((item) => (item.id === task.id ? { ...item, ...task } : item))
            : [task, ...existing];
        return {
            tasksByClientId: {
                ...state.tasksByClientId,
                [clientId]: next,
            },
        };
    }),
    removeClientTask: (clientId, taskId) => set((state) => {
        const existing = state.tasksByClientId[clientId] ?? [];
        return {
            tasksByClientId: {
                ...state.tasksByClientId,
                [clientId]: existing.filter((task) => task.id !== taskId),
            },
        };
    }),
    updateClientTaskStatus: (clientId, taskId, status) => set((state) => {
        const existing = state.tasksByClientId[clientId] ?? [];
        const next = existing.map((task) => {
            if (task.id !== taskId)
                return task;
            if (!isCareTaskStatus(status))
                return task;
            return {
                ...task,
                status,
                completedAt: status === 'completed' ? new Date().toISOString() : null,
            };
        });
        return {
            tasksByClientId: {
                ...state.tasksByClientId,
                [clientId]: next,
            },
        };
    }),
}));
