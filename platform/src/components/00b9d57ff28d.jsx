'use client';
import { useRealtimeConsultationRequests } from '@/components/8b16d2798643';
export default function ConsultationRealtimeBootstrap({ currentUserId, currentUserRole, }) {
    const role = currentUserRole === 'therapist' ? 'therapist' : currentUserRole === 'seeker' ? 'seeker' : null;
    // Admin/unassigned shouldn't subscribe to consultation request topics.
    if (!role)
        return null;
    useRealtimeConsultationRequests(currentUserId, role);
    return null;
}
