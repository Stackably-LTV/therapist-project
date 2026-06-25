/**
 * Realtime Hooks - Supabase Realtime subscriptions
 * Provides real-time message updates and presence information
 */
'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { chatService } from '@/components/3531a03682ac';
import { createClient } from '@/components/e7335a071b71';
import { useChatStore, getGroupKey, } from '@/components/2da802565614';
const EMPTY_MESSAGES = [];
const EMPTY_GROUP_MESSAGES = [];
/**
 * Keeps the Realtime socket updated with the latest Auth JWT.
 *
 * Without this, Realtime may evaluate RLS with `auth.uid()` as NULL, which
 * causes private channel joins like `dm:<uuid>:<uuid>` to be rejected.
 */
export function useRealtimeAuthSync() {
    useEffect(() => {
        const supabase = createClient();
        const sync = async (accessToken) => {
            if (!accessToken)
                return;
            await supabase.realtime.setAuth(accessToken);
        };
        void (async () => {
            const { data: { session }, } = await supabase.auth.getSession();
            await sync(session?.access_token);
        })();
        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
            void sync(session?.access_token);
        });
        return () => {
            data.subscription.unsubscribe();
        };
    }, []);
}
function getDmTopic(a, b) {
    return `dm:${[a, b].sort().join(':')}`;
}
function getBroadcastRecord(evt) {
    const raw = evt;
    const payload = raw?.payload;
    if (!payload)
        return null;
    const record = payload.record;
    const newRecord = payload.new;
    const candidate = record ?? newRecord ?? payload;
    const id = candidate?.id;
    const sender_id = candidate?.sender_id;
    const recipient_id = candidate?.recipient_id;
    const content = candidate?.content;
    const read_at = candidate?.read_at ?? null;
    const created_at = candidate?.created_at ?? new Date().toISOString();
    if (!id || !sender_id || !recipient_id)
        return null;
    return {
        id,
        sender_id,
        recipient_id,
        content: content ?? '',
        read_at,
        created_at,
    };
}
function getPostgresMessageRecord(evt) {
    const payload = evt;
    const row = payload?.new;
    if (!row?.id || !row.sender_id || !row.recipient_id)
        return null;
    return {
        id: row.id,
        sender_id: row.sender_id,
        recipient_id: row.recipient_id,
        content: row.content ?? '',
        read_at: row.read_at ?? null,
        created_at: row.created_at ?? new Date().toISOString(),
    };
}
/**
 * Hook for real-time messages in a conversation. Uses Zustand so messages
 * stream instantly across the app; any component reading the same conversation
 * sees updates in realtime.
 */
