import 'server-only';
import { createClient, createServiceRoleClient } from '@/components/9a6b39502e62';
import { requireFeature } from '@/components/3168fa71d1e4';
import { emailService } from '@/components/b2a0b00fb250';
import { render } from '@react-email/render';
import MessageNotificationEmail from '@/components/c9deb8d8f726';
import { getMessagePreview, parseMessageContent, serializeRichMessage, } from '@/components/a6e7ef5e01c9';
import { ok, fail } from '@/components/7ff049787825';
/** Mark all unread messages from a sender to the current user as read. */
export async function markMessagesRead(userId, senderId) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('recipient_id', userId)
        .eq('sender_id', senderId)
        .is('read_at', null);
    if (error) {
        console.error('Mark as read error:', error);
        return fail(500, 'Failed to mark as read');
    }
    return ok({ success: true });
}
/** Fetch the most recent 50 messages exchanged between the user and a partner, oldest-first. */
export async function getConversationMessages(userId, partnerId) {
    const supabase = await createClient();
    const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${userId},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${userId})`)
        .order('created_at', { ascending: false })
        .limit(50);
    if (error) {
        console.error('Get messages error:', error);
        return ok({ messages: [] });
    }
    return ok({ messages: (messages || []).reverse() });
}
/** List conversation summaries (latest message + unread count) for the current user. */
export async function getConversations(userId) {
    const supabase = await createClient();
    const { data: messages, error } = await supabase
        .from('messages')
        .select('sender_id, recipient_id, content, created_at, read_at')
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order('created_at', { ascending: false });
    if (error) {
        console.error('Get conversations error:', error);
        return ok({ conversations: [] });
    }
    // Collect all partner ids
    const partnerIds = new Set();
    (messages || []).forEach((m) => {
        const isMine = m.sender_id === userId;
        partnerIds.add(isMine ? m.recipient_id : m.sender_id);
    });
    // Fetch profiles + roles for partners in one go
    const ids = Array.from(partnerIds);
    const [{ data: profiles }, { data: roles }] = await Promise.all([
        ids.length
            ? supabase.from('user_profiles').select('user_id, full_name').in('user_id', ids)
            : Promise.resolve({ data: [] }),
        ids.length
            ? supabase.from('user_roles').select('id, role').in('id', ids)
            : Promise.resolve({ data: [] }),
    ]);
    const nameById = new Map((profiles || []).map((p) => [p.user_id, p.full_name]));
    const roleById = new Map((roles || []).map((r) => [r.id, r.role]));
    const map = new Map();
    (messages || []).forEach((m) => {
        const isMine = m.sender_id === userId;
        const partnerId = isMine ? m.recipient_id : m.sender_id;
        if (!map.has(partnerId)) {
            map.set(partnerId, {
                user_id: partnerId,
                user_name: nameById.get(partnerId) || 'Unknown',
                user_role: roleById.get(partnerId) || 'seeker',
                last_message: getMessagePreview(m.content || ''),
                last_message_at: m.created_at,
                unread_count: 0,
            });
        }
        if (!isMine && !m.read_at) {
            map.get(partnerId).unread_count++;
        }
    });
    const conversations = Array.from(map.values()).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
    return ok({ conversations });
}
/**
 * Send a direct message. Therapists are paywalled on `direct_messaging`; seekers
 * are never gated. Handles task-message side effects and best-effort email
 * notification. Returns the inserted message (with final, possibly task-patched content).
 */
export async function sendMessage(userId, recipientId, rawContent) {
    const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Psychlink.pro';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const supabase = await createClient();
    const content = String(rawContent || '');
    if (!recipientId || !content) {
        return fail(400, 'Recipient ID and content are required');
    }
    if (content.trim().length === 0) {
        return fail(400, 'Message content cannot be empty');
    }
    const { data: senderRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();
    const { data: senderProfile } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('user_id', userId)
        .maybeSingle();
    // Secure messaging is a paid therapist feature (Tier 2+). Seekers are never
    // gated — they can always reach out to a therapist.
    if (senderRole?.role === 'therapist') {
        const gate = await requireFeature(userId, 'direct_messaging');
        if (!gate.ok)
            return fail(gate.status, gate.error);
    }
    const { data: recipientRole } = await supabase
        .from('user_roles')
        .select('id, role')
        .eq('id', recipientId)
        .maybeSingle();
    const parsedContent = parseMessageContent(content);
    const isTaskMessage = parsedContent.type === 'task' &&
        !parsedContent.taskId &&
        senderRole?.role === 'therapist' &&
        recipientRole?.role === 'seeker';
    // Send message first — task record is only created if message succeeds.
    const { data: insertedMessage, error: insertError } = await supabase
        .from('messages')
        .insert({
        sender_id: userId,
        recipient_id: recipientId,
        content: content.trim(),
        read_at: null,
    })
        .select('id, sender_id, recipient_id, content, read_at, created_at')
        .single();
    if (insertError) {
        console.error('Send message error:', insertError);
        return {
            ok: false,
            status: 500,
            error: insertError.message || 'Failed to send message',
            code: insertError.code,
            details: insertError.details,
            hint: insertError.hint,
        };
    }
    // Now that the message is saved, create the task record and update the message content
    // with the real task ID so the seeker's chat card links to the right task.
    let finalContent = content;
    if (isTaskMessage) {
        const insertPayload = {
            therapist_id: userId,
            seeker_id: recipientId,
            title: parsedContent.title,
            description: parsedContent.description || null,
            status: 'pending',
            source: 'chat',
            source_context: { origin: 'chat_send_api' },
        };
        if (parsedContent.dueDate)
            insertPayload.due_date = parsedContent.dueDate;
        const { data: task, error: taskError } = await supabase
            .from('shared_tasks')
            .insert(insertPayload)
            .select('id')
            .single();
        if (taskError) {
            console.error('[chat/send] Failed to create shared task:', taskError.message);
        }
        else if (task?.id) {
            finalContent = serializeRichMessage({
                ...parsedContent,
                taskId: task.id,
                clientId: recipientId,
                source: 'chat',
            });
            // Patch the message content with the real task ID
            await supabase
                .from('messages')
                .update({ content: finalContent.trim() })
                .eq('sender_id', userId)
                .eq('recipient_id', recipientId)
                .eq('content', content.trim())
                .order('created_at', { ascending: false })
                .limit(1);
        }
    }
    // Email notification (best-effort, rate-limited)
    try {
        const { data: recipientProfile } = await supabase
            .from('user_profiles')
            .select('full_name')
            .eq('user_id', recipientId)
            .maybeSingle();
        // recipient email lives in auth.users; service role client needed
        const admin = createServiceRoleClient();
        const { data: authData } = await admin.auth.admin.getUserById(recipientId);
        const recipientEmail = authData?.user?.email;
        if (recipientProfile && recipientEmail) {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
            const { data: recentMessages } = await supabase
                .from('messages')
                .select('id, created_at')
                .eq('sender_id', userId)
                .eq('recipient_id', recipientId)
                .gte('created_at', fiveMinutesAgo)
                .order('created_at', { ascending: false })
                .limit(2);
            const shouldSendEmail = !recentMessages || recentMessages.length === 0;
            if (shouldSendEmail) {
                const previewText = getMessagePreview(content);
                const role = recipientRole?.role;
                const profilePath = role === 'therapist'
                    ? '/therapist/profile'
                    : role === 'seeker'
                        ? '/seeker/profile'
                        : role === 'admin'
                            ? '/admin'
                            : '/login?mode=signup&';
                const emailHtml = await render(MessageNotificationEmail({
                    recipientName: recipientProfile.full_name,
                    senderName: senderProfile?.full_name || 'Someone',
                    messagePreview: previewText.length > 100 ? previewText.substring(0, 100) + '...' : previewText,
                    chatUrl: `${appUrl}/chat?with=${userId}`,
                    settingsUrl: `${appUrl}${profilePath}`,
                    appName,
                }));
                await emailService.sendEmail({
                    to: recipientEmail,
                    subject: `New message from ${senderProfile?.full_name || 'Someone'}`,
                    html: emailHtml,
                });
            }
        }
    }
    catch (emailError) {
        console.error('Failed to send message notification email:', emailError);
    }
    return ok({
        success: true,
        message: insertedMessage
            ? { ...insertedMessage, content: finalContent.trim() }
            : null,
    });
}
