'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/2795b661f080';
export function CommunityGroupJoinButton({ groupId }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const join = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/community/groups/${groupId}/join`, { method: 'POST' });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data?.error || 'Failed to join');
            toast.success(data?.alreadyMember ? 'Already a member' : 'Joined group');
            router.refresh();
        }
        catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to join');
        }
        finally {
            setLoading(false);
        }
    };
    return (<Button onClick={join} disabled={loading}>
      {loading ? 'Joining…' : 'Join group'}
    </Button>);
}
