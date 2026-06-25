'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
export default function AgoraVideoCall({ token, channelName, uid, appId, onCallEnd, onError, }) {
    const clientRef = useRef(null);
    const localVideoTrackRef = useRef(null);
    const localAudioTrackRef = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const [connectionState, setConnectionState] = useState('idle');
    const [isMicOn, setIsMicOn] = useState(true);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [remoteUser, setRemoteUser] = useState(null);
    const cleanup = useCallback(async () => {
        localAudioTrackRef.current?.close();
        localVideoTrackRef.current?.close();
        localAudioTrackRef.current = null;
        localVideoTrackRef.current = null;
        if (clientRef.current) {
            clientRef.current.removeAllListeners();
            if (clientRef.current.connectionState === 'CONNECTED') {
                await clientRef.current.leave();
            }
            clientRef.current = null;
        }
    }, []);
    useEffect(() => {
        let mounted = true;
        async function init() {
            try {
                setConnectionState('connecting');
                const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
                clientRef.current = client;
                client.on('user-published', async (user, mediaType) => {
                    await client.subscribe(user, mediaType);
                    if (mediaType === 'video' && remoteVideoRef.current) {
                        user.videoTrack?.play(remoteVideoRef.current);
                    }
                    if (mediaType === 'audio') {
                        user.audioTrack?.play();
                    }
                    if (mounted)
                        setRemoteUser(user);
                });
                client.on('user-unpublished', (user, mediaType) => {
                    if (mediaType === 'video' && remoteVideoRef.current) {
                        remoteVideoRef.current.innerHTML = '';
                    }
                });
                client.on('user-left', () => {
                    if (remoteVideoRef.current) {
                        remoteVideoRef.current.innerHTML = '';
                    }
                    if (mounted)
                        setRemoteUser(null);
                });
                client.on('connection-state-change', (curState) => {
                    if (!mounted)
                        return;
                    if (curState === 'DISCONNECTED') {
                        setConnectionState('disconnected');
                    }
                });
                const [micTrack, camTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
                localAudioTrackRef.current = micTrack;
                localVideoTrackRef.current = camTrack;
                if (localVideoRef.current) {
                    camTrack.play(localVideoRef.current);
                }
                await client.join(appId, channelName, token, uid);
                await client.publish([micTrack, camTrack]);
                if (mounted)
                    setConnectionState('connected');
            }
            catch (err) {
                console.error('Agora init error:', err);
                if (mounted) {
                    setConnectionState('error');
                    onError?.(err instanceof Error ? err.message : 'Failed to join video call');
                }
            }
        }
        init();
        return () => {
            mounted = false;
            cleanup();
        };
    }, [appId, channelName, token, uid, cleanup, onError]);
    const toggleMic = useCallback(async () => {
        const track = localAudioTrackRef.current;
        if (track) {
            await track.setEnabled(!isMicOn);
            setIsMicOn(!isMicOn);
        }
    }, [isMicOn]);
    const toggleCamera = useCallback(async () => {
        const track = localVideoTrackRef.current;
        if (track) {
            await track.setEnabled(!isCameraOn);
            setIsCameraOn(!isCameraOn);
        }
    }, [isCameraOn]);
    const handleEndCall = useCallback(async () => {
        await cleanup();
        setConnectionState('disconnected');
        onCallEnd();
    }, [cleanup, onCallEnd]);
    return (<div className="relative flex h-full w-full flex-col bg-gray-900">
      {connectionState === 'connecting' && (<div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-900">
          <div className="text-center text-white">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent"/>
            <p>Connecting to video call...</p>
          </div>
        </div>)}

      {connectionState === 'error' && (<div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-900">
          <div className="text-center text-white">
            <p className="mb-2 text-red-400">Failed to connect</p>
            <p className="text-sm text-gray-400">
              Please check your camera and microphone permissions.
            </p>
          </div>
        </div>)}

      <div className="relative flex-1">
        <div ref={remoteVideoRef} className="h-full w-full bg-gray-800"/>
        {!remoteUser && connectionState === 'connected' && (<div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-400">Waiting for the other person to join...</p>
          </div>)}
      </div>

      <div ref={localVideoRef} className="absolute bottom-20 right-4 z-10 h-36 w-48 overflow-hidden rounded-lg border-2 border-gray-700 bg-gray-800 shadow-lg"/>

      <div className="flex items-center justify-center gap-4 bg-gray-900/90 p-4">
        <button onClick={toggleMic} className={`rounded-full p-3 transition-colors ${isMicOn ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-red-600 text-white hover:bg-red-500'}`} title={isMicOn ? 'Mute microphone' : 'Unmute microphone'}>
          {isMicOn ? <Mic className="h-5 w-5"/> : <MicOff className="h-5 w-5"/>}
        </button>

        <button onClick={toggleCamera} className={`rounded-full p-3 transition-colors ${isCameraOn ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-red-600 text-white hover:bg-red-500'}`} title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}>
          {isCameraOn ? <Video className="h-5 w-5"/> : <VideoOff className="h-5 w-5"/>}
        </button>

        <button onClick={handleEndCall} className="rounded-full bg-red-600 p-3 text-white transition-colors hover:bg-red-500" title="End call">
          <PhoneOff className="h-5 w-5"/>
        </button>
      </div>
    </div>);
}