export function useRealtimeMessages(currentUserId, userId) {
    useRealtimeAuthSync();
    const conversationKey = currentUserId && userId ? useChatStore.getState().getDmKey(currentUserId, userId) : null;
    const messages = useChatStore((s) => conversationKey ? (s.messagesByConversation[conversationKey] ?? EMPTY_MESSAGES) : EMPTY_MESSAGES);
    const loading = useChatStore((s) => conversationKey ? (s.loadingByConversation[conversationKey] ?? true) : false);
    const [error, setError] = useState(null);
    const addMessage = useChatStore((s) => s.addMessage);
    const setMessages = useChatStore((s) => s.setMessages);
    const setLoading = useChatStore((s) => s.setLoading);
    useEffect(() => {
        if (!userId || !currentUserId)
            return;
        const key = useChatStore.getState().getDmKey(currentUserId, userId);
        let mounted = true;
        async function loadMessages() {
            try {
                setLoading(key, true);
                const msgs = await chatService.getMessages(userId);
                if (!mounted)
                    return;
                const existing = useChatStore.getState().messagesByConversation[key] ?? [];
                const byId = new Map();
                for (const m of msgs)
                    byId.set(m.id, m);
                for (const m of existing) {
                    if (!byId.has(m.id))
                        byId.set(m.id, m);
                }
                const merged = Array.from(byId.values()).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                setMessages(key, merged);
                setError(null);
            }
            catch (err) {
                if (mounted) {
                    setError('Failed to load messages');
                    console.error('Load messages error:', err);
                }
            }
            finally {
                if (mounted)
                    setLoading(key, false);
            }
        }
        loadMessages();
        return () => {
            mounted = false;
        };
    }, [userId, currentUserId, setMessages, setLoading]);
    useEffect(() => {
        if (!userId || !currentUserId)
            return;
        const supabase = createClient();
        const key = useChatStore.getState().getDmKey(currentUserId, userId);
        const topic = getDmTopic(currentUserId, userId);
        let dmChannel = null;
        let pgChannel = null;
        let mounted = true;
        let switchedToFallback = false;
        const onMessage = (newMessage) => {
            if (!mounted)
                return;
            const isInConversation = (newMessage.sender_id === currentUserId && newMessage.recipient_id === userId) ||
                (newMessage.sender_id === userId && newMessage.recipient_id === currentUserId);
            if (!isInConversation)
                return;
            addMessage(key, newMessage);
            if (newMessage.recipient_id === currentUserId && newMessage.sender_id === userId) {
                void chatService.markAsRead(newMessage.sender_id);
            }
        };
        async function setupPostgresFallback() {
            if (!mounted || pgChannel)
                return;
            pgChannel = supabase.channel(`dm-pg:${currentUserId}:${userId}`);
            pgChannel
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `sender_id=eq.${currentUserId}` }, (evt) => {
                const msg = getPostgresMessageRecord(evt);
                if (!msg)
                    return;
                onMessage(msg);
            })
                .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `recipient_id=eq.${currentUserId}`,
            }, (evt) => {
                const msg = getPostgresMessageRecord(evt);
                if (!msg)
                    return;
                onMessage(msg);
            })
                .subscribe((status) => {
                if (status === 'SUBSCRIBED')
                    setError(null);
                if (status === 'CHANNEL_ERROR') {
                    setError('Realtime connection issue. Please refresh if live messages stop.');
                }
            });
        }
        async function setupRealtime() {
            const { data: { user }, } = await supabase.auth.getUser();
            if (!user || user.id !== currentUserId)
                return;
            const { data: { session }, } = await supabase.auth.getSession();
            if (!session?.access_token) {
                await setupPostgresFallback();
                return;
            }
            await supabase.realtime.setAuth(session.access_token);
            dmChannel = supabase.channel(topic, {
                config: {
                    private: true,
                    broadcast: { self: true },
                },
            });
            dmChannel
                .on('broadcast', { event: 'INSERT' }, (evt) => {
                const newMessage = getBroadcastRecord(evt);
                if (!newMessage)
                    return;
                onMessage(newMessage);
            })
                .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    setError(null);
                    return;
                }
                if ((status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') && !switchedToFallback) {
                    switchedToFallback = true;
                    if (dmChannel) {
                        void supabase.removeChannel(dmChannel);
                        dmChannel = null;
                    }
                    void setupPostgresFallback();
                }
            });
        }
        void setupRealtime();
        return () => {
            mounted = false;
            if (dmChannel)
                supabase.removeChannel(dmChannel);
            if (pgChannel)
                supabase.removeChannel(pgChannel);
        };
    }, [userId, currentUserId, addMessage]);
    const sendMessage = useCallback(async (content) => {
        if (!userId || !currentUserId || !content.trim())
            return false;
        const result = await chatService.sendMessage(userId, content);
        if (result.success && result.message) {
            const key = useChatStore.getState().getDmKey(currentUserId, userId);
            useChatStore.getState().addMessage(key, result.message);
        }
        return result.success ?? false;
    }, [userId, currentUserId]);
    return {
        messages,
        loading,
        error,
        sendMessage,
    };
}
/**
 * Hook for per-user inbox updates (sidebar previews/unread counters).
 * Uses realtime.send in a DB trigger to publish message_created events.
 */
