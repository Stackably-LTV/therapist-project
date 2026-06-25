import 'server-only';
import { createClient, createServiceRoleClient } from '@/components/9a6b39502e62';
import { ok, fail } from '@/components/7ff049787825';
const MEDIA_BUCKET = 'community-post-media';
function extractMediaObjectPaths(raw) {
    if (!Array.isArray(raw))
        return [];
    const prefix = `/storage/v1/object/public/${MEDIA_BUCKET}/`;
    const paths = [];
    for (const item of raw) {
        if (typeof item !== 'string')
            continue;
        try {
            const u = new URL(item);
            if (!u.pathname.startsWith(prefix))
                continue;
            const path = decodeURIComponent(u.pathname.slice(prefix.length));
            if (path)
                paths.push(path);
        }
        catch { }
    }
    return Array.from(new Set(paths));
}
async function gateForPost(postId, userId) {
    const supabase = await createClient();
    const { data: post } = await supabase
        .from('community_posts')
        .select('group_id')
        .eq('id', postId)
        .maybeSingle();
    if (!post)
        return { ok: false, status: 404, error: 'Post not found' };
    const { data: membership } = await supabase
        .from('community_group_members')
        .select('status')
        .eq('group_id', post.group_id)
        .eq('user_id', userId)
        .maybeSingle();
    if (!membership || membership.status !== 'active') {
        return { ok: false, status: 403, error: 'Not a group member' };
    }
    return { ok: true, supabase };
}
/** Delete a post. Author or owner/mod only. Cleans up associated media. */
export async function deletePost(userId, postId) {
    const supabase = await createClient();
    const { data: post } = await supabase
        .from('community_posts')
        .select('*')
        .eq('id', postId)
        .maybeSingle();
    if (!post)
        return fail(404, 'Post not found');
    const mediaObjectPaths = extractMediaObjectPaths(post.media_urls);
    const { data: membership } = await supabase
        .from('community_group_members')
        .select('role, status')
        .eq('group_id', post.group_id)
        .eq('user_id', userId)
        .maybeSingle();
    if (!membership || membership.status !== 'active') {
        return fail(403, 'Not a group member');
    }
    const canModerate = membership.role === 'owner' || membership.role === 'mod';
    if (!canModerate && post.author_id !== userId) {
        return fail(403, 'Insufficient permissions');
    }
    const { error } = await supabase.from('community_posts').delete().eq('id', postId);
    if (error) {
        console.error('[api/community/posts/[postId]] DELETE error', error);
        return fail(500, 'Failed to delete');
    }
    if (mediaObjectPaths.length > 0) {
        try {
            const service = createServiceRoleClient();
            await service.storage.from(MEDIA_BUCKET).remove(mediaObjectPaths);
        }
        catch (e) {
            console.warn('[api/community/posts/[postId]] media cleanup failed', e);
        }
    }
    return ok({ ok: true });
}
/** Get like count and whether the caller has liked a post. */
export async function getPostLikes(userId, postId) {
    const gate = await gateForPost(postId, userId);
    if (!gate.ok)
        return fail(gate.status, gate.error);
    const { count } = await gate.supabase
        .from('community_post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);
    const { data: mine } = await gate.supabase
        .from('community_post_likes')
        .select('post_id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle();
    return ok({ count: count || 0, likedByMe: !!mine });
}
/** Toggle the caller's like on a post; returns the new state and total count. */
export async function togglePostLike(userId, postId) {
    const gate = await gateForPost(postId, userId);
    if (!gate.ok)
        return fail(gate.status, gate.error);
    const { data: existing } = await gate.supabase
        .from('community_post_likes')
        .select('post_id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle();
    let liked;
    if (existing) {
        await gate.supabase
            .from('community_post_likes')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', userId);
        liked = false;
    }
    else {
        await gate.supabase
            .from('community_post_likes')
            .insert({ post_id: postId, user_id: userId });
        liked = true;
    }
    const { count } = await gate.supabase
        .from('community_post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);
    return ok({ liked, count: count || 0 });
}
/** Create a comment on a post. Caller must be an active member of the post's group. */
export async function createComment(userId, postId, body) {
    const supabase = await createClient();
    const { data: post } = await supabase
        .from('community_posts')
        .select('group_id')
        .eq('id', postId)
        .maybeSingle();
    if (!post)
        return fail(404, 'Post not found');
    const { data: membership } = await supabase
        .from('community_group_members')
        .select('status')
        .eq('group_id', post.group_id)
        .eq('user_id', userId)
        .maybeSingle();
    if (!membership || membership.status !== 'active') {
        return fail(403, 'Not a group member');
    }
    const content = String(body?.content || '').trim();
    if (!content)
        return fail(400, 'Content is required');
    const { data: comment, error } = await supabase
        .from('community_post_comments')
        .insert({
        post_id: postId,
        author_id: userId,
        content,
    })
        .select('*')
        .single();
    if (error || !comment) {
        console.error('[api/community/posts/[postId]/comments] insert error', error);
        return fail(500, 'Failed to create comment');
    }
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name, profile_image_url')
        .eq('user_id', userId)
        .maybeSingle();
    return ok({
        comment: {
            id: comment.id,
            content: comment.content,
            createdAt: comment.created_at,
            author: {
                id: userId,
                name: profile?.full_name || 'Unknown',
                profileImageUrl: profile?.profile_image_url ?? null,
            },
        },
    });
}
/** Delete a comment. Author or owner/mod of the post's group only. */
export async function deleteComment(userId, postId, commentId) {
    const supabase = await createClient();
    const { data: post } = await supabase
        .from('community_posts')
        .select('group_id')
        .eq('id', postId)
        .maybeSingle();
    if (!post)
        return fail(404, 'Post not found');
    const { data: membership } = await supabase
        .from('community_group_members')
        .select('role, status')
        .eq('group_id', post.group_id)
        .eq('user_id', userId)
        .maybeSingle();
    if (!membership || membership.status !== 'active') {
        return fail(403, 'Not a group member');
    }
    const { data: comment } = await supabase
        .from('community_post_comments')
        .select('*')
        .eq('id', commentId)
        .maybeSingle();
    if (!comment || comment.post_id !== postId) {
        return fail(404, 'Comment not found');
    }
    const canModerate = membership.role === 'owner' || membership.role === 'mod';
    if (!canModerate && comment.author_id !== userId) {
        return fail(403, 'Insufficient permissions');
    }
    const { error } = await supabase
        .from('community_post_comments')
        .delete()
        .eq('id', commentId);
    if (error) {
        console.error('[api/community/posts/[postId]/comments/[commentId]] DELETE error', error);
        return fail(500, 'Failed to delete');
    }
    return ok({ ok: true });
}
