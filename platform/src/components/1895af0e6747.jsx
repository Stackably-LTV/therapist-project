'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/2795b661f080';
import { Input } from '@/components/c2f62fb0cb5e';
import { Textarea } from '@/components/e1d2ad49fd73';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/c0ebd3fbafc6';
export function CommunityGroupDirectory() {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('Optional');
    const [creating, setCreating] = useState(false);
    const load = async () => {
        setError(null);
        try {
            setLoading(true);
            const res = await fetch('/api/community/groups', { cache: 'no-store' });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data?.error || 'Failed to load groups');
            setGroups((data?.groups || []));
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load groups');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        void load();
    }, []);
    const createGroup = async () => {
        const n = name.trim();
        if (!n) {
            setError('Group name is required');
            return;
        }
        setError(null);
        try {
            setCreating(true);
            const res = await fetch('/api/community/groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: n,
                    description: description.trim() || null,
                    location: ['optional', ''].includes(location.trim().toLowerCase()) ? null : location.trim(),
                }),
            });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data?.error || 'Failed to create group');
            setName('');
            setDescription('');
            setLocation('Optional');
            await load();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to create group');
        }
        finally {
            setCreating(false);
        }
    };
    return (<div className="space-y-8">
      <div className="rounded-2xl border bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Create a group</h2>
        <p className="mt-1 text-sm text-gray-600">Groups are visible only to active therapist members.</p>

        <div className="mt-4 grid gap-3">
          <div>
            <label className="text-sm font-medium text-gray-900">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Trauma-informed practice"/>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-900">Description</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}/>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-900">Location (Optional)</label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Optional"/>
          </div>
          {error ? <div className="text-sm text-red-600">{error}</div> : null}
          <div className="flex justify-end">
            <Button onClick={createGroup} disabled={creating}>
              {creating ? 'Creating…' : 'Create group'}
            </Button>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Your groups</h2>
            <p className="mt-1 text-sm text-gray-600">Groups you are an active member of.</p>
          </div>
          <Button variant="outline" onClick={load} disabled={loading}>
            Refresh
          </Button>
        </div>

        {loading ? (<div className="rounded-xl border bg-white p-8 text-sm text-gray-600">Loading…</div>) : groups.length === 0 ? (<div className="rounded-xl border bg-white p-8 text-sm text-gray-600">
            You are not in any groups yet.
          </div>) : (<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((g) => (<Card key={g.id}>
                <CardHeader>
                  <CardTitle className="line-clamp-2">{g.name}</CardTitle>
                  <CardDescription className="line-clamp-2">{g.description || '—'}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {typeof g.memberCount === 'number' ? `${g.memberCount} members` : '—'}
                    </span>
                    <span className="text-xs font-medium text-gray-500">
                      {g.myRole ? g.myRole : 'member'}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="justify-end">
                  <Button asChild>
                    <Link href={`/therapist/community/${g.id}`}>Open</Link>
                  </Button>
                </CardFooter>
              </Card>))}
          </div>)}
      </div>
    </div>);
}