export function useRealtimeInbox(currentUserId) {
    const [lastEvent, setLastEvent] = useState(null);
    useEffect(() => {
        if (!currentUserId)
            return;
        const supabase = createClient();
        let channel = null;
        let mounted = true;
        async function setup() {
            const { data: { user }, } = await supabase.auth.getUser();
            if (!user || user.id !== currentUserId)
                return;
            const { data: { session }, } = await supabase.auth.getSession();
            if (!session?.access_token)
                return;
            await supabase.realtime.setAuth(session.access_token);
            channel = supabase.channel(`inbox:${currentUserId}`, {
                config: {
                    private: true,
                    broadcast: { self: true },
                },
            });
            channel
                .on('broadcast', { event: 'message_created' }, (evt) => {
                const raw = evt;
                const msg = (raw.payload || raw);
                if (!mounted)
                    return;
                if (!msg.id || !msg.sender_id || !msg.recipient_id)
                    return;
                setLastEvent(msg);
            })
                .subscribe();
        }
        setup();
        return () => {
            mounted = false;
            if (channel)
                supabase.removeChannel(channel);
        };
    }, [currentUserId]);
    return { lastEvent };
}
/**
 * Hook for consultation request Realtime: therapist sees new requests,
 * both see accept/decline instantly. Updates Zustand on events.
 *
 * @param onUpdate - Optional callback invoked when a consultation_request_updated
 *   event arrives. Receives the raw payload so callers can show toasts etc.
 *   without opening a second subscription.
 */
export function useRealtimeConsultationRequests(currentUserId, role, onUpdate) {
    // Keep a stable ref so the effect doesn't re-run when the callback changes.
    const onUpdateRef = useRef(onUpdate);
    useEffect(() => {
        onUpdateRef.current = onUpdate;
    }, [onUpdate]);
    useEffect(() => {
        if (!currentUserId)
            return;
        const supabase = createClient();
        const topic = `${role}:${currentUserId}`;
        let channel = null;
        let mounted = true;
        async function setup() {
            const { data: { user }, } = await supabase.auth.getUser();
            if (!user || user.id !== currentUserId)
                return;
            const { data: { session }, } = await supabase.auth.getSession();
            if (!session?.access_token)
                return;
            await supabase.realtime.setAuth(session.access_token);
            channel = supabase.channel(topic, {
                config: {
                    private: true,
                    broadcast: { self: true },
                },
            });
            const apply = (payload) => {
                if (!mounted)
                    return;
                const p = payload;
                if (!p?.id || !p?.status)
                    return;
                useChatStore.getState().applyConsultationRequestFromRealtime(p);
                onUpdateRef.current?.(p);
            };
            const onCreated = (payload) => {
                apply(payload);
                const p = payload;
                if (!mounted || role !== 'therapist' || !p?.seeker_id || currentUserId !== p.therapist_id)
                    return;
                void (async () => {
                    const [{ data: seekerRole }, { data: seekerProfile }] = await Promise.all([
                        supabase.from('user_roles').select('id, role').eq('id', p.seeker_id).single(),
                        supabase.from('user_profiles').select('user_id, full_name, profile_image_url').eq('user_id', p.seeker_id).single(),
                    ]);
                    if (!mounted || !seekerRole || useChatStore.getState().conversations.some((c) => c.id === seekerRole.id))
                        return;
                    const profileJson = seekerProfile?.profile_image_url
                        ? { profile_image_url: seekerProfile.profile_image_url }
                        : undefined;
                    useChatStore.getState().addConversation({
                        id: seekerRole.id,
                        name: seekerProfile?.full_name ?? '',
                        role: seekerRole.role ?? 'seeker',
                        profile_json: profileJson,
                        last_message: 'Consultation request',
                        last_message_at: p.created_at ?? new Date().toISOString(),
                        unread_count: 1,
                    });
                    const url = seekerProfile?.profile_image_url ?? undefined;
                    if (url)
                        useChatStore.getState().setAvatarForUser(seekerRole.id, url);
                })();
            };
            channel
                .on('broadcast', { event: 'consultation_request_created' }, (evt) => {
                const raw = evt;
                onCreated(raw.payload ?? raw);
            })
                .on('broadcast', { event: 'consultation_request_updated' }, (evt) => {
                const raw = evt;
                apply(raw.payload ?? raw);
            })
                .subscribe();
        }
        setup();
        return () => {
            mounted = false;
            if (channel)
                supabase.removeChannel(channel);
        };
    }, [currentUserId, role]);
}
/**
 * Hook for user presence (online/offline status)
 * Uses Supabase Auth last_sign_in_at for accurate tracking
 */
