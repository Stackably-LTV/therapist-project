'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Lock, ImagePlus, Loader2, X } from 'lucide-react';
import { Button } from '@/components/2795b661f080';
import { Textarea } from '@/components/e1d2ad49fd73';
import { Dialog, DialogContent, DialogHeader, DialogTitle, } from '@/components/ba221113eac7';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/2318256b5648';
import { toast } from 'sonner';
function initials(name) {
    return name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((s) => s[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || '?';
}
const MAX_FILES = 4;
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export function CommunityCreatePostModal({ groupId, groupName, groupVisibility = 'public', userName, userImageUrl, open, openImagePickerOnOpen, onClose, onSuccess, }) {
    const [content, setContent] = useState('');
    const [posting, setPosting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedImages, setSelectedImages] = useState([]);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);
    useEffect(() => {
        if (!open) {
            setContent('');
            setError(null);
            setPosting(false);
            setUploading(false);
            setSelectedImages((prev) => {
                for (const it of prev)
                    URL.revokeObjectURL(it.previewUrl);
                return [];
            });
        }
    }, [open]);
    useEffect(() => {
        if (!open || !openImagePickerOnOpen)
            return;
        const t = setTimeout(() => fileInputRef.current?.click(), 0);
        return () => clearTimeout(t);
    }, [open, openImagePickerOnOpen]);
    const canPost = useMemo(() => {
        return content.trim().length > 0 || selectedImages.length > 0;
    }, [content, selectedImages.length]);
    const onPickFiles = (files) => {
        if (!files || files.length === 0)
            return;
        setError(null);
        setSelectedImages((prev) => {
            const next = [...prev];
            for (const file of Array.from(files)) {
                if (next.length >= MAX_FILES) {
                    setError(`You can attach up to ${MAX_FILES} images.`);
                    break;
                }
                if (!ALLOWED_TYPES.includes(file.type)) {
                    setError('Images must be JPEG, PNG, WebP or GIF.');
                    continue;
                }
                if (file.size > MAX_SIZE_BYTES) {
                    setError('Each image must be under 5MB.');
                    continue;
                }
                next.push({ file, previewUrl: URL.createObjectURL(file) });
            }
            return next;
        });
    };
    const removeImageAt = (idx) => {
        setSelectedImages((prev) => {
            const it = prev[idx];
            if (it)
                URL.revokeObjectURL(it.previewUrl);
            return prev.filter((_x, i) => i !== idx);
        });
    };
    const handleSubmit = async () => {
        if (!canPost || posting)
            return;
        setError(null);
        setPosting(true);
        try {
            let mediaUrls;
            if (selectedImages.length > 0) {
                setUploading(true);
                const uploaded = [];
                for (const it of selectedImages) {
                    const form = new FormData();
                    form.append('file', it.file);
                    const res = await fetch(`/api/community/groups/${groupId}/media`, {
                        method: 'POST',
                        body: form,
                    });
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok)
                        throw new Error(data?.error || 'Failed to upload image');
                    const publicUrl = String(data?.publicUrl || '').trim();
                    if (!publicUrl)
                        throw new Error('Upload failed: missing URL');
                    uploaded.push(publicUrl);
                }
                mediaUrls = uploaded;
            }
            const res = await fetch(`/api/community/groups/${groupId}/posts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: content.trim(), mediaUrls }),
            });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data?.error || 'Failed to post');
            if (data?.post)
                onSuccess(data.post);
            onClose();
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : 'Failed to post';
            setError(msg);
            toast.error(msg);
        }
        finally {
            setUploading(false);
            setPosting(false);
        }
    };
    return (<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg dark:bg-gray-900 dark:border-gray-700">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-center flex-1">Create post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={userImageUrl ?? undefined}/>
              <AvatarFallback>{initials(userName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-900 dark:text-white">{userName}</p>
              <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                <Lock className="h-3.5 w-3.5"/>
                <span>{groupVisibility === 'private' ? 'Private group' : 'Public group'}</span>
                <span className="text-gray-400">·</span>
                <span>{groupName}</span>
              </div>
            </div>
          </div>

          <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write something..." className="min-h-[120px] resize-none border-0 focus-visible:ring-0 text-base dark:bg-transparent dark:placeholder:text-gray-500" autoFocus/>

          <div className="rounded-lg border py-2 px-3 dark:border-gray-700">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Add images</p>
              <span className="text-xs text-gray-400">
                {selectedImages.length}/{MAX_FILES}
              </span>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <input ref={fileInputRef} type="file" accept={ALLOWED_TYPES.join(',')} multiple className="hidden" onChange={(e) => {
            onPickFiles(e.target.files);
            e.target.value = '';
        }}/>
              <Button type="button" variant="outline" className="h-9 gap-2" onClick={() => fileInputRef.current?.click()} disabled={posting || uploading || selectedImages.length >= MAX_FILES}>
                <ImagePlus className="h-4 w-4"/>
                Choose images
              </Button>
              <p className="text-xs text-gray-500 dark:text-gray-400">JPEG, PNG, WebP or GIF. Max 5MB each.</p>
            </div>

            {selectedImages.length > 0 ? (<div className="mt-3 grid grid-cols-2 gap-2">
                {selectedImages.map((it, idx) => (<div key={it.previewUrl} className="relative overflow-hidden rounded-md border dark:border-gray-700">
                    <img src={it.previewUrl} alt="" className="h-28 w-full object-cover"/>
                    <button type="button" onClick={() => removeImageAt(idx)} className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80" aria-label="Remove image" disabled={posting || uploading}>
                      <X className="h-4 w-4"/>
                    </button>
                  </div>))}
              </div>) : null}
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <Button className="w-full" disabled={!canPost || posting || uploading} onClick={() => void handleSubmit()}>
            {posting || uploading ? (<span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin"/>
                {uploading ? 'Uploading…' : 'Posting…'}
              </span>) : ('Post')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>);
}
