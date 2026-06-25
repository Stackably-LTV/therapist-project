import { Suspense } from 'react';
import VideoSessionLauncher from '@/components/c43b5cdfe8ed';
export const dynamic = 'force-dynamic';
export default async function StandaloneVideoSessionPage({ params, }) {
    const { sessionId } = await params;
    return (<div className="fixed inset-0 bg-black text-white">
      <Suspense>
        <VideoSessionLauncher sessionId={sessionId}/>
      </Suspense>
    </div>);
}
