'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/2795b661f080';
import { Textarea } from '@/components/e1d2ad49fd73';
export default function CancellationRequestActions({ requestId }) {
    const router = useRouter();
    const [notes, setNotes] = useState('');
    const [pending, setPending] = useState(null);
    async function act(status) {
        setPending(status);
        try {
            const res = await fetch(`/api/admin/cancellation-requests/${requestId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, adminNotes: notes }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                toast.error(data.error || 'Could not update the request.');
                setPending(null);
                return;
            }
            toast.success(status === 'completed'
                ? 'Marked as cancelled.'
                : 'Request dismissed (subscription kept).');
            router.refresh();
        }
        catch {
            toast.error('Network error. Please try again.');
            setPending(null);
        }
    }
    return (<div className="space-y-3">
      <Textarea rows={2} placeholder="Internal note (optional) — e.g. cancelled in Stripe, refunded last invoice…" value={notes} onChange={(e) => setNotes(e.target.value)} className="text-sm"/>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => act('completed')} disabled={pending !== null} className="bg-red-600 hover:bg-red-700">
          {pending === 'completed' && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
          Mark cancelled in Stripe
        </Button>
        <Button type="button" variant="outline" onClick={() => act('dismissed')} disabled={pending !== null}>
          {pending === 'dismissed' && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
          Dismiss (keep plan)
        </Button>
      </div>
    </div>);
}
