'use client';
import { Button } from '@/components/2795b661f080';
export default function SeekerError({ reset, }) {
    return (<div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-900">
      <h2 className="text-lg font-semibold">Something went wrong on this page.</h2>
      <p className="mt-2 text-sm text-red-700">
        Please try again. If the issue persists, refresh the app and contact support.
      </p>
      <Button onClick={reset} className="mt-4 bg-red-700 text-white hover:bg-red-800">
        Try Again
      </Button>
    </div>);
}
