import 'server-only';
import { createClient } from '@/components/9a6b39502e62';
import { ok, fail } from '@/components/7ff049787825';
const MEDIA_BUCKET = 'community-post-media';
function validateMediaUrls(groupId, raw) {
    if (!Array.isArray(raw))
        return [];
    const urls = raw
        .filter((u) => typeof u === 'string')
        .map((u) => u.trim())
        .filter(Boolean);
    if (urls.length === 0)
        return [];
    if (urls.length > 4)
        throw new Error('Too many images (max 4)');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || null;
    const requiredPathPrefix = `/storage/v1/object/public/${MEDIA_BUCKET}/community/${groupId}/`;
    for (const u of urls) {
        let parsed;
        try {
            parsed = new URL(u);
        }
        catch {
            throw new Error('Invalid media URL');
        }
        if (supabaseUrl) {
            const supaOrigin = new URL(supabaseUrl).origin;
            if (parsed.origin !== supaOrigin)
                throw new Error('Invalid media URL');
        }
        if (!parsed.pathname.startsWith(requiredPathPrefix)) {
            throw new Error('Invalid media URL');
        }
    }
    return urls;
}
async function requireActiveMember(groupId, userId) {
    const supabase = await createClient();
    const { data: membership } = await supabase
        .from('community_group_members')
        .select('role, status')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .maybeSingle();
    if (!membership || membership.status !== 'active') {
        return { ok: false, status: 403, error: 'Not a group member' };
    }
    return { ok: true, supabase };
}
/** List a group's posts with comments, like counts, and author profiles. */
export async function listGroupPosts(userId, groupId) {
    const gate = await requireActiveMember(groupId, userId);
    if (!gate.ok)
        return fail(gate.status, gate.error);
    const { data: posts } = await gate.supabase
        .from('community_posts')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
        .limit(50);
    const postIds = (posts || []).map((p) => p.id);
    const [{ data: comments }, { data: likes }] = await Promise.all([
        postIds.length
            ? gate.supabase
                .from('community_post_comments')
                .select('*')
                .in('post_id', postIds)
                .order('created_at', { ascending: true })
            : Promise.resolve({ data: [] }),
        postIds.length
            ? gate.supabase
                .from('community_post_likes')
                .select('post_id, user_id')
                .in('post_id', postIds)
            : Promise.resolve({ data: [] }),
    ]);
    // Author profiles
    const authorIds = Array.from(new Set([
        ...(posts || []).map((p) => p.author_id),
        ...(comments || []).map((c) => c.author_id),
    ]));
    const profilesById = new Map();
    if (authorIds.length) {
        const { data: profiles } = await gate.supabase
            .from('user_profiles')
            .select('user_id, full_name, profile_image_url')
            .in('user_id', authorIds);
        (profiles || []).forEach((p) => profilesById.set(p.user_id, {
            fullName: p.full_name,
            profileImageUrl: p.profile_image_url ?? null,
        }));
    }
    const likeCountByPost = new Map();
    const likedByMeByPost = new Set();
    (likes || []).forEach((l) => {
        likeCountByPost.set(l.post_id, (likeCountByPost.get(l.post_id) || 0) + 1);
        if (l.user_id === userId)
            likedByMeByPost.add(l.post_id);
    });
    const commentsByPost = new Map();
    (comments || []).forEach((c) => {
        const arr = commentsByPost.get(c.post_id) || [];
        const profile = profilesById.get(c.author_id);
        arr.push({
            id: c.id,
            content: c.content,
            createdAt: c.created_at,
            author: {
                id: c.author_id,
                name: profile?.fullName || 'Unknown',
                profileImageUrl: profile?.profileImageUrl ?? null,
            },
        });
        commentsByPost.set(c.post_id, arr);
    });
    const postsWithComments = (posts || []).map((p) => {
        const profile = profilesById.get(p.author_id);
        return {
            id: p.id,
            groupId: p.group_id,
            authorId: p.author_id,
            content: p.content,
            createdAt: p.created_at,
            mediaUrls: p.media_urls ?? null,
            author: {
                id: p.author_id,
                name: profile?.fullName || 'Unknown',
                profileImageUrl: profile?.profileImageUrl ?? null,
            },
            commentCount: commentsByPost.get(p.id)?.length || 0,
            likeCount: likeCountByPost.get(p.id) || 0,
            likedByMe: likedByMeByPost.has(p.id),
            comments: commentsByPost.get(p.id) || [],
        };
    });
    return ok({ posts: postsWithComments });
}
/** Create a post in a group. Requires content or at least one valid media URL. */
export async function createGroupPost(userId, groupId, body) {
    const gate = await requireActiveMember(groupId, userId);
    if (!gate.ok)
        return fail(gate.status, gate.error);
    const content = String(body?.content || '').trim();
    let mediaUrls;
    try {
        const validated = validateMediaUrls(groupId, body?.mediaUrls);
        mediaUrls = validated.length ? validated : undefined;
    }
    catch (e) {
        return fail(400, e instanceof Error ? e.message : 'Invalid media URLs');
    }
    if (!content && !mediaUrls?.length) {
        return fail(400, 'Content or at least one image is required');
    }
    const insertPayload = {
        group_id: groupId,
        author_id: userId,
        content,
    };
    if (mediaUrls)
        insertPayload.media_urls = mediaUrls;
    const { data: post, error } = await gate.supabase
        .from('community_posts')
        .insert(insertPayload)
        .select('*')
        .single();
    if (error || !post) {
        console.error('[api/community/groups/[groupId]/posts] insert error', error);
        return fail(500, 'Failed to create post');
    }
    const { data: profile } = await gate.supabase
        .from('user_profiles')
        .select('full_name, profile_image_url')
        .eq('user_id', userId)
        .maybeSingle();
    return ok({
        post: {
            id: post.id,
            content: post.content,
            createdAt: post.created_at,
            mediaUrls: post.media_urls ?? null,
            author: {
                id: userId,
                name: profile?.full_name || 'Unknown',
                profileImageUrl: profile?.profile_image_url ?? null,
            },
            commentCount: 0,
            likeCount: 0,
            likedByMe: false,
            comments: [],
        },
    });
}
