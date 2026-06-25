'use client';
import dynamic from 'next/dynamic';
const AgoraVideoCall = dynamic(() => import('@/components/dcdd3f1fc221'), {
    ssr: false,
    loading: () => (<div className="flex h-full w-full items-center justify-center bg-gray-900">
      <div className="text-center text-white">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent"/>
        <p>Loading video call...</p>
      </div>
    </div>),
});
export default AgoraVideoCall;
