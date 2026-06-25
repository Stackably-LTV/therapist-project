'use client';
import { useEffect, useState } from 'react';
import AgoraVideoCall from '@/components/1167c7b01ced';
import { VideoSessionNotesPanel } from '@/components/344aebdd7af3';
export default function VideoSessionLauncher({ sessionId }) {
    const [session, setSession] = useState(null);
    const [error, setError] = useState(null);
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`/api/video/token/${sessionId}`, { method: 'POST' });
                const data = await res.json();
                if (cancelled)
                    return;
                if (!res.ok) {
                    setError(data?.error || 'Failed to join session');
                    return;
                }
                setSession(data);
            }
            catch {
                if (!cancelled)
                    setError('Failed to connect to video call');
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [sessionId]);
    if (error) {
        return (<div className="flex min-h-screen items-center justify-center bg-gray-900 p-6 text-center text-white">
        <div>
          <p className="text-lg font-semibold">{error}</p>
          <button onClick={() => window.close()} className="mt-4 rounded-md bg-white/10 px-4 py-2 text-sm hover:bg-white/20">
            Close tab
          </button>
        </div>
      </div>);
    }
    if (!session) {
        return (<div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent"/>
          <p>Connecting to video call…</p>
        </div>
      </div>);
    }
    const call = (<AgoraVideoCall {...session} onCallEnd={() => {
            try {
                window.close();
            }
            catch {
                window.location.href = '/login';
            }
        }} onError={(msg) => setError(msg)}/>);
    return (<div className="fixed inset-0 z-50 bg-gray-900">
      {session.participantRole === 'therapist' ? (<div className="flex h-full w-full">
          <div className="min-w-0 flex-1">{call}</div>
          <VideoSessionNotesPanel sessionId={sessionId} seekerId={session.session?.seekerId}/>
        </div>) : (call)}
    </div>);
}
