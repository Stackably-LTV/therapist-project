import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/components/98e56006aa84';
export function Pagination({ currentPage, totalPages, baseUrl, className }) {
    const hasPrev = currentPage > 1;
    const hasNext = currentPage < totalPages;
    const prevUrl = hasPrev
        ? `${baseUrl}?page=${currentPage - 1}`
        : undefined;
    const nextUrl = hasNext
        ? `${baseUrl}?page=${currentPage + 1}`
        : undefined;
    return (<div className={cn('flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50', className)}>
      <div className="flex-1">
        <p className="text-sm text-gray-600">
          Page <span className="font-medium">{currentPage}</span> of{' '}
          <span className="font-medium">{totalPages}</span>
        </p>
      </div>

      <div className="flex gap-2">
        {prevUrl ? (<Link href={prevUrl} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            <ChevronLeft className="w-4 h-4"/>
            Prev
          </Link>) : (<button disabled className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-400 bg-white border border-gray-300 rounded-lg opacity-50 cursor-not-allowed">
            <ChevronLeft className="w-4 h-4"/>
            Prev
          </button>)}

        {nextUrl ? (<Link href={nextUrl} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            Next
            <ChevronRight className="w-4 h-4"/>
          </Link>) : (<button disabled className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-400 bg-white border border-gray-300 rounded-lg opacity-50 cursor-not-allowed">
            Next
            <ChevronRight className="w-4 h-4"/>
          </button>)}
      </div>
    </div>);
}
