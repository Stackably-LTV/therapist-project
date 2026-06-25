'use client';
import { useEffect } from 'react';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/2795b661f080';
import Link from 'next/link';
export default function Error({ error, reset, }) {
    useEffect(() => {
        console.error('Application error:', error);
    }, [error]);
    return (<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-red-100 rounded-full">
              <AlertCircle className="h-16 w-16 text-red-600"/>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Something Went Wrong
          </h1>
          <p className="text-gray-600 mb-4">
            We encountered an unexpected error. Please try again or contact support if the problem persists.
          </p>
          {error.message && (<div className="bg-gray-100 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700 font-mono break-words">
                {error.message}
              </p>
            </div>)}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={reset} variant="default">
            <RefreshCw className="h-4 w-4 mr-2"/>
            Try Again
          </Button>
          <Link href="/">
            <Button variant="outline">
              <Home className="h-4 w-4 mr-2"/>
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    </div>);
}
