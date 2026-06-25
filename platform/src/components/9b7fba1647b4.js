import { createClient } from '@/components/e7335a071b71';
export class BookingService {
    supabase = createClient();
    /**
     * Create a new booking (appointment).
     */
    async createBooking(data) {
        try {
            const { data: { user }, } = await this.supabase.auth.getUser();
            if (!user) {
                throw new Error('User must be authenticated to book a session');
            }
            const isAvailable = await this.checkSlotAvailability(data.therapistId, data.scheduledAt, data.durationMinutes);
            if (!isAvailable) {
                throw new Error('This time slot is no longer available');
            }
            const sessionData = {
                seeker_id: user.id,
                therapist_id: data.therapistId,
                scheduled_at: data.scheduledAt.toISOString(),
                duration_minutes: data.durationMinutes,
                status: 'scheduled',
                session_data_json: data.sessionDataJson || {},
            };
            const { data: session, error } = await this.supabase
                .from('appointments')
                .insert(sessionData)
                .select()
                .single();
            if (error)
                throw error;
            return session;
        }
        catch (error) {
            console.error('Create booking error:', error);
            throw error;
        }
    }
    /**
     * Check if a time slot is available
     */
    async checkSlotAvailability(therapistId, scheduledAt, durationMinutes) {
        try {
            const endTime = new Date(scheduledAt.getTime() + durationMinutes * 60000);
            const { data: overlappingSessions, error } = await this.supabase
                .from('appointments')
                .select('id, scheduled_at, duration_minutes')
                .eq('therapist_id', therapistId)
                .in('status', ['scheduled', 'in_progress'])
                .gte('scheduled_at', scheduledAt.toISOString())
                .lt('scheduled_at', endTime.toISOString());
            if (error)
                throw error;
            return !overlappingSessions || overlappingSessions.length === 0;
        }
        catch (error) {
            console.error('Check slot availability error:', error);
            return false;
        }
    }
    /**
     * Get a seeker's bookings.
     */
    async getClientBookings(seekerId) {
        try {
            const { data, error } = await this.supabase
                .from('appointments')
                .select(`
          *,
          therapist:user_profiles!appointments_therapist_id_fkey(user_id, full_name, profile_image_url, specialties, rate)
        `)
                .eq('seeker_id', seekerId)
                .order('scheduled_at', { ascending: false });
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            console.error('Get client bookings error:', error);
            throw error;
        }
    }
    /**
     * Get a therapist's bookings.
     */
    async getTherapistBookings(therapistId) {
        try {
            const { data, error } = await this.supabase
                .from('appointments')
                .select(`
          *,
          seeker:user_profiles!appointments_seeker_id_fkey(user_id, full_name, profile_image_url, preferred_name)
        `)
                .eq('therapist_id', therapistId)
                .order('scheduled_at', { ascending: true });
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            console.error('Get therapist bookings error:', error);
            throw error;
        }
    }
    /**
     * Cancel a booking.
     *
     * Note: This method does NOT handle refunds. Use the refund service for that.
     */
    async cancelBooking(sessionId, cancelledBy, reason) {
        try {
            const { data, error } = await this.supabase
                .from('appointments')
                .update({
                status: 'cancelled',
                session_data_json: {
                    cancellationReason: reason,
                    cancellationInitiatedBy: cancelledBy,
                    cancelledAt: new Date().toISOString(),
                },
            })
                .eq('id', sessionId)
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            console.error('Cancel booking error:', error);
            throw error;
        }
    }
    /**
     * Mark session as complete.
     */
    async completeSession(sessionId) {
        try {
            const { data, error } = await this.supabase
                .from('appointments')
                .update({ status: 'completed' })
                .eq('id', sessionId)
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            console.error('Complete session error:', error);
            throw error;
        }
    }
    /**
     * Get available time slots for a therapist within a window.
     *
     * Reads availability from user_profiles. The legacy free-form availability
     * pattern is now stored on user_profiles.profile_json (kept for back-compat
     * until the calendar_blocks rollout lands here).
     */
    async getAvailableSlots(therapistId, startDate, endDate) {
        try {
            const { data: profile } = await this.supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', therapistId)
                .maybeSingle();
            if (!profile)
                throw new Error('Therapist not found');
            // Availability pattern lives on user_profiles in the new schema; we
            // accept either a typed column or a legacy embedded object.
            const profileAny = profile;
            const availability = profileAny.availability ||
                profileAny.profile_json?.availability ||
                [];
            const sessionDuration = parseInt(String(profileAny.session_duration ||
                profileAny.profile_json?.sessionDuration ||
                '50'));
            const { data: bookedSessions } = await this.supabase
                .from('appointments')
                .select('scheduled_at, duration_minutes')
                .eq('therapist_id', therapistId)
                .in('status', ['scheduled', 'in_progress'])
                .gte('scheduled_at', startDate.toISOString())
                .lte('scheduled_at', endDate.toISOString());
            const bookedSlots = new Set(bookedSessions?.map((s) => new Date(s.scheduled_at).toISOString()) || []);
            const slots = [];
            const currentDate = new Date(startDate);
            while (currentDate <= endDate) {
                const dayOfWeek = currentDate.getDay();
                const dayAvailability = availability.find((a) => a.dayOfWeek === dayOfWeek);
                if (dayAvailability) {
                    const [startHour, startMinute] = dayAvailability.startTime
                        .split(':')
                        .map(Number);
                    const [endHour, endMinute] = dayAvailability.endTime.split(':').map(Number);
                    let slotTime = new Date(currentDate);
                    slotTime.setHours(startHour, startMinute, 0, 0);
                    const endTime = new Date(currentDate);
                    endTime.setHours(endHour, endMinute, 0, 0);
                    while (slotTime < endTime) {
                        if (slotTime > new Date() &&
                            !bookedSlots.has(slotTime.toISOString())) {
                            slots.push(new Date(slotTime));
                        }
                        slotTime = new Date(slotTime.getTime() + sessionDuration * 60000);
                    }
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }
            return slots;
        }
        catch (error) {
            console.error('Get available slots error:', error);
            throw error;
        }
    }
}
export const bookingService = new BookingService();
