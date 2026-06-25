'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/2795b661f080';
import { Textarea } from '@/components/e1d2ad49fd73';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/bc12d3573eef';
import { ThumbsUp, MessageSquare, Share2, MoreHorizontal, Image as ImageIcon, Send, } from 'lucide-react';
import { CommunityCreatePostModal } from '@/components/ddffef4702e3';
import { useCommunityStore } from '@/components/3a9f78aaa153';
import { useRealtimeCommunityGroupFeed } from '@/components/f75b1db942b5';
import { createClient } from '@/components/e7335a071b71';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/2318256b5648';
import { toast } from 'sonner';
function formatTime(iso) {
    return new Date(iso).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}
function formatRelativeTime(iso) {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffM = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffM / 60);
    const diffD = Math.floor(diffH / 24);
    if (diffM < 1)
        return 'Just now';
    if (diffM < 60)
        return `${diffM}m`;
    if (diffH < 24)
        return `${diffH}h`;
    if (diffD < 7)
        return `${diffD}d`;
    return formatTime(iso);
}
export function CommunityGroupFeed({ groupId, groupName, groupVisibility, currentUserName, currentUserImageUrl, currentUserId, myRole, }) {
    const [authUserId, setAuthUserId] = useState(null);
    const feed = useCommunityStore((s) => s.feedByGroupId[groupId]);
    const ensureFeed = useCommunityStore((s) => s.ensureFeed);
    const loadGroupFeed = useCommunityStore((s) => s.loadGroupFeed);
    const upsertPost = useCommunityStore((s) => s.upsertPost);
    const addComment = useCommunityStore((s) => s.addComment);
    const removePost = useCommunityStore((s) => s.removePost);
    const removeComment = useCommunityStore((s) => s.removeComment);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [openImagePickerOnOpen, setOpenImagePickerOnOpen] = useState(false);
    useEffect(() => {
        ensureFeed(groupId);
        const cur = useCommunityStore.getState().feedByGroupId[groupId];
        if (!cur?.loadedAt && !cur?.loading)
            void loadGroupFeed(groupId);
    }, [groupId, ensureFeed, loadGroupFeed]);
    useEffect(() => {
        const supabase = createClient();
        void (async () => {
            const { data } = await supabase.auth.getUser();
            setAuthUserId(data.user?.id ?? null);
        })();
    }, []);
    useRealtimeCommunityGroupFeed(groupId, currentUserId ?? authUserId);
    const submitComment = async (postId, content) => {
        const trimmed = content.trim();
        if (!trimmed)
            return false;
        try {
            const res = await fetch(`/api/community/posts/${postId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: trimmed }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data?.error || 'Failed to comment');
            if (data?.comment)
                addComment(groupId, postId, data.comment);
            return true;
        }
        catch (e) {
            console.error('[CommunityGroupFeed] submitComment error', e);
            toast.error(e instanceof Error ? e.message : 'Failed to comment');
            return false;
        }
    };
    const posts = (feed?.posts ?? []);
    const loading = feed?.loading ?? true;
    const error = feed?.error ?? null;
    const canModerate = myRole === 'owner' || myRole === 'mod';
    return (<div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={currentUserImageUrl ?? undefined}/>
            <AvatarFallback className="text-xs bg-indigo-50 text-indigo-600">
              {currentUserName?.substring(0, 2).toUpperCase() ?? 'ME'}
            </AvatarFallback>
          </Avatar>
          <button type="button" onClick={() => { setOpenImagePickerOnOpen(false); setCreateModalOpen(true); }} className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-left text-sm text-gray-400 hover:bg-white hover:border-indigo-300 transition-colors">
            Write something...
          </button>
          <button type="button" onClick={() => { setOpenImagePickerOnOpen(true); setCreateModalOpen(true); }} className="rounded-lg border border-gray-200 p-2 text-gray-400 hover:text-indigo-600 hover:border-indigo-300 transition-colors" title="Add photo">
            <ImageIcon className="h-4 w-4"/>
          </button>
        </div>
      </div>

      <CommunityCreatePostModal groupId={groupId} groupName={groupName ?? 'Group'} groupVisibility={groupVisibility ?? 'public'} userName={currentUserName ?? 'You'} userImageUrl={currentUserImageUrl} open={createModalOpen} openImagePickerOnOpen={openImagePickerOnOpen} onClose={() => {
            setCreateModalOpen(false);
            setOpenImagePickerOnOpen(false);
        }} onSuccess={(post) => upsertPost(groupId, post)}/>

      {error ? (<div className="rounded-2xl border border-red-100 bg-red-50/50 p-4 text-sm font-medium text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>) : null}

      {loading ? (<div className="space-y-3">
          {[1, 2].map((i) => (<div key={i} className="h-32 animate-pulse rounded-xl border border-gray-200 bg-white"/>))}
        </div>) : posts.length === 0 ? (<div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center">
          <MessageSquare className="mx-auto h-8 w-8 text-gray-300 mb-3"/>
          <p className="text-sm font-medium text-gray-700">No posts yet</p>
          <p className="mt-1 text-xs text-gray-500">Be the first to start a conversation.</p>
          <Button size="sm" onClick={() => { setOpenImagePickerOnOpen(false); setCreateModalOpen(true); }} className="mt-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
            Create Post
          </Button>
        </div>) : (<div className="space-y-4">
          {posts.map((p) => (<PostCard key={p.id} post={p} onComment={submitComment} groupId={groupId} currentUserName={currentUserName} currentUserImageUrl={currentUserImageUrl} currentUserId={currentUserId} canModerate={canModerate} onDeleted={(deletedPostId) => removePost(groupId, deletedPostId)} onCommentDeleted={(postId, commentId) => removeComment(groupId, postId, commentId)} onLikeToggle={async () => {
                    const previousLiked = Boolean(p.likedByMe);
                    const previousLikeCount = p.likeCount ?? 0;
                    const optimisticLiked = !previousLiked;
                    const optimisticCount = Math.max(0, previousLikeCount + (optimisticLiked ? 1 : -1));
                    upsertPost(groupId, {
                        ...p,
                        likedByMe: optimisticLiked,
                        likeCount: optimisticCount,
                    });
                    try {
                        const res = await fetch(`/api/community/posts/${p.id}/likes`, { method: 'POST' });
                        const data = await res.json().catch(() => ({}));
                        if (!res.ok)
                            throw new Error(data?.error || 'Failed to react');
                        if (typeof data?.liked !== 'boolean' || typeof data?.count !== 'number') {
                            throw new Error('Failed to react');
                        }
                        upsertPost(groupId, { ...p, likedByMe: data.liked, likeCount: data.count });
                    }
                    catch (e) {
                        upsertPost(groupId, {
                            ...p,
                            likedByMe: previousLiked,
                            likeCount: previousLikeCount,
                        });
                        toast.error(e instanceof Error ? e.message : 'Failed to react');
                    }
                }}/>))}
        </div>)}
    </div>);
}
function PostCard({ post, groupId, onComment, onLikeToggle, currentUserName, currentUserImageUrl, currentUserId, canModerate, onDeleted, onCommentDeleted, }) {
    const [comment, setComment] = useState('');
    const [sending, setSending] = useState(false);
    const comments = post.comments || [];
    const likeCount = post.likeCount ?? 0;
    const commentCount = post.commentCount ?? comments.length;
    const mediaUrls = Array.isArray(post.mediaUrls) ? post.mediaUrls : [];
    const getInitials = (name) => name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase() || '?';
    const sharePost = async () => {
        try {
            const base = new URL(window.location.href);
            base.hash = `post-${post.id}`;
            const url = base.toString();
            if (navigator.share) {
                await navigator.share({ title: 'Community post', text: post.content?.slice(0, 120), url });
            }
            else {
                await navigator.clipboard.writeText(url);
                toast.success('Link copied');
            }
        }
        catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to share');
        }
    };
    return (<div id={`post-${post.id}`} className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={post.author?.profileImageUrl ?? undefined}/>
          <AvatarFallback className="text-xs bg-gray-100 text-gray-600">
            {getInitials(post.author?.name || 'User')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{post.author?.name || 'Therapist'}</p>
          <p className="text-xs text-gray-400">{formatRelativeTime(post.createdAt)}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
              <MoreHorizontal className="h-4 w-4"/>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(canModerate || currentUserId === post.author?.id) && (<DropdownMenuItem onSelect={() => {
                if (!window.confirm('Delete this post?'))
                    return;
                void (async () => {
                    const res = await fetch(`/api/community/posts/${post.id}`, { method: 'DELETE' });
                    if (res.ok) {
                        onDeleted(post.id);
                        return;
                    }
                    const data = await res.json().catch(() => ({}));
                    toast.error(data?.error || 'Failed to delete post');
                })();
            }} className="text-red-600 text-sm">
                Delete post
              </DropdownMenuItem>)}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="whitespace-pre-wrap break-words text-sm text-gray-800 leading-relaxed">
          {post.content}
        </p>
      </div>

      {/* Media */}
      {mediaUrls.length > 0 && (<div className={mediaUrls.length === 1 ? '' : 'grid grid-cols-2 gap-0.5 px-0.5 pb-0.5'}>
          {mediaUrls.map((url, i) => (<a key={i} href={url} target="_blank" rel="noopener noreferrer" className={`block overflow-hidden bg-gray-100 ${mediaUrls.length === 1 ? '' : 'aspect-square rounded-lg'}`}>
              <img src={url} alt="" className={`w-full object-cover hover:opacity-95 transition-opacity ${mediaUrls.length === 1 ? 'max-h-[420px]' : 'h-full'}`}/>
            </a>))}
        </div>)}

      {/* Stats + Actions */}
      <div className="px-4 py-2">
        {(likeCount > 0 || commentCount > 0) && (<div className="flex items-center justify-between py-1.5 border-b border-gray-100 mb-1">
            <span className="text-xs text-gray-500">{likeCount > 0 ? `${likeCount} support` : ''}</span>
            <span className="text-xs text-gray-500">{commentCount > 0 ? `${commentCount} comments` : ''}</span>
          </div>)}
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => void onLikeToggle()} className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors ${post.likedByMe ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500 hover:bg-gray-50'}`}>
            <ThumbsUp className={`h-3.5 w-3.5 ${post.likedByMe ? 'fill-current' : ''}`}/>
            Support
          </button>
          <button type="button" onClick={() => document.getElementById(`comment-input-${post.id}`)?.focus()} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors">
            <MessageSquare className="h-3.5 w-3.5"/>
            Comment
          </button>
          <button type="button" onClick={() => void sharePost()} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors">
            <Share2 className="h-3.5 w-3.5"/>
            Share
          </button>
        </div>
      </div>

      {/* Comments */}
      <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-3 space-y-3">
        {comments.map((c) => (<div key={c.id} className="flex gap-2 group">
            <Avatar className="h-7 w-7 shrink-0 mt-0.5">
              <AvatarImage src={c.author?.profileImageUrl ?? undefined}/>
              <AvatarFallback className="text-[10px]">{getInitials(c.author?.name || 'User')}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="inline-block rounded-lg bg-white border border-gray-200 px-3 py-2 max-w-full">
                <p className="text-xs font-medium text-gray-900">{c.author?.name || 'Therapist'}</p>
                <p className="text-xs text-gray-700 break-words mt-0.5">{c.content}</p>
              </div>
              <div className="mt-1 ml-1 flex items-center gap-3 text-[10px] text-gray-400">
                <span>{formatRelativeTime(c.createdAt)}</span>
                {(canModerate || currentUserId === c.author?.id) && (<button className="hover:text-red-500 transition-colors" onClick={() => {
                    if (!window.confirm('Delete this comment?'))
                        return;
                    void (async () => {
                        const res = await fetch(`/api/community/posts/${post.id}/comments/${c.id}`, { method: 'DELETE' });
                        if (res.ok) {
                            onCommentDeleted(post.id, c.id);
                            return;
                        }
                        const data = await res.json().catch(() => ({}));
                        toast.error(data?.error || 'Failed to delete comment');
                    })();
                }}>
                    Delete
                  </button>)}
              </div>
            </div>
          </div>))}

        {/* Comment input */}
        <div className="flex gap-2 items-center">
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarImage src={currentUserImageUrl ?? undefined}/>
            <AvatarFallback className="text-[10px] bg-indigo-50 text-indigo-600">
              {currentUserName?.substring(0, 2).toUpperCase() ?? 'ME'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 focus-within:border-indigo-300 transition-colors">
            <Textarea id={`comment-input-${post.id}`} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Write a comment..." className="min-h-0 h-auto flex-1 resize-none border-0 bg-transparent p-0 text-xs focus-visible:ring-0 text-gray-900 placeholder:text-gray-400" rows={1} onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const c = comment.trim();
                if (!c)
                    return;
                setSending(true);
                void onComment(post.id, c).then((ok) => {
                    if (ok)
                        setComment('');
                }).finally(() => setSending(false));
            }
        }}/>
            <button disabled={!comment.trim() || sending} onClick={() => {
            const c = comment.trim();
            if (!c)
                return;
            setSending(true);
            void onComment(post.id, c).then((ok) => {
                if (ok)
                    setComment('');
            }).finally(() => setSending(false));
        }} className="text-indigo-500 hover:text-indigo-700 disabled:opacity-30 transition-colors">
              <Send className="h-3.5 w-3.5"/>
            </button>
          </div>
        </div>
      </div>
    </div>);
}
