'use client';
import { useEffect } from 'react';
import { createClient } from '@/components/e7335a071b71';
import { useCommunityStore } from '@/components/3a9f78aaa153';
import { useRealtimeAuthSync } from '@/components/8b16d2798643';
function getGroupTopic(groupId) {
    return `group:${groupId}`;
}
function safePayload(evt) {
    const raw = evt;
    if (!raw?.payload || typeof raw.payload !== 'object')
        return null;
    return raw.payload;
}
function isRecord(v) {
    return Boolean(v) && typeof v === 'object';
}
export function useRealtimeCommunityGroupFeed(groupId, currentUserId) {
    useRealtimeAuthSync();
    useEffect(() => {
        if (!groupId)
            return;
        const supabase = createClient();
        const topic = getGroupTopic(groupId);
        let channel = null;
        let mounted = true;
        useCommunityStore.getState().ensureFeed(groupId);
        const handlePostCreated = (evt) => {
            const p = safePayload(evt);
            if (!p || !mounted)
                return;
            const post = p.post;
            if (!isRecord(post) || typeof post.id !== 'string')
                return;
            useCommunityStore.getState().applyPostCreated(groupId, { post: post });
        };
        const handleCommentCreated = (evt) => {
            const p = safePayload(evt);
            if (!p || !mounted)
                return;
            const postId = p.postId;
            const comment = p.comment;
            if (!postId || !isRecord(comment) || typeof comment.id !== 'string')
                return;
            useCommunityStore.getState().applyCommentCreated(groupId, {
                postId,
                comment: comment,
            });
        };
        const handleLikeChanged = (evt) => {
            const p = safePayload(evt);
            if (!p || !mounted)
                return;
            const postId = p.postId;
            const userId = p.userId;
            const liked = p.liked;
            if (!postId || !userId || typeof liked !== 'boolean')
                return;
            useCommunityStore.getState().applyLikeChanged(groupId, { postId, userId, liked }, currentUserId);
        };
        void (async () => {
            const { data: { user }, } = await supabase.auth.getUser();
            if (!user)
                return;
            const { data: { session }, } = await supabase.auth.getSession();
            if (!session?.access_token)
                return;
            await supabase.realtime.setAuth(session.access_token);
            const { data: membership } = await supabase
                .from('community_group_members')
                .select('user_id')
                .eq('group_id', groupId)
                .eq('user_id', user.id)
                .eq('status', 'active')
                .maybeSingle();
            // Skip private realtime channel when user is not an active member.
            if (!membership)
                return;
            channel = supabase.channel(topic, {
                config: { private: true, broadcast: { self: true } },
            });
            channel
                .on('broadcast', { event: 'community_post_created' }, handlePostCreated)
                .on('broadcast', { event: 'community_comment_created' }, handleCommentCreated)
                .on('broadcast', { event: 'community_post_like_changed' }, handleLikeChanged)
                .subscribe((status, err) => {
                if (status === 'CHANNEL_ERROR') {
                    const message = String(err?.message || '');
                    if (message.toLowerCase().includes('unauthorized'))
                        return;
                    console.warn('[useRealtimeCommunityGroupFeed] channel error', err);
                }
            });
        })();
        return () => {
            mounted = false;
            if (channel)
                supabase.removeChannel(channel);
        };
    }, [groupId, currentUserId]);
}
