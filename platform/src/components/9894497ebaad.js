import 'server-only';
import { createClient } from '@/components/9a6b39502e62';
import { requireFeature } from '@/components/3168fa71d1e4';
import { serializeRichMessage } from '@/components/a6e7ef5e01c9';
import { isCareTaskStatus } from '@/components/984f0d44ede2';
import { ok, fail } from '@/components/7ff049787825';
/** Normalise a raw request body into AddTaskInput, applying the same trims/defaults as the handler. */
export function parseAddTaskBody(body) {
    const b = body ?? {};
    return {
        clientId: String(b.clientId || '').trim(),
        title: String(b.title || '').trim(),
        description: String(b.description || '').trim(),
        dueDate: String(b.dueDate || '').trim(),
        priority: String(b.priority || 'normal').trim().toLowerCase(),
        source: String(b.source || 'records').trim().toLowerCase(),
        sourceContext: b.sourceContext &&
            typeof b.sourceContext === 'object'
            ? b.sourceContext
            : {},
    };
}
/**
 * Assign a task to a client. Requires the therapist role + the task_assignments
 * feature, validates an active therapist-client relationship, inserts the task,
 * and posts a rich chat message linking back to it.
 */
export async function addTask(userId, input) {
    const supabase = await createClient();
    const { data: me } = await supabase.from('user_roles').select('id, role').eq('id', userId).single();
    if (!me || me.role !== 'therapist') {
        return fail(403, 'Forbidden');
    }
    const gate = await requireFeature(userId, 'task_assignments');
    if (!gate.ok)
        return fail(gate.status, gate.error);
    const { clientId, title, description, dueDate, priority, source, sourceContext } = input;
    if (!clientId)
        return fail(400, 'clientId is required');
    if (!title)
        return fail(400, 'title is required');
    if (!['low', 'normal', 'high'].includes(priority)) {
        return fail(400, 'Invalid priority');
    }
    if (!['records', 'chat'].includes(source)) {
        return fail(400, 'Invalid source');
    }
    // Allow task assignment when there's any active relationship: a booked appointment,
    // a formal client (patient_records), an accepted/pending connection request, or an
    // active chat thread. Mirrors the chat-action gates in /api/chat/* so a therapist
    // can assign work in the same conversation where they're already chatting.
    const [{ data: appt }, { data: record }, { data: conn }, { data: msg },] = await Promise.all([
        supabase
            .from('appointments')
            .select('id')
            .eq('therapist_id', userId)
            .eq('seeker_id', clientId)
            .neq('status', 'cancelled')
            .limit(1),
        supabase
            .from('patient_records')
            .select('seeker_id')
            .eq('seeker_id', clientId)
            .eq('primary_therapist_id', userId)
            .maybeSingle(),
        supabase
            .from('connection_requests')
            .select('id')
            .eq('therapist_id', userId)
            .eq('seeker_id', clientId)
            .neq('status', 'declined')
            .limit(1),
        supabase
            .from('messages')
            .select('id')
            .or(`and(sender_id.eq.${userId},recipient_id.eq.${clientId}),and(sender_id.eq.${clientId},recipient_id.eq.${userId})`)
            .limit(1),
    ]);
    const hasRelationship = (appt && appt.length > 0) ||
        !!record ||
        (conn && conn.length > 0) ||
        (msg && msg.length > 0);
    if (!hasRelationship) {
        return fail(403, 'No active therapist-client relationship found');
    }
    const insertPayload = {
        therapist_id: userId,
        seeker_id: clientId,
        title,
        description: description || null,
        status: 'pending',
        priority,
        source,
        source_context: sourceContext,
    };
    if (dueDate)
        insertPayload.due_date = dueDate;
    const { data: task, error } = await supabase
        .from('shared_tasks')
        .insert(insertPayload)
        .select('id, title, description, status, priority, due_date, source, assigned_at, completed_at, chat_message_id')
        .single();
    if (error || !task) {
        console.error('[api/tasks/add] insert error', error);
        return fail(500, 'Failed to assign task');
    }
    const messageContent = serializeRichMessage({
        type: 'task',
        version: 1,
        title,
        description: description || undefined,
        dueDate: dueDate || undefined,
        taskId: task.id,
        clientId,
        source: 'records',
    });
    const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert({
        sender_id: userId,
        recipient_id: clientId,
        content: messageContent,
        read_at: null,
    })
        .select('id')
        .single();
    if (messageError) {
        console.error('[api/tasks/add] message notification error', messageError);
    }
    else if (message?.id) {
        await supabase
            .from('shared_tasks')
            .update({ chat_message_id: message.id })
            .eq('id', task.id);
        task.chat_message_id = message.id;
    }
    return ok({ task, messageId: message?.id ?? null });
}
/**
 * Update a shared task's status. Either the owning therapist or the assigned
 * seeker may update; completion stamps completed_at.
 */
export async function updateTaskStatus(userId, taskId, status) {
    const supabase = await createClient();
    if (!taskId)
        return fail(400, 'taskId is required');
    if (!isCareTaskStatus(status)) {
        return fail(400, 'Invalid status');
    }
    const { data: me } = await supabase.from('user_roles').select('id, role').eq('id', userId).single();
    if (!me)
        return fail(401, 'Unauthorized');
    const { data: existingTask, error: readError } = await supabase
        .from('shared_tasks')
        .select('id, therapist_id, seeker_id, status')
        .eq('id', taskId)
        .single();
    if (readError || !existingTask) {
        return fail(404, 'Task not found');
    }
    const canUpdateAsTherapist = me.role === 'therapist' && existingTask.therapist_id === userId;
    const canUpdateAsSeeker = me.role === 'seeker' && existingTask.seeker_id === userId;
    if (!canUpdateAsTherapist && !canUpdateAsSeeker) {
        return fail(403, 'Forbidden');
    }
    const completedAt = status === 'completed' ? new Date().toISOString() : null;
    const { error: updateError } = await supabase
        .from('shared_tasks')
        .update({
        status,
        completed_at: completedAt,
    })
        .eq('id', taskId);
    if (updateError) {
        console.error('[api/tasks/update-status] update error', updateError);
        return fail(500, 'Failed to update task');
    }
    return ok(null);
}