export function usePresence(userId) {
    const [isOnline, setIsOnline] = useState(false);
    const [lastSeen, setLastSeen] = useState(null);
    useEffect(() => {
        if (!userId) {
            return;
        }
        // Presence column (last_seen_at) was removed during the schema migration.
        // Treat all users as offline-with-unknown-last-seen until presence is reintroduced.
        setIsOnline(false);
        setLastSeen(null);
        return;
    }, [userId]);
    return {
        isOnline,
        lastSeen,
    };
}
/**
 * Hook for unread message count
 */
export function useUnreadCount() {
    const [count, setCount] = useState(0);
    useEffect(() => {
        async function fetchCount() {
            const unreadCount = await chatService.getUnreadCount();
            setCount(unreadCount);
        }
        fetchCount();
        // Poll every 30 seconds for updates
        const interval = setInterval(fetchCount, 30000);
        return () => clearInterval(interval);
    }, []);
    return count;
}
/**
 * Hook to update current user's last_seen_at timestamp
 * Call this on pages where you want to track user activity
 */
export function useUpdateLastSeen() {
    useEffect(() => {
        // last_seen_at column was removed during the schema migration; this hook is a
        // no-op until presence tracking is reintroduced via a different mechanism.
        const updateLastSeen = async () => { };
        // Update on visibility change (tab focus)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                updateLastSeen();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);
}
function getGroupTopic(groupId) {
    return `group:${groupId}`;
}
function getGroupBroadcastRecord(evt) {
    // Handle postgres_changes payload structure
    const p = evt;
    const candidate = p?.new ??
        p?.payload?.record ??
        p?.payload?.new ??
        p?.payload?.payload?.record ??
        p?.payload?.payload?.new;
    const raw = candidate;
    const id = raw?.id;
    const groupId = (raw?.group_id ?? raw?.groupId);
    const senderId = (raw?.sender_id ?? raw?.senderId);
    const content = raw?.content;
    const createdAt = (raw?.created_at ?? raw?.createdAt);
    if (!id || !groupId || !senderId || !content)
        return null;
    return {
        id,
        groupId,
        senderId,
        content,
        createdAt: createdAt || new Date().toISOString(),
    };
}
function getGroupPgRecord(evt) {
    const payload = evt;
    const row = payload?.new;
    if (!row?.id || !row.group_id || !row.sender_id || !row.content)
        return null;
    return {
        id: row.id,
        groupId: row.group_id,
        senderId: row.sender_id,
        content: row.content,
        createdAt: row.created_at ?? new Date().toISOString(),
    };
}
/**
 * Hook for realtime group chat messages in a community group. Uses the same
 * Zustand store as DMs so messages stream instantly across the app.
 */
export function useRealtimeGroupChat(groupId) {
    useRealtimeAuthSync();
    const groupKey = groupId ? getGroupKey(groupId) : null;
    const messages = useChatStore((s) => groupKey ? (s.messagesByGroup[groupKey] ?? EMPTY_GROUP_MESSAGES) : EMPTY_GROUP_MESSAGES);
    const loading = useChatStore((s) => groupKey ? (s.loadingByGroup[groupKey] ?? true) : false);
    const [error, setError] = useState(null);
    const addGroupMessage = useChatStore((s) => s.addGroupMessage);
    const setGroupMessages = useChatStore((s) => s.setGroupMessages);
    const setGroupLoading = useChatStore((s) => s.setGroupLoading);
    useEffect(() => {
        if (!groupId)
            return;
        const key = getGroupKey(groupId);
        let mounted = true;
        async function load() {
            try {
                setGroupLoading(key, true);
                const res = await fetch(`/api/community/groups/${groupId}/messages?limit=200`);
                const data = await res.json();
                if (!res.ok)
                    throw new Error(data?.error || 'Failed to load messages');
                const rows = (data?.messages || []);
                if (mounted) {
                    setGroupMessages(key, rows);
                    setError(null);
                }
            }
            catch (err) {
                console.error('[useRealtimeGroupChat] load error', err);
                if (mounted)
                    setError('Failed to load messages');
            }
            finally {
                if (mounted)
                    setGroupLoading(key, false);
            }
        }
        load();
        return () => {
            mounted = false;
        };
    }, [groupId, setGroupMessages, setGroupLoading]);
    useEffect(() => {
        if (!groupId)
            return;
        const supabase = createClient();
        const key = getGroupKey(groupId);
        const topic = getGroupTopic(groupId);
        let channel = null;
        let mounted = true;
        async function setup() {
            const { data: { user }, } = await supabase.auth.getUser();
            if (!user)
                return;
            const { data: { session }, } = await supabase.auth.getSession();
            if (!session?.access_token)
                return;
            await supabase.realtime.setAuth(session.access_token);
            const { data: membership } = await supabase
                .from('community_group_members')
                .select('id')
                .eq('group_id', groupId)
                .eq('user_id', user.id)
                .eq('status', 'active')
                .maybeSingle();
            if (!membership)
                return;
            channel = supabase
                .channel(topic, {
                config: { private: true, broadcast: { self: true } },
            })
                .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'community_group_messages',
                filter: `group_id=eq.${groupId}`,
            }, (payload) => {
                const msg = getGroupPgRecord(payload);
                if (!msg || msg.groupId !== groupId || !mounted)
                    return;
                addGroupMessage(key, msg);
            })
                .on('broadcast', { event: 'INSERT' }, (payload) => {
                const msg = getGroupBroadcastRecord(payload);
                if (!msg || msg.groupId !== groupId || !mounted)
                    return;
                addGroupMessage(key, msg);
            })
                .on('broadcast', { event: 'message_created' }, (payload) => {
                const msg = getGroupBroadcastRecord(payload);
                if (!msg || msg.groupId !== groupId || !mounted)
                    return;
                addGroupMessage(key, msg);
            })
                .subscribe((status, err) => {
                if (status !== 'CHANNEL_ERROR')
                    return;
                const message = String(err?.message || '');
                if (message.toLowerCase().includes('unauthorized'))
                    return;
                console.warn('[useRealtimeGroupChat] channel error', { topic, err });
            });
        }
        setup();
        return () => {
            mounted = false;
            if (channel)
                supabase.removeChannel(channel);
        };
    }, [groupId, addGroupMessage]);
    const sendMessage = useCallback(async (content) => {
        if (!groupId || !content.trim())
            return false;
        const res = await fetch(`/api/community/groups/${groupId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: content.trim() }),
        });
        const data = await res.json();
        if (!res.ok)
            throw new Error(data?.error || 'Failed to send message');
        const created = data?.message;
        if (created?.id) {
            useChatStore.getState().addGroupMessage(getGroupKey(groupId), {
                id: created.id,
                groupId,
                senderId: created.senderId ?? '',
                content: created.content ?? content.trim(),
                createdAt: created.createdAt ?? new Date().toISOString(),
            });
        }
        return true;
    }, [groupId]);
    return { messages, loading, error, sendMessage };
}
