'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/2795b661f080';
import { Input } from '@/components/c2f62fb0cb5e';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from '@/components/ba221113eac7';
export function DeleteCourseButton({ courseId, courseTitle, size = 'sm', trigger, }) {
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
            const res = await fetch(`/api/therapist/courses/${courseId}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data?.error || 'Failed to delete course');
            toast.success('Course deleted.');
            setOpen(false);
            setConfirmText('');
            router.refresh();
        }
        catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to delete course');
        }
        finally {
            setLoading(false);
        }
    };
    return (<>
      {trigger ? (<div onClick={() => setOpen(true)}>{trigger}</div>) : (<Button variant="outline" size={size} onClick={() => setOpen(true)}>
          Delete
        </Button>)}

      <Dialog open={open} onOpenChange={(v) => !loading && setOpen(v)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete course</DialogTitle>
            <DialogDescription>
              This will permanently delete <span className="font-semibold">{courseTitle}</span>{' '}
              and all nested content.
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
              {loading ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>);
}
