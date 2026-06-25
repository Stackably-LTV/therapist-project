'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/2795b661f080';
import { Input } from '@/components/c2f62fb0cb5e';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from '@/components/ba221113eac7';
export function DeleteAllCoursesButton({ courseCount, }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [loading, setLoading] = useState(false);
    const canDelete = useMemo(() => confirmText.trim().toUpperCase() === 'DELETE', [confirmText]);
    const runDelete = async () => {
        if (!canDelete)
            return;
        setLoading(true);
        try {
            const res = await fetch('/api/therapist/courses/delete-all', { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data?.error || 'Failed to delete courses');
            toast.success(`Deleted ${data?.deletedCount ?? 0} course(s).`);
            setOpen(false);
            setConfirmText('');
            router.refresh();
        }
        catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to delete courses');
        }
        finally {
            setLoading(false);
        }
    };
    return (<>
      <Button variant="outline" onClick={() => setOpen(true)} disabled={courseCount === 0}>
        Delete all courses
      </Button>

      <Dialog open={open} onOpenChange={(v) => !loading && setOpen(v)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete all courses</DialogTitle>
            <DialogDescription>
              This will permanently delete <span className="font-semibold">{courseCount}</span>{' '}
              course(s), including modules, lessons, blocks, assessments, and assignments.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <div className="text-sm text-gray-700">
              Type <span className="font-mono font-semibold">DELETE</span> to confirm.
            </div>
            <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="DELETE" disabled={loading} autoFocus/>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={runDelete} disabled={!canDelete || loading} className="bg-red-600 hover:bg-red-700">
              {loading ? 'Deleting…' : 'Delete all'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>);
}
