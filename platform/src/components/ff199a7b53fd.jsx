'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Lock, Users2, Share2, UserPlus, ChevronDown, MoreHorizontal, Copy, Globe, MapPin, Settings, Trash2, } from 'lucide-react';
import { Button } from '@/components/2795b661f080';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from '@/components/bc12d3573eef';
import { CommunityGroupFeed } from '@/components/e0a24dfd3319';
import { CommunityGroupChat } from '@/components/31ecafd8aa9e';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/2318256b5648';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ba221113eac7';
import { Input } from '@/components/c2f62fb0cb5e';
import { Badge } from '@/components/30348591d689';
import { Textarea } from '@/components/e1d2ad49fd73';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/1712d8a01fd3';
import { toast } from 'sonner';
function formatCompactNumber(n) {
    try {
        return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
    }
    catch {
        return String(n);
    }
}
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
export function CommunityGroupLayout({ group, members, recentMedia, groupId, isMember, myRole, currentUser, currentUserId, }) {
    const router = useRouter();
    const [tab, setTab] = useState('discussion');
    const isPrivate = group.visibility === 'private';
    const canManageGroup = myRole === 'owner' || myRole === 'mod';
    const [inviteOpen, setInviteOpen] = useState(false);
    const [membersQuery, setMembersQuery] = useState('');
    const [editOpen, setEditOpen] = useState(false);
    const [newName, setNewName] = useState(group.name);
    const [newDescription, setNewDescription] = useState(group.description ?? '');
    const [newLocation, setNewLocation] = useState(group.location ?? '');
    const [newVisibility, setNewVisibility] = useState((group.visibility ?? 'public'));
    const [savingName, setSavingName] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState('');
    const onLeave = async () => {
        const res = await fetch(`/api/community/groups/${groupId}/leave`, { method: 'POST' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            toast.error(data?.error || 'Failed to leave group');
            return;
        }
        toast.success('Left group');
        router.refresh();
    };
    const onJoin = async () => {
        const res = await fetch(`/api/community/groups/${groupId}/join`, { method: 'POST' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            toast.error(data?.error || 'Failed to join group');
            return;
        }
        toast.success(data?.alreadyMember ? 'Already a member' : 'Joined group');
        router.refresh();
    };
    const handleShare = () => {
        if (typeof navigator !== 'undefined' && navigator.share) {
            navigator.share({
                title: group.name,
                url: window.location.href,
                text: group.description || group.name,
            });
        }
        else {
            navigator.clipboard.writeText(window.location.href);
        }
    };
    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            toast.success('Link copied');
        }
        catch {
            toast.error('Failed to copy link');
        }
    };
    const saveGroup = async () => {
        const name = newName.trim();
        const description = newDescription.trim();
        const location = newLocation.trim();
        if (!name) {
            toast.error('Name is required');
            return;
        }
        setSavingName(true);
        try {
            const res = await fetch(`/api/community/groups/${groupId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    description: description || null,
                    location: location || null,
                    visibility: newVisibility,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data?.error || 'Failed to update group');
            toast.success('Group updated');
            setEditOpen(false);
            router.refresh();
        }
        catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to update group');
        }
        finally {
            setSavingName(false);
        }
    };
    const deleteGroup = async () => {
        if (deleteConfirm.trim() !== group.name.trim()) {
            toast.error('Type the group name to confirm');
            return;
        }
        setDeleting(true);
        try {
            const res = await fetch(`/api/community/groups/${groupId}`, { method: 'DELETE' });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data?.error || 'Failed to delete group');
            toast.success('Group deleted');
            router.push('/therapist/community');
            router.refresh();
        }
        catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to delete group');
        }
        finally {
            setDeleting(false);
            setDeleteOpen(false);
            setDeleteConfirm('');
        }
    };
    const filteredMembers = useMemo(() => {
        const q = membersQuery.trim().toLowerCase();
        if (!q)
            return members;
        return members.filter((m) => `${m.name} ${m.role}`.toLowerCase().includes(q));
    }, [members, membersQuery]);
    return (<div className="mx-auto w-full max-w-6xl px-4 pb-6">
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black tracking-tight text-gray-900 dark:text-white">Invite Peers</DialogTitle>
            <DialogDescription className="text-gray-500">Share this community with your colleagues to grow the network.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="group relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Copy className="h-4 w-4 text-gray-400 group-focus-within:text-indigo-500"/>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50/50 dark:bg-gray-800/50 pl-10 pr-4 py-3 text-[13px] font-mono text-gray-600 dark:text-gray-400 break-all select-all outline-none focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                {typeof window === 'undefined' ? '' : window.location.href}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={handleCopyLink} className="h-11 rounded-xl px-6 font-bold border-gray-200 dark:border-gray-800 gap-2 hover:bg-gray-50 dark:hover:bg-gray-800">
                <Copy className="h-4 w-4"/>
                Copy link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black tracking-tight text-gray-900 dark:text-white">Community Settings</DialogTitle>
            <DialogDescription className="text-gray-500">Update your community branding, visibility, and details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-gray-400 uppercase tracking-wider">Group Name</label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Group name" className="h-12 rounded-xl border-gray-100 dark:border-gray-800 focus:ring-2 focus:ring-indigo-500/20"/>
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-gray-400 uppercase tracking-wider">Description</label>
              <Textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="What is this community for?" className="min-h-[100px] rounded-xl border-gray-100 dark:border-gray-800 focus:ring-2 focus:ring-indigo-500/20"/>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-gray-400 uppercase tracking-wider">Visibility</label>
                <Select value={newVisibility} onValueChange={(v) => setNewVisibility(v)}>
                  <SelectTrigger className="h-12 rounded-xl border-gray-100 dark:border-gray-800">
                    <SelectValue placeholder="Select visibility"/>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl p-1">
                    <SelectItem value="public" className="rounded-lg">Public</SelectItem>
                    <SelectItem value="private" className="rounded-lg">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-gray-400 uppercase tracking-wider">Location</label>
                <Input value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder="Optional" className="h-12 rounded-xl border-gray-100 dark:border-gray-800 focus:ring-2 focus:ring-indigo-500/20"/>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setEditOpen(false)} disabled={savingName} className="h-11 rounded-xl px-6 font-bold text-gray-500">
                Cancel
              </Button>
              <Button onClick={saveGroup} disabled={savingName} className="h-11 rounded-xl px-10 font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 dark:shadow-none">
                {savingName ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black tracking-tight text-rose-600 dark:text-rose-500">Delete Community</DialogTitle>
            <DialogDescription className="text-gray-500">
              This action is <span className="font-bold text-rose-600">permanent</span>. All posts, members, and messages will be lost.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 pt-4">
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-gray-400 uppercase tracking-wider">
                Type <span className="text-rose-600">&quot;{group.name}&quot;</span> to confirm
              </label>
              <Input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder={group.name} className="h-12 rounded-xl border-rose-100 dark:border-rose-900/30 focus:ring-2 focus:ring-rose-500/20 text-rose-600 font-bold"/>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setDeleteOpen(false)} disabled={deleting} className="h-11 rounded-xl px-6 font-bold text-gray-500">
                Cancel
              </Button>
              <Button variant="destructive" onClick={deleteGroup} disabled={deleting} className="h-11 rounded-xl px-10 font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-100 dark:shadow-none">
                {deleting ? 'Deleting…' : 'Permanently Delete'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Slim Header */}
      <div className="mb-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Cover */}
        <div className="relative h-[120px] w-full">
          <div className="absolute top-3 left-3 z-10">
            <Button asChild variant="ghost" size="sm" className="h-7 rounded-md border border-gray-200 bg-white/90 px-2 text-xs text-gray-600 hover:bg-white">
              <Link href="/therapist/community">
                <ArrowLeft className="mr-1 h-3 w-3"/>
                Community
              </Link>
            </Button>
          </div>
          {group.coverImageUrl ? (<img src={group.coverImageUrl} alt="" className="h-full w-full object-cover"/>) : (<div className="h-full w-full bg-indigo-50"/>)}
        </div>

        {/* Group info row */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm -mt-8 relative z-10 text-lg font-bold text-indigo-600">
              {initials(group.name)}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{group.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  {isPrivate ? <Lock className="h-3 w-3"/> : <Globe className="h-3 w-3"/>}
                  {group.visibility}
                </span>
                <span className="flex items-center gap-1">
                  <Users2 className="h-3 w-3"/>
                  {formatCompactNumber(group.memberCount)} members
                </span>
                {group.location && (<span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3"/>
                    {group.location}
                  </span>)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isMember ? (<DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 rounded-lg border-gray-200 text-xs font-medium">
                    Joined <ChevronDown className="ml-1 h-3 w-3"/>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onSelect={handleCopyLink} className="gap-2 text-sm">
                    <Copy className="h-3.5 w-3.5"/> Copy Link
                  </DropdownMenuItem>
                  {canManageGroup && (<DropdownMenuItem onSelect={() => {
                    setNewName(group.name);
                    setNewDescription(group.description ?? '');
                    setNewLocation(group.location ?? '');
                    setNewVisibility((group.visibility ?? 'public'));
                    setEditOpen(true);
                }} className="gap-2 text-sm">
                      <Settings className="h-3.5 w-3.5"/> Settings
                    </DropdownMenuItem>)}
                  <div className="my-1 border-t border-gray-100"/>
                  {myRole !== 'owner' && (<DropdownMenuItem onSelect={onLeave} className="gap-2 text-sm text-red-600">
                      Leave Community
                    </DropdownMenuItem>)}
                  {myRole === 'owner' && (<DropdownMenuItem onSelect={() => { setDeleteConfirm(''); setDeleteOpen(true); }} className="gap-2 text-sm text-red-600">
                      <Trash2 className="h-3.5 w-3.5"/> Delete Group
                    </DropdownMenuItem>)}
                </DropdownMenuContent>
              </DropdownMenu>) : (<Button size="sm" onClick={onJoin} className="h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
                <UserPlus className="mr-1 h-3 w-3"/> Join
              </Button>)}
            <Button variant="outline" size="sm" onClick={() => setInviteOpen(true)} className="h-8 rounded-lg border-gray-200 text-xs">
              <Share2 className="mr-1 h-3 w-3"/> Invite
            </Button>
          </div>
        </div>

        {/* Underline Tab Bar */}
        <div className="border-t border-gray-100 px-5">
          <div className="flex gap-0">
            {[
            { id: 'discussion', label: 'Discussion' },
            { id: 'chat', label: 'Chat' },
            { id: 'members', label: 'Members' },
            { id: 'media', label: 'Media' },
        ].map((t) => (<button key={t.id} type="button" onClick={() => setTab(t.id)} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {t.label}
              </button>))}
          </div>
        </div>
      </div>

      {/* Main Content — single column */}
      <div className="mx-auto max-w-3xl">
        {tab === 'discussion' && (<CommunityGroupFeed groupId={groupId} groupName={group.name} groupVisibility={group.visibility ?? undefined} currentUserName={currentUser?.name} currentUserImageUrl={currentUser?.profileImageUrl} currentUserId={currentUserId} myRole={myRole}/>)}

        {tab === 'chat' && (<div className="h-[600px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <CommunityGroupChat groupId={groupId}/>
          </div>)}

        {tab === 'members' && (<div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-gray-100 p-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">Members</p>
                <p className="text-xs text-gray-500">{group.memberCount} total</p>
              </div>
              <Input value={membersQuery} onChange={(e) => setMembersQuery(e.target.value)} placeholder="Search..." className="h-8 w-48 rounded-lg border-gray-200 text-sm"/>
            </div>
            <ul className="divide-y divide-gray-100">
              {filteredMembers.map((m) => (<li key={m.userId} className="flex items-center gap-3 px-4 py-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={m.profileImageUrl ?? undefined}/>
                    <AvatarFallback className="text-xs">{initials(m.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{m.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant={m.role === 'owner' ? 'default' : 'secondary'} className="text-[10px] capitalize px-1.5 py-0">
                        {m.role}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {new Date(m.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  {canManageGroup && m.userId !== currentUserId && (<DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-3.5 w-3.5"/>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => {
                        if (!window.confirm(`Remove ${m.name}?`))
                            return;
                        void (async () => {
                            const res = await fetch(`/api/community/groups/${groupId}/members/${m.userId}`, { method: 'DELETE' });
                            const data = await res.json().catch(() => ({}));
                            if (!res.ok) {
                                toast.error(data?.error || 'Failed');
                                return;
                            }
                            toast.success('Member removed');
                            router.refresh();
                        })();
                    }} className="text-red-600 text-sm">
                          Remove member
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => {
                        const reason = window.prompt('Reason for report');
                        if (!reason?.trim())
                            return;
                        void (async () => {
                            const res = await fetch(`/api/community/groups/${groupId}/reports`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ reportedUserId: m.userId, reason: reason.trim() }),
                            });
                            const data = await res.json().catch(() => ({}));
                            if (!res.ok) {
                                toast.error(data?.error || 'Failed');
                                return;
                            }
                            toast.success('Report submitted');
                        })();
                    }} className="text-sm">
                          Report member
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>)}
                </li>))}
            </ul>
          </div>)}

        {tab === 'media' && (<div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-900">Media</p>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setTab('discussion')}>
                View posts
              </Button>
            </div>
            {recentMedia.length === 0 ? (<div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-10 text-center text-sm text-gray-500">
                No media yet.
              </div>) : (<div className="grid grid-cols-3 gap-2">
                {recentMedia.map((item) => (<Link key={item.postId} href={`#post-${item.postId}`} className="block aspect-square overflow-hidden rounded-lg bg-gray-100">
                    <img src={item.url} alt="" className="h-full w-full object-cover hover:opacity-90 transition-opacity"/>
                  </Link>))}
              </div>)}
          </div>)}
      </div>

    </div>);
}
