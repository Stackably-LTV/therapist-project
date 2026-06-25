'use client';
import { useMemo } from 'react';
import BookingModalTrigger from '@/components/f91b45fcbcd7';
import { getDmKey, useChatStore } from '@/components/2da802565614';
function getRequestStatusForDmKey(state, dmKey) {
    for (const r of Object.values(state.consultationRequestByRequestId)) {
        if (!r?.seeker_id || !r?.therapist_id)
            continue;
        if (getDmKey(r.seeker_id, r.therapist_id) === dmKey)
            return r.status || null;
    }
    return null;
}
export default function BookingEntrypoint(props) {
    const dmKey = useMemo(() => getDmKey(props.seekerId, props.therapistId), [props.seekerId, props.therapistId]);
    const requestStatus = useChatStore((s) => getRequestStatusForDmKey(s, dmKey));
    const bookingEnabled = props.initialBookingEnabled || requestStatus === 'accepted';
    const disabledReason = useMemo(() => {
        if (bookingEnabled)
            return '';
        if (requestStatus === 'pending') {
            return 'Waiting for this therapist to accept your consultation request.';
        }
        if (requestStatus === 'declined') {
            return 'Your consultation request was declined. Send a message to coordinate next steps.';
        }
        return props.initialBookingDisabledReason || 'Connect with this therapist first. Go to Messages to send a consultation request.';
    }, [
        bookingEnabled,
        props.initialBookingDisabledReason,
        requestStatus,
    ]);
    return (<BookingModalTrigger therapistId={props.therapistId} therapistName={props.therapistName} therapistImage={props.therapistImage} rate={props.rate} sessionDuration={props.sessionDuration} disabled={!bookingEnabled} disabledReason={disabledReason} defaultOpen={props.defaultOpen}/>);
}
