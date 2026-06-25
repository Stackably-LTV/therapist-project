'use client';
import { useState } from 'react';
import { Video } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/c0ebd3fbafc6';
import { Button } from '@/components/2795b661f080';
import { toast } from 'sonner';
import AgoraVideoCall from '@/components/1167c7b01ced';
export default function VideoSessionCard({ sessionId, canJoin, isUpcoming, isQuickSession, sessionStatus, timeUntilSession, onCallEnd, openInNewTab = false, }) {
    const [videoSession, setVideoSession] = useState(null);
    const [joining, setJoining] = useState(false);
    async function handleJoinSession() {
        if (openInNewTab) {
            window.open(`/video/${sessionId}`, '_blank', 'noopener,noreferrer');
            return;
        }
        setJoining(true);
        try {
            const res = await fetch(`/api/video/token/${sessionId}`, { method: 'POST' });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || 'Failed to join session');
                return;
            }
            setVideoSession(data);
        }
        catch {
            toast.error('Failed to connect to video call');
        }
        finally {
            setJoining(false);
        }
    }
    if (videoSession) {
        return (<div className="fixed inset-0 z-50 bg-gray-900">
        <AgoraVideoCall {...videoSession} onCallEnd={() => {
                setVideoSession(null);
                onCallEnd?.();
            }} onError={(msg) => {
                toast.error(msg);
                setVideoSession(null);
            }}/>
      </div>);
    }
    return (<Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5"/>
          Video Session
        </CardTitle>
      </CardHeader>
      <CardContent>
        {canJoin ? (<div className="space-y-4">
            <p className="text-gray-600">
              {isQuickSession
                ? 'Your session is ready. Click the button below to join the video call.'
                : 'Your session is ready to start. Click the button below to join the video call.'}
            </p>
            <Button type="button" size="lg" className="w-full" onClick={handleJoinSession} disabled={joining}>
              <Video className="h-5 w-5 mr-2"/>
              {joining
                ? 'Connecting...'
                : sessionStatus === 'in_progress'
                    ? 'Rejoin Video Session'
                    : 'Join Video Session'}
            </Button>
          </div>) : isUpcoming && !isQuickSession ? (<div className="text-center py-4">
            <p className="text-gray-600 mb-2">
              You can join the session 30 minutes before the scheduled time
            </p>
            {timeUntilSession && (<p className="text-sm text-gray-500">{timeUntilSession}</p>)}
          </div>) : (<div className="text-center py-4">
            <p className="text-gray-600">This session has ended</p>
          </div>)}
      </CardContent>
    </Card>);
}
