import { create } from 'zustand';
function dmKey(a, b) {
    return `dm:${[a, b].sort().join(':')}`;
}
export function getDmKey(a, b) {
    return dmKey(a, b);
}
export function getGroupKey(groupId) {
    return `group:${groupId}`;
}
export const useChatStore = create((set) => ({
    messagesByConversation: {},
    loadingByConversation: {},
    messagesByGroup: {},
    loadingByGroup: {},
    currentUserAvatarUrl: null,
    avatarUrlByUserId: {},
    consultationRequestByRequestId: {},
    consultationLockedByKey: {},
    conversations: [],
    selectedUserId: null,
    currentUserIdForConversations: null,
    addMessage(key, message) {
        set((state) => {
            const list = state.messagesByConversation[key] ?? [];
            if (list.some((m) => m.id === message.id))
                return state;
            return {
                messagesByConversation: {
                    ...state.messagesByConversation,
                    [key]: [...list, message],
                },
            };
        });
    },
    setMessages(key, messages) {
        set((state) => ({
            messagesByConversation: {
                ...state.messagesByConversation,
                [key]: messages,
            },
        }));
    },
    setLoading(key, loading) {
        set((state) => ({
            loadingByConversation: {
                ...state.loadingByConversation,
                [key]: loading,
            },
        }));
    },
    getDmKey: (currentUserId, otherUserId) => dmKey(currentUserId, otherUserId),
    addGroupMessage(key, message) {
        set((state) => {
            const list = state.messagesByGroup[key] ?? [];
            if (list.some((m) => m.id === message.id))
                return state;
            return {
                messagesByGroup: {
                    ...state.messagesByGroup,
                    [key]: [...list, message],
                },
            };
        });
    },
    setGroupMessages(key, messages) {
        set((state) => ({
            messagesByGroup: {
                ...state.messagesByGroup,
                [key]: messages,
            },
        }));
    },
    setGroupLoading(key, loading) {
        set((state) => ({
            loadingByGroup: {
                ...state.loadingByGroup,
                [key]: loading,
            },
        }));
    },
    setCurrentUserAvatar(url) {
        set({ currentUserAvatarUrl: url });
    },
    setAvatarForUser(userId, url) {
        set((state) => ({
            avatarUrlByUserId: {
                ...state.avatarUrlByUserId,
                [userId]: url,
            },
        }));
    },
    hydrateChatAvatars({ currentUserAvatarUrl, conversations }) {
        set((state) => {
            const avatarUrlByUserId = { ...state.avatarUrlByUserId };
            for (const c of conversations) {
                const url = c.profile_json?.profile_image_url;
                avatarUrlByUserId[c.id] = url ?? null;
            }
            return {
                currentUserAvatarUrl,
                avatarUrlByUserId,
            };
        });
    },
    setConsultationRequest(requestId, data) {
        set((state) => {
            const next = { ...state.consultationRequestByRequestId };
            if (data)
                next[requestId] = data;
            else
                delete next[requestId];
            return { consultationRequestByRequestId: next };
        });
    },
    setConsultationLocked(conversationKey, locked) {
        set((state) => ({
            consultationLockedByKey: {
                ...state.consultationLockedByKey,
                [conversationKey]: locked,
            },
        }));
    },
    applyConsultationRequestFromRealtime(payload) {
        set((state) => {
            // Preserve initiated_by from the prior store entry if the broadcast payload didn't
            // include it (older trigger versions only sent id/status/seeker_id/therapist_id).
            const prior = state.consultationRequestByRequestId[payload.id];
            const initiated = payload.initiated_by ??
                prior?.initiated_by ??
                null;
            const request = {
                id: payload.id,
                status: payload.status,
                initial_message: payload.initial_message ?? null,
                created_at: payload.created_at ?? null,
                seeker_id: payload.seeker_id ?? null,
                therapist_id: payload.therapist_id ?? null,
                initiated_by: initiated,
            };
            const nextRequests = { ...state.consultationRequestByRequestId, [payload.id]: request };
            return { consultationRequestByRequestId: nextRequests };
        });
    },
    hydrateConsultation(request, conversationKey, locked) {
        set((state) => {
            const nextRequests = request
                ? { ...state.consultationRequestByRequestId, [request.id]: request }
                : state.consultationRequestByRequestId;
            const nextLocked = conversationKey
                ? { ...state.consultationLockedByKey, [conversationKey]: locked }
                : state.consultationLockedByKey;
            return {
                consultationRequestByRequestId: nextRequests,
                consultationLockedByKey: nextLocked,
            };
        });
    },
    hydrateConversations(conversations, currentUserId) {
        set({
            conversations,
            currentUserIdForConversations: currentUserId,
        });
    },
    setSelectedUserId(id) {
        set({ selectedUserId: id });
    },
    updateConversationFromInbox({ partnerId, content, created_at, isUnread, selectedUserId }) {
        set((state) => {
            const prev = state.conversations;
            const existing = prev.find((c) => c.id === partnerId);
            if (existing) {
                const next = prev.map((c) => {
                    if (c.id !== partnerId)
                        return c;
                    return {
                        ...c,
                        last_message: content,
                        last_message_at: created_at,
                        unread_count: isUnread ? c.unread_count + 1 : c.unread_count,
                    };
                });
                return {
                    conversations: next.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()),
                };
            }
            return state;
        });
    },
    addConversation(conv) {
        set((state) => {
            if (state.conversations.some((c) => c.id === conv.id))
                return state;
            return {
                conversations: [
                    conv,
                    ...state.conversations,
                ].sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()),
            };
        });
    },
    clearUnreadForConversation(userId) {
        set((state) => ({
            conversations: state.conversations.map((c) => c.id === userId ? { ...c, unread_count: 0 } : c),
        }));
    },
}));
