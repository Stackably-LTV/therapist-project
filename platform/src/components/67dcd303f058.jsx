'use client';
import { useEffect } from 'react';
import { Button } from '@/components/2795b661f080';
export default function Error({ error, reset, }) {
    useEffect(() => {
        console.error('Therapist course overview error:', error);
    }, [error]);
    return (<div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="rounded-xl border bg-white p-6">
        <div className="text-lg font-semibold text-gray-900">Something went wrong</div>
        <div className="mt-2 text-sm text-gray-600">{error.message}</div>
        <div className="mt-4">
          <Button onClick={reset}>Try again</Button>
        </div>
      </div>
    </div>);
}
