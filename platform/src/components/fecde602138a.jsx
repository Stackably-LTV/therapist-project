'use client';
import { useState } from 'react';
import { Button } from '@/components/2795b661f080';
export function CourseBuyButton({ courseId }) {
    const [loading, setLoading] = useState(false);
    const buy = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/courses/${courseId}/checkout`, { method: 'POST' });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.error || 'Failed to start checkout');
            }
            if (data?.alreadyOwned && data?.redirectUrl) {
                window.location.href = data.redirectUrl;
                return;
            }
            const url = data?.url;
            if (!url)
                throw new Error('Missing checkout URL');
            window.location.href = url;
        }
        catch (err) {
            console.error('[CourseBuyButton] error', err);
            alert(err instanceof Error ? err.message : 'Checkout failed');
        }
        finally {
            setLoading(false);
        }
    };
    return (<Button onClick={buy} disabled={loading}>
      {loading ? 'Redirecting…' : 'Buy now'}
    </Button>);
}
