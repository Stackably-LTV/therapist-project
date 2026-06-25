import { NextResponse } from 'next/server';
import { requireRole, requireFeature } from '@/components/3168fa71d1e4';
import { listCalendarBlocks, createCalendarBlock } from '@/components/4b8001e30053';
export async function GET(request) {
    try {
        const auth = await requireRole('therapist');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const gate = await requireFeature(auth.userId, 'practice_management');
        if (!gate.ok)
            return NextResponse.json({ error: gate.error }, { status: gate.status });
        const { searchParams } = new URL(request.url);
        const result = await listCalendarBlocks({
            therapistId: auth.userId,
            start: searchParams.get('start'),
            end: searchParams.get('end'),
        });
        if (!result.ok)
            return NextResponse.json({ error: result.error }, { status: result.status });
        return NextResponse.json(result.data);
    }
    catch (err) {
        console.error('[api/therapist/calendar/blocks] GET error', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
export async function POST(request) {
    try {
        const auth = await requireRole('therapist');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const gate = await requireFeature(auth.userId, 'practice_management');
        if (!gate.ok)
            return NextResponse.json({ error: gate.error }, { status: gate.status });
        const body = await request.json().catch(() => ({}));
        const result = await createCalendarBlock({ therapistId: auth.userId, body });
        if (!result.ok)
            return NextResponse.json({ error: result.error }, { status: result.status });
        return NextResponse.json(result.data, { status: 201 });
    }
    catch (err) {
        console.error('[api/therapist/calendar/blocks] POST error', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
