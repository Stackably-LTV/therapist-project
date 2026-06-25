import { create } from 'zustand';
export const useCommunityStore = create((set, get) => ({
    myGroups: [],
    discoverPopular: [],
    discoverSuggestions: [],
    loadingMyGroups: false,
    loadingDiscover: false,
    communityError: null,
    feedByGroupId: {},
    async loadMyGroups() {
        set({ loadingMyGroups: true, communityError: null });
        try {
            const res = await fetch('/api/community/groups', { cache: 'no-store' });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data?.error || 'Failed to load your groups');
            set({ myGroups: (data?.groups || []) });
        }
        catch (e) {
            const message = e instanceof Error ? e.message : 'Failed to load your groups';
            set({ communityError: message });
        }
        finally {
            set({ loadingMyGroups: false });
        }
    },
    async loadDiscover(q) {
        set({ loadingDiscover: true, communityError: null });
        try {
            const u = new URL('/api/community/groups/discover', window.location.origin);
            if (q.trim())
                u.searchParams.set('q', q.trim());
            u.searchParams.set('popularLimit', '12');
            u.searchParams.set('suggestionsLimit', '40');
            const res = await fetch(u.toString(), { cache: 'no-store' });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data?.error || 'Failed to load groups');
            set({
                discoverPopular: (data?.popular ?? []),
                discoverSuggestions: (data?.suggestions ?? []),
            });
        }
        catch (e) {
            const message = e instanceof Error ? e.message : 'Failed to load groups';
            set({ communityError: message });
        }
        finally {
            set({ loadingDiscover: false });
        }
    },
    ensureFeed(groupId) {
        set((state) => {
            if (state.feedByGroupId[groupId])
                return state;
            return {
                feedByGroupId: {
                    ...state.feedByGroupId,
                    [groupId]: { posts: [], loading: false, error: null, loadedAt: null },
                },
            };
        });
    },
    async loadGroupFeed(groupId) {
        get().ensureFeed(groupId);
        set((state) => ({
            feedByGroupId: {
                ...state.feedByGroupId,
                [groupId]: { ...state.feedByGroupId[groupId], loading: true, error: null },
            },
        }));
        try {
            const res = await fetch(`/api/community/groups/${groupId}/posts`, { cache: 'no-store' });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data?.error || 'Failed to load posts');
            const posts = (data?.posts || []);
            set((state) => ({
                feedByGroupId: {
                    ...state.feedByGroupId,
                    [groupId]: { posts, loading: false, error: null, loadedAt: Date.now() },
                },
            }));
        }
        catch (e) {
            const message = e instanceof Error ? e.message : 'Failed to load posts';
            set((state) => ({
                feedByGroupId: {
                    ...state.feedByGroupId,
                    [groupId]: { ...state.feedByGroupId[groupId], loading: false, error: message },
                },
            }));
        }
    },
    upsertPost(groupId, post) {
        get().ensureFeed(groupId);
        set((state) => {
            const feed = state.feedByGroupId[groupId];
            const existingIdx = feed.posts.findIndex((p) => p.id === post.id);
            const nextPosts = existingIdx >= 0
                ? feed.posts.map((p) => (p.id === post.id ? { ...p, ...post } : p))
                : [post, ...feed.posts];
            return {
                feedByGroupId: {
                    ...state.feedByGroupId,
                    [groupId]: { ...feed, posts: nextPosts },
                },
            };
        });
    },
    removePost(groupId, postId) {
        get().ensureFeed(groupId);
        set((state) => {
            const feed = state.feedByGroupId[groupId];
            return {
                feedByGroupId: {
                    ...state.feedByGroupId,
                    [groupId]: { ...feed, posts: feed.posts.filter((p) => p.id !== postId) },
                },
            };
        });
    },
    addComment(groupId, postId, comment) {
        get().ensureFeed(groupId);
        set((state) => {
            const feed = state.feedByGroupId[groupId];
            const nextPosts = feed.posts.map((p) => {
                if (p.id !== postId)
                    return p;
                const existing = p.comments ?? [];
                if (existing.some((c) => c.id === comment.id))
                    return p;
                return {
                    ...p,
                    comments: [...existing, comment],
                    commentCount: (p.commentCount ?? existing.length) + 1,
                };
            });
            return {
                feedByGroupId: {
                    ...state.feedByGroupId,
                    [groupId]: { ...feed, posts: nextPosts },
                },
            };
        });
    },
    removeComment(groupId, postId, commentId) {
        get().ensureFeed(groupId);
        set((state) => {
            const feed = state.feedByGroupId[groupId];
            const nextPosts = feed.posts.map((p) => {
                if (p.id !== postId)
                    return p;
                const existing = p.comments ?? [];
                if (!existing.some((c) => c.id === commentId))
                    return p;
                return {
                    ...p,
                    comments: existing.filter((c) => c.id !== commentId),
                    commentCount: Math.max(0, (p.commentCount ?? existing.length) - 1),
                };
            });
            return {
                feedByGroupId: {
                    ...state.feedByGroupId,
                    [groupId]: { ...feed, posts: nextPosts },
                },
            };
        });
    },
    applyLikeChanged(groupId, payload, currentUserId) {
        get().ensureFeed(groupId);
        set((state) => {
            const feed = state.feedByGroupId[groupId];
            const nextPosts = feed.posts.map((p) => {
                if (p.id !== payload.postId)
                    return p;
                const likeCount = p.likeCount ?? 0;
                const nextLikeCount = Math.max(0, likeCount + (payload.liked ? 1 : -1));
                const likedByMe = currentUserId && payload.userId === currentUserId ? payload.liked : p.likedByMe;
                return { ...p, likeCount: nextLikeCount, likedByMe };
            });
            return {
                feedByGroupId: {
                    ...state.feedByGroupId,
                    [groupId]: { ...feed, posts: nextPosts },
                },
            };
        });
    },
    applyPostCreated(groupId, payload) {
        get().upsertPost(groupId, payload.post);
    },
    applyCommentCreated(groupId, payload) {
        get().addComment(groupId, payload.postId, payload.comment);
    },
}));
