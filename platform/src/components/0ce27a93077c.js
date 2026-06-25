import { NextResponse } from 'next/server';
import { requireRole } from '@/components/3168fa71d1e4';
import { getTherapistAvailability } from '@/components/d4178f0142ac';
export async function GET(request, { params }) {
    try {
        const auth = await requireRole('seeker');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const { therapistId } = await params;
        const searchParams = request.nextUrl.searchParams;
        const result = await getTherapistAvailability({
            seekerId: auth.userId,
            therapistId,
            date: searchParams.get('date'),
            tzOffsetMinutesRaw: searchParams.get('tzOffsetMinutes'),
            startDateKey: searchParams.get('startDateKey'),
            endDateKey: searchParams.get('endDateKey'),
        });
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        return NextResponse.json(result.data);
    }
    catch (error) {
        console.error('Availability API error:', error);
        return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
    }
}
