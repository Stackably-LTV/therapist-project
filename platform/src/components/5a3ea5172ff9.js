import { NextResponse } from 'next/server';
import { requireRole } from '@/components/3168fa71d1e4';
import { createBooking } from '@/components/a643cf4b10f0';
export async function POST(request) {
    try {
        const auth = await requireRole('seeker');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const body = await request.json();
        const { therapistId, scheduledAt, durationMinutes, sessionDataJson, tzOffsetMinutes } = body;
        const result = await createBooking({
            seekerId: auth.userId,
            origin: request.nextUrl.origin,
            therapistId,
            scheduledAt,
            durationMinutes,
            sessionDataJson,
            tzOffsetMinutes,
        });
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        return NextResponse.json(result.data);
    }
    catch (error) {
        console.error('Booking creation error:', error);
        return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
    }
}
