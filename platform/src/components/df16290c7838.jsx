import Link from 'next/link';
import { PsychlinkMark, PsychlinkWordmark } from '@/components/171b48435a24';
export default function AuthLayout({ children, wide = false }) {
    return (<div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className={wide ? 'w-full max-w-4xl' : 'w-full max-w-md'}>
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <PsychlinkMark className="h-8 w-8 text-primary"/>
            <PsychlinkWordmark className="text-2xl"/>
          </Link>
        </div>
        {children}
      </div>
    </div>);
}
