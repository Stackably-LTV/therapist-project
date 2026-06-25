'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Search, Users2, Plus, Loader2, X, ImagePlus, MoreHorizontal, Check } from 'lucide-react';
import { Button } from '@/components/2795b661f080';
import { Input } from '@/components/c2f62fb0cb5e';
import { Textarea } from '@/components/e1d2ad49fd73';
import { useCommunityStore } from '@/components/3a9f78aaa153';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from '@/components/bc12d3573eef';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, } from '@/components/ba221113eac7';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/f199a80a8c3b';
import { toast } from 'sonner';
function initialsFromName(name) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] || 'G';
    const b = parts[1]?.[0] || '';
    return (a + b).toUpperCase();
}
function formatCompactNumber(n) {
    try {
        return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
    }
    catch {
        return String(n);
    }
}
export function CommunityGroupsFacebook() {
    const [tab, setTab] = useState('my');
    const [query, setQuery] = useState('');
    const myGroups = useCommunityStore((s) => s.myGroups);
    const discoverPopular = useCommunityStore((s) => s.discoverPopular);
    const discoverSuggestions = useCommunityStore((s) => s.discoverSuggestions);
    const [dismissedIds, setDismissedIds] = useState(new Set());
    const [joiningIds, setJoiningIds] = useState(new Set());
    const [justJoinedIds, setJustJoinedIds] = useState(new Set());
    const [leavingIds, setLeavingIds] = useState(new Set());
    const loadingMy = useCommunityStore((s) => s.loadingMyGroups);
    const loadingDiscover = useCommunityStore((s) => s.loadingDiscover);
    const error = useCommunityStore((s) => s.communityError);
    const loadMy = useCommunityStore((s) => s.loadMyGroups);
    const loadDiscover = useCommunityStore((s) => s.loadDiscover);
    const [createOpen, setCreateOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newCoverUrl, setNewCoverUrl] = useState('');
    const [newLocation, setNewLocation] = useState('Optional');
    const [coverPreview, setCoverPreview] = useState(null);
    const [coverUploading, setCoverUploading] = useState(false);
    const [coverError, setCoverError] = useState(null);
    const fileInputRef = useRef(null);
    const handleCoverFile = async (file) => {
        setCoverError(null);
        if (!file) {
            setCoverPreview(null);
            setNewCoverUrl('');
            return;
        }
        if (!file.type.startsWith('image/')) {
            setCoverError('Please choose a JPEG, PNG, WebP or GIF image.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setCoverError('Image must be under 5MB.');
            return;
        }
        setCoverPreview(URL.createObjectURL(file));
        setCoverUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/storage/upload-community-cover', { method: 'POST', body: formData });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data?.error || 'Upload failed');
            setNewCoverUrl(data.url);
        }
        catch (e) {
            setCoverError(e instanceof Error ? e.message : 'Upload failed');
            setCoverPreview(null);
            setNewCoverUrl('');
        }
        finally {
            setCoverUploading(false);
        }
    };
    const resetCreateForm = () => {
        setNewName('');
        setNewDesc('');
        setNewCoverUrl('');
        setNewLocation('Optional');
        setCoverError(null);
        setCoverPreview((prev) => {
            if (prev)
                URL.revokeObjectURL(prev);
            return null;
        });
    };
    const dismissCard = (groupId) => {
        setDismissedIds((prev) => new Set(prev).add(groupId));
    };
    useEffect(() => {
        void loadMy();
        void loadDiscover('');
    }, [loadMy, loadDiscover]);
    const filteredMy = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q)
            return myGroups;
        return myGroups.filter((g) => (g.name || '').toLowerCase().includes(q));
    }, [myGroups, query]);
    const filteredPopular = useMemo(() => {
        const q = query.trim().toLowerCase();
        let list = discoverPopular.filter((g) => !dismissedIds.has(g.id));
        if (q)
            list = list.filter((g) => (g.name || '').toLowerCase().includes(q));
        return list;
    }, [discoverPopular, query, dismissedIds]);
    const filteredSuggestions = useMemo(() => {
        const q = query.trim().toLowerCase();
        let list = discoverSuggestions.filter((g) => !dismissedIds.has(g.id));
        if (q)
            list = list.filter((g) => (g.name || '').toLowerCase().includes(q));
        return list;
    }, [discoverSuggestions, query, dismissedIds]);
    const createGroup = async () => {
        const name = newName.trim();
        if (!name) {
            toast.error('Group name is required.');
            return;
        }
        setCreating(true);
        try {
            const res = await fetch('/api/community/groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    description: newDesc.trim() || null,
                    coverImageUrl: newCoverUrl.trim() || null,
                    location: ['optional', ''].includes(newLocation.trim().toLowerCase()) ? null : newLocation.trim(),
                }),
            });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data?.error || 'Failed to create group');
            setCreateOpen(false);
            resetCreateForm();
            await loadMy();
            await loadDiscover(query);
            setTab('my');
            toast.success(`"${name}" created`, { description: 'You are now the owner.' });
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : 'Failed to create group';
            console.error('[CommunityGroupsFacebook] createGroup error', e);
            toast.error(msg);
        }
        finally {
            setCreating(false);
        }
    };
    const findGroup = (groupId) => discoverPopular.find((g) => g.id === groupId) ||
        discoverSuggestions.find((g) => g.id === groupId) ||
        myGroups.find((g) => g.id === groupId);
    const join = async (groupId) => {
        if (joiningIds.has(groupId))
            return;
        const groupName = findGroup(groupId)?.name || 'group';
        setJoiningIds((prev) => new Set(prev).add(groupId));
        const toastId = toast.loading(`Joining ${groupName}...`);
        try {
            const res = await fetch(`/api/community/groups/${groupId}/join`, { method: 'POST' });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data?.error || 'Failed to join group');
            setJustJoinedIds((prev) => new Set(prev).add(groupId));
            toast.success(data?.alreadyMember ? `Already a member of ${groupName}` : `Joined ${groupName}`, {
                id: toastId,
                description: 'View it in My Groups.',
                action: {
                    label: 'Open',
                    onClick: () => {
                        window.location.href = `/therapist/community/${groupId}`;
                    },
                },
            });
            await loadMy();
            await loadDiscover(query);
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : 'Failed to join group';
            console.error('[CommunityGroupsFacebook] join error', e);
            toast.error(msg, { id: toastId });
        }
        finally {
            setJoiningIds((prev) => {
                const next = new Set(prev);
                next.delete(groupId);
                return next;
            });
        }
    };
    const leave = async (groupId) => {
        if (leavingIds.has(groupId))
            return;
        const groupName = findGroup(groupId)?.name || 'group';
        setLeavingIds((prev) => new Set(prev).add(groupId));
        const toastId = toast.loading(`Leaving ${groupName}...`);
        try {
            const res = await fetch(`/api/community/groups/${groupId}/leave`, { method: 'POST' });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data?.error || 'Failed to leave group');
            await loadMy();
            await loadDiscover(query);
            toast.success(`Left ${groupName}`, { id: toastId });
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : 'Failed to leave group';
            console.error('[CommunityGroupsFacebook] leave error', e);
            toast.error(msg, { id: toastId });
        }
        finally {
            setLeavingIds((prev) => {
                const next = new Set(prev);
                next.delete(groupId);
                return next;
            });
        }
    };
    return (<div className="space-y-8">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-4 mb-6">
        <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-100 p-1">
          {['my', 'discover'].map((t) => (<button key={t} type="button" onClick={() => setTab(t)} className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {t === 'my' ? 'My Groups' : 'Discover'}
            </button>))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"/>
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search groups..." className="h-9 pl-9 w-64 rounded-lg border-gray-200 text-sm"/>
          </div>

          <Dialog open={createOpen} onOpenChange={(open) => {
            setCreateOpen(open);
            if (!open)
                resetCreateForm();
        }}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3">
                <Plus className="h-3.5 w-3.5 mr-1.5"/>
                New Group
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl gap-0 p-0 overflow-hidden border-gray-200 dark:border-gray-800 shadow-2xl">
              <div className="p-6 pb-0">
                <DialogHeader className="mb-4">
                  <DialogTitle className="text-xl font-bold">Create a new group</DialogTitle>
                  <p className="text-sm text-gray-500">
                    Host a private community for your peers.
                  </p>
                </DialogHeader>

                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Cover Image</label>
                    <div role="button" tabIndex={0} onClick={() => fileInputRef.current?.click()} onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()} onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-indigo-500', 'bg-indigo-50'); }} onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('ring-2', 'ring-indigo-500', 'bg-indigo-50'); }} onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('ring-2', 'ring-indigo-500', 'bg-indigo-50');
            const file = e.dataTransfer.files[0];
            if (file)
                void handleCoverFile(file);
        }} className={`group relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200 ${coverPreview ? 'border-transparent p-0' : 'border-gray-200 hover:border-indigo-400 bg-gray-50 hover:bg-white'}`}>
                      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0];
            void handleCoverFile(f || null);
            e.target.value = '';
        }}/>
                      {coverUploading ? (<div className="flex flex-col items-center gap-2 text-sm text-indigo-600">
                          <Loader2 className="h-6 w-6 animate-spin"/>
                          <span>Uploading image...</span>
                        </div>) : coverPreview ? (<div className="relative h-full w-full">
                          <img src={coverPreview} alt="Preview" className="h-[160px] w-full rounded-xl object-cover"/>
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                            <span className="text-white font-medium">Change Image</span>
                          </div>
                          <button type="button" onClick={(e) => { e.stopPropagation(); handleCoverFile(null); }} className="absolute right-2 top-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors">
                            <X className="h-4 w-4"/>
                          </button>
                        </div>) : (<div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-indigo-500 transition-colors">
                          <div className="p-3 bg-white rounded-full shadow-sm ring-1 ring-gray-100 group-hover:ring-indigo-100 transition-all">
                            <ImagePlus className="h-6 w-6"/>
                          </div>
                          <div className="text-center">
                            <span className="text-sm font-medium text-gray-700 block group-hover:text-indigo-600">Click to upload</span>
                            <span className="text-xs text-gray-500 mt-1 block">SVG, PNG, JPG (max 5MB)</span>
                          </div>
                        </div>)}
                    </div>
                    {coverError && <p className="text-xs text-red-500 font-medium">{coverError}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Group Name</label>
                    <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Cognitive Behavioral Therapy Circle" className="h-10 rounded-lg bg-gray-50 border-gray-200 focus:bg-white transition-all"/>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Description</label>
                    <Textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Briefly describe the purpose of this group..." rows={3} className="rounded-lg bg-gray-50 border-gray-200 focus:bg-white transition-all resize-none"/>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Location (Optional)</label>
                    <Input value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder="Optional" className="h-10 rounded-lg bg-gray-50 border-gray-200 focus:bg-white transition-all"/>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50/50 mt-6 flex justify-end gap-3 border-t border-gray-100">
                <Button variant="ghost" onClick={() => setCreateOpen(false)} disabled={creating} className="hover:bg-gray-100 text-gray-600">
                  Cancel
                </Button>
                <Button onClick={() => void createGroup()} disabled={creating} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200">
                  {creating ? <><Loader2 className="h-4 w-4 animate-spin mr-2"/>Creating...</> : 'Create Group'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (<Alert variant="destructive" className="mb-6 rounded-xl border-red-200 bg-red-50 text-red-800 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-300">
          <AlertCircle className="h-4 w-4"/>
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>)}

      <div className="min-h-[400px]">
        {tab === 'my' && (<div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {loadingMy ? (<SkeletonGrid />) : filteredMy.length === 0 ? (<EmptyState title="No groups yet" body="You haven't joined any groups yet. Browse the Discover tab to find communities." actionLabel="Browse Groups" onAction={() => setTab('discover')}/>) : (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMy.map((g) => {
                    const isOwner = g.myRole === 'owner';
                    return (<GroupCard key={g.id} group={g} primary={{
                            label: 'View Group',
                            href: `/therapist/community/${g.id}`,
                            iconRight: true,
                        }} secondary={isOwner
                            ? undefined
                            : {
                                label: 'Leave',
                                onClick: () => void leave(g.id),
                                variant: 'outline',
                                busy: leavingIds.has(g.id),
                            }} badge={isOwner ? 'Owner' : undefined}/>);
                })}
              </div>)}
          </div>)}

        {tab === 'discover' && (<div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {loadingDiscover ? (<SkeletonGrid />) : (<>
                {filteredPopular.length > 0 && (<div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900">Popular Communities</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredPopular.map((g) => {
                        const isActive = g.myStatus === 'active' || justJoinedIds.has(g.id);
                        const isOwner = g.myRole === 'owner';
                        const joining = joiningIds.has(g.id);
                        return (<GroupCard key={g.id} group={g} primary={isActive
                                ? { label: 'View Group', href: `/therapist/community/${g.id}`, iconRight: true }
                                : { label: joining ? 'Joining...' : 'Join Community', onClick: () => void join(g.id), busy: joining }} secondary={isActive && !isOwner
                                ? { label: 'Leave', onClick: () => void leave(g.id), variant: 'outline', busy: leavingIds.has(g.id) }
                                : undefined} featured={true} dismissible={!isActive} onDismiss={() => dismissCard(g.id)} badge={isOwner ? 'Owner' : isActive ? 'Joined' : undefined}/>);
                    })}
                    </div>
                  </div>)}

                {filteredSuggestions.length > 0 && (<div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900">Suggested for You</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredSuggestions.map((g) => {
                        const isActive = g.myStatus === 'active' || justJoinedIds.has(g.id);
                        const isOwner = g.myRole === 'owner';
                        const joining = joiningIds.has(g.id);
                        return (<GroupCard key={g.id} group={g} primary={isActive
                                ? { label: 'View Group', href: `/therapist/community/${g.id}`, iconRight: true }
                                : { label: joining ? 'Joining...' : 'Join Community', onClick: () => void join(g.id), busy: joining }} secondary={isActive && !isOwner
                                ? { label: 'Leave', onClick: () => void leave(g.id), variant: 'outline', busy: leavingIds.has(g.id) }
                                : undefined} dismissible={!isActive} onDismiss={() => dismissCard(g.id)} badge={isOwner ? 'Owner' : isActive ? 'Joined' : undefined}/>);
                    })}
                    </div>
                  </div>)}

                {filteredPopular.length === 0 && filteredSuggestions.length === 0 && (<EmptyState title="No communities found" body="We couldn't find any groups matching your search." actionLabel="Create New Community" onAction={() => setCreateOpen(true)}/>)}
              </>)}
          </div>)}
      </div>
    </div>);
}
function SkeletonGrid() {
    return (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (<div key={i} className="h-[130px] animate-pulse rounded-xl border border-gray-200 border-l-4 border-l-gray-200 bg-white p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-gray-100"/>
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-3/4 rounded bg-gray-100"/>
              <div className="h-3 w-1/2 rounded bg-gray-100"/>
            </div>
          </div>
          <div className="mt-4 h-7 w-full rounded-lg bg-gray-100"/>
        </div>))}
    </div>);
}
function EmptyState({ title, body, actionLabel, onAction }) {
    return (<div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-12 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-gray-200 shadow-sm">
        <Users2 className="h-5 w-5 text-gray-400"/>
      </div>
      <p className="mt-3 text-sm font-semibold text-gray-900">{title}</p>
      <p className="mt-1 text-sm text-gray-500">{body}</p>
      <Button size="sm" onClick={onAction} className="mt-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
        {actionLabel}
      </Button>
    </div>);
}
function GroupCard({ group, primary, secondary, dismissible, onDismiss, featured, badge, }) {
    const borderColors = [
        'border-l-indigo-500',
        'border-l-violet-500',
        'border-l-sky-500',
        'border-l-emerald-500',
        'border-l-rose-500',
    ];
    const hue = useMemo(() => {
        let h = 0;
        for (let i = 0; i < (group.id + group.name).length; i++)
            h = (h * 31 + (group.id + group.name).charCodeAt(i)) % borderColors.length;
        return h;
    }, [group.id, group.name]);
    const memberCountStr = typeof group.memberCount === 'number' ? formatCompactNumber(group.memberCount) : '0';
    const primaryBusy = primary.busy;
    return (<div className={`relative flex flex-col gap-3 rounded-xl border border-gray-200 border-l-4 ${borderColors[hue]} bg-white p-4 shadow-sm hover:shadow-md transition-shadow duration-200`}>
      {/* Top-right corner stack: badge + dismiss never overlap */}
      <div className="absolute right-2 top-2 flex items-center gap-1.5">
        {badge === 'Owner' ? (<span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 uppercase tracking-wide">
            {badge}
          </span>) : badge ? (<span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 uppercase tracking-wide">
            <Check className="h-3 w-3"/>
            {badge}
          </span>) : null}
        {featured && !badge && (<span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 uppercase tracking-wide">
            Featured
          </span>)}
        {dismissible && onDismiss && (<button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDismiss(); }} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700" aria-label="Hide this suggestion" title="Hide this suggestion">
            <X className="h-3.5 w-3.5"/>
          </button>)}
      </div>

      <div className="flex items-start gap-3 pr-24">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-sm font-bold text-gray-600">
          {initialsFromName(group.name)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">{group.name}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
            <Users2 className="h-3 w-3"/>
            {memberCountStr} members
          </p>
        </div>
      </div>

      {group.description && (<p className="line-clamp-2 text-xs text-gray-500">{group.description}</p>)}

      <div className="flex gap-2">
        {primary.href ? (<Button asChild size="sm" className="flex-1 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
            <Link href={primary.href}>{primary.label}</Link>
          </Button>) : (<Button size="sm" onClick={primary.onClick} disabled={primaryBusy} className="flex-1 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs disabled:opacity-70">
            {primaryBusy && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5"/>}
            {primary.label}
          </Button>)}
        {secondary && (<DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="outline" disabled={secondary.busy} className="h-8 w-8 rounded-lg border-gray-200" aria-label="More">
                {secondary.busy ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <MoreHorizontal className="h-3.5 w-3.5"/>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={(e) => {
                e.preventDefault();
                if (window.confirm('Leave this group?'))
                    secondary.onClick();
            }} className="text-red-600">
                Leave group
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>)}
      </div>
    </div>);
}
