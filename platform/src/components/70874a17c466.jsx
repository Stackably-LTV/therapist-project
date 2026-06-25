'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';
export function CheckoutStatusHandler() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const checkoutStatus = searchParams.get('checkout');
    useEffect(() => {
        if (checkoutStatus === 'success') {
            toast.success('Payment received! Your session is being confirmed.', {
                duration: 6000,
            });
            router.replace('/seeker/bookings', { scroll: false });
        }
        else if (checkoutStatus === 'cancelled') {
            toast.error('Payment was cancelled. You can try booking again.');
            router.replace('/seeker/bookings', { scroll: false });
        }
    }, [checkoutStatus, router]);
    return null;
}
