'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/2795b661f080';
export function RemoveTherapistButton({ therapistId }) {
    const router = useRouter();
    const [removing, setRemoving] = useState(false);
    const removeTherapist = async () => {
        const ok = window.confirm('Remove this therapist from your care team? Your records stay in the system, but this therapist will no longer appear as your active therapist.');
        if (!ok)
            return;
        setRemoving(true);
        try {
            const response = await fetch(`/api/seeker/therapists/${encodeURIComponent(therapistId)}`, {
                method: 'DELETE',
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok)
                throw new Error(payload?.error || 'Failed to remove therapist');
            toast.success('Therapist removed.');
            router.push('/seeker/therapists');
            router.refresh();
        }
        catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to remove therapist');
        }
        finally {
            setRemoving(false);
        }
    };
    return (<Button type="button" variant="outline" size="lg" onClick={removeTherapist} disabled={removing} className="w-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800">
      <Trash2 className="mr-2 h-4 w-4"/>
      {removing ? 'Removing...' : 'Remove therapist'}
    </Button>);
}
