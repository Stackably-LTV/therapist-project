'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/2795b661f080';
import { Textarea } from '@/components/e1d2ad49fd73';
import { Alert, AlertDescription } from '@/components/f199a80a8c3b';
export default function ConsultationRequestPanel({ mode, targetUserId, targetUserName, existingRequest, currentUserId, }) {
    const router = useRouter();
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const status = existingRequest?.status || null;
    const title = useMemo(() => {
        if (mode === 'seeker') {
            if (status === 'pending')
                return 'Consultation request sent';
            if (status === 'declined')
                return 'Consultation request declined';
            return 'Request a consultation';
        }
        if (status === 'pending')
            return 'New consultation request';
        if (status === 'declined')
            return 'Consultation request declined';
        return 'Consultation request';
    }, [mode, status]);
    const description = useMemo(() => {
        if (mode === 'seeker') {
            if (status === 'pending')
                return `Waiting for ${targetUserName} to accept your request.`;
            if (status === 'declined')
                return `${targetUserName} declined your request. You can try again later.`;
            return `Send a short message to ${targetUserName} before booking.`;
        }
        if (status === 'pending')
            return `${targetUserName} wants to message you before booking.`;
        if (status === 'declined')
            return 'This request was declined.';
        return 'Review the request status.';
    }, [mode, status, targetUserName]);
    const refresh = () => {
        router.refresh();
    };
    const createRequest = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/consultations/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    therapist_id: targetUserId,
                    seeker_id: currentUserId,
                    initiated_by: mode,
                    initial_message: message || undefined,
                }),
            });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data.error || 'Failed to send request');
            refresh();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to send request');
        }
        finally {
            setLoading(false);
        }
    };
    const updateStatus = async (nextStatus) => {
        if (!existingRequest)
            return;
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`/api/consultations/requests/${existingRequest.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: nextStatus }),
            });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data.error || 'Failed to update request');
            refresh();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to update request');
        }
        finally {
            setLoading(false);
        }
    };
    const deleteRequest = async () => {
        if (!existingRequest)
            return;
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`/api/consultations/requests/${existingRequest.id}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data.error || 'Failed to cancel request');
            refresh();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to cancel request');
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="bg-white rounded-lg shadow-lg p-8 text-left">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-600 mb-6">{description}</p>

      {error && (<Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>)}

      {mode === 'seeker' && !existingRequest && (<div className="space-y-4">
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Optional: share what you're looking for (1-2 sentences)..." disabled={loading} className="min-h-[110px]"/>
          <Button onClick={createRequest} disabled={loading} className="w-full">
            {loading ? 'Sending...' : 'Send consultation request'}
          </Button>
        </div>)}

      {mode === 'seeker' && existingRequest?.status === 'pending' && (<div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
            <div className="font-semibold text-gray-900 mb-1">Your message</div>
            <div className="whitespace-pre-line">{existingRequest.initial_message || 'No message provided.'}</div>
          </div>
          <Button variant="outline" onClick={deleteRequest} disabled={loading} className="w-full">
            {loading ? 'Cancelling...' : 'Cancel request'}
          </Button>
        </div>)}

      {mode === 'therapist' && existingRequest?.status === 'pending' && (<div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
            <div className="font-semibold text-gray-900 mb-1">Message</div>
            <div className="whitespace-pre-line">{existingRequest.initial_message || 'No message provided.'}</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button onClick={() => updateStatus('accepted')} disabled={loading}>
              {loading ? 'Updating...' : 'Accept'}
            </Button>
            <Button variant="outline" onClick={() => updateStatus('declined')} disabled={loading}>
              {loading ? 'Updating...' : 'Decline'}
            </Button>
          </div>
        </div>)}

      {(existingRequest?.status === 'declined' || existingRequest?.status === 'accepted') && (<div className="space-y-3">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
            Status: <span className="font-semibold">{existingRequest.status}</span>
          </div>
          <Button variant="outline" onClick={() => router.push(`/chat?with=${targetUserId}`)} className="w-full">
            Back
          </Button>
        </div>)}
    </div>);
}
