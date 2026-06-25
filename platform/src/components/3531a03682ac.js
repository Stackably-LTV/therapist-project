/**
 * Chat Service - Real-time messaging with Supabase Realtime
 * Handles message sending, conversation management, and real-time subscriptions
 */
import { createClient } from "@/components/e7335a071b71";
import { getMessagePreview } from "@/components/a6e7ef5e01c9";
export class ChatService {
    supabase = createClient();
    channels = new Map();
    /**
     * Send a message to a recipient
     */
    async sendMessage(recipientId, content) {
        try {
            // Route through the server API so we get full PostgrestError details,
            // email notifications, and any task-message side effects.
            const res = await fetch("/api/chat/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ recipientId, content: content.trim() }),
            });
            if (!res.ok) {
                let errMsg = `HTTP ${res.status}`;
                try {
                    const body = await res.json();
                    errMsg = body?.error || errMsg;
                }
                catch {
                    /* ignore json parse */
                }
                console.error("Send message error:", errMsg);
                return { success: false, error: errMsg };
            }
            const body = await res.json().catch(() => ({}));
            return { success: true, message: body?.message };
        }
        catch (error) {
            console.error("Chat service - send message error:", error);
            return { success: false, error: "Failed to send message" };
        }
    }
    /**
     * Get conversation history with a specific user
     */
    async getMessages(userId, limit = 50) {
        try {
            const { data: { user }, } = await this.supabase.auth.getUser();
            if (!user)
                return [];
            // messages.sender_id FKs to auth.users, not user_profiles, so the embedded
            // join syntax cannot be used here. Fetch profiles separately and stitch.
            const { data, error } = await this.supabase
                .from("messages")
                .select("id, sender_id, recipient_id, content, read_at, created_at")
                .or(`and(sender_id.eq.${user.id},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${user.id})`)
                .order("created_at", { ascending: false })
                .limit(limit);
            if (error) {
                console.error("Get messages error:", error.message || error);
                return [];
            }
            const rows = data || [];
            const senderIds = Array.from(new Set(rows.map((r) => r.sender_id)));
            const profilesById = new Map();
            if (senderIds.length) {
                const { data: profiles } = await this.supabase
                    .from("user_profiles")
                    .select("user_id, full_name, profile_image_url")
                    .in("user_id", senderIds);
                (profiles ?? []).forEach((p) => profilesById.set(p.user_id, {
                    full_name: p.full_name,
                    profile_image_url: p.profile_image_url,
                }));
            }
            return rows
                .map((r) => ({
                ...r,
                sender: profilesById.get(r.sender_id) ?? undefined,
            }))
                .reverse();
        }
        catch (error) {
            console.error("Chat service - get messages error:", error);
            return [];
        }
    }
    /**
     * Get list of conversations for current user
     */
    async getConversations() {
        try {
            const { data: { user }, } = await this.supabase.auth.getUser();
            if (!user)
                return [];
            // Get all unique conversation partners
            const { data: messages, error } = await this.supabase
                .from("messages")
                .select(`
          sender_id,
          recipient_id,
          content,
          created_at,
          read_at,
          sender:user_profiles!messages_sender_id_fkey(user_id, full_name),
          recipient:user_profiles!messages_recipient_id_fkey(user_id, full_name),
          sender_role:user_roles!messages_sender_id_fkey(role),
          recipient_role:user_roles!messages_recipient_id_fkey(role)
        `)
                .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
                .order("created_at", { ascending: false });
            if (error) {
                console.error("Get conversations error:", error);
                return [];
            }
            // Group messages by conversation partner
            const conversationMap = new Map();
            messages?.forEach((msg) => {
                const isCurrentUserSender = msg.sender_id === user.id;
                const partnerId = (isCurrentUserSender ? msg.recipient_id : msg.sender_id);
                const partner = (isCurrentUserSender ? msg.recipient : msg.sender);
                const partnerRole = (isCurrentUserSender ? msg.recipient_role : msg.sender_role);
                if (!conversationMap.has(partnerId)) {
                    conversationMap.set(partnerId, {
                        user_id: partnerId,
                        user_name: partner?.full_name || "Unknown",
                        user_role: partnerRole?.role || "seeker",
                        last_message: getMessagePreview(msg.content || ""),
                        last_message_at: msg.created_at,
                        unread_count: 0,
                    });
                }
                // Count unread messages (messages sent TO current user that haven't been read)
                if (!isCurrentUserSender && !msg.read_at) {
                    const conv = conversationMap.get(partnerId);
                    conv.unread_count++;
                }
            });
            return Array.from(conversationMap.values()).sort((a, b) => new Date(b.last_message_at).getTime() -
                new Date(a.last_message_at).getTime());
        }
        catch (error) {
            console.error("Chat service - get conversations error:", error);
            return [];
        }
    }
    /**
     * Mark messages from a specific user as read
     */
    async markAsRead(senderId) {
        try {
            const { data: { user }, } = await this.supabase.auth.getUser();
            if (!user)
                return;
            await this.supabase
                .from("messages")
                .update({ read_at: new Date().toISOString() })
                .eq("recipient_id", user.id)
                .eq("sender_id", senderId)
                .is("read_at", null);
        }
        catch (error) {
            console.error("Chat service - mark as read error:", error);
        }
    }
    /**
     * Subscribe to real-time message inserts for a direct message conversation.
     *
     * Uses broadcast-from-database (realtime.broadcast_changes) and private channels.
     */
    async subscribeToConversation(otherUserId, onMessage) {
        const { data: { user }, } = await this.supabase.auth.getUser();
        if (!user)
            return null;
        const topic = `dm:${[user.id, otherUserId].sort().join(":")}`;
        if (this.channels.has(topic)) {
            this.channels.get(topic)?.unsubscribe();
        }
        const { data: { session }, } = await this.supabase.auth.getSession();
        if (!session?.access_token)
            return null;
        await this.supabase.realtime.setAuth(session.access_token);
        const channel = this.supabase.channel(topic, {
            config: { private: true, broadcast: { self: true } },
        });
        channel
            .on("broadcast", { event: "INSERT" }, (evt) => {
            const raw = evt;
            const payload = raw?.payload;
            if (!payload)
                return;
            const record = (payload.record ?? payload.new ?? payload);
            const id = record?.id;
            const sender_id = record?.sender_id;
            const recipient_id = record?.recipient_id;
            if (!id || !sender_id || !recipient_id)
                return;
            onMessage({
                id,
                sender_id,
                recipient_id,
                content: record?.content ?? "",
                read_at: record?.read_at ?? null,
                created_at: record?.created_at ?? new Date().toISOString(),
            });
        })
            .subscribe();
        this.channels.set(topic, channel);
        return channel;
    }
    /**
     * Unsubscribe from a conversation channel
     */
    unsubscribe(userId) {
        const channel = this.channels.get(userId);
        if (channel) {
            channel.unsubscribe();
            this.channels.delete(userId);
        }
    }
    /**
     * Unsubscribe from all channels
     */
    unsubscribeAll() {
        this.channels.forEach((channel) => channel.unsubscribe());
        this.channels.clear();
    }
    /**
     * Get unread message count
     */
    async getUnreadCount() {
        try {
            const { data: { user }, } = await this.supabase.auth.getUser();
            if (!user)
                return 0;
            const { count, error } = await this.supabase
                .from("messages")
                .select("*", { count: "exact", head: true })
                .eq("recipient_id", user.id)
                .is("read_at", null);
            if (error) {
                console.error("Get unread count error:", error);
                return 0;
            }
            return count || 0;
        }
        catch (error) {
            console.error("Chat service - get unread count error:", error);
            return 0;
        }
    }
}
export const chatService = new ChatService();
