import { NextResponse } from 'next/server';
import { requireRole, requireFeature } from '@/components/3168fa71d1e4';
import { updateCalendarBlock, deleteCalendarBlock } from '@/components/4b8001e30053';
export async function PUT(request, { params }) {
    try {
        const auth = await requireRole('therapist');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const gate = await requireFeature(auth.userId, 'practice_management');
        if (!gate.ok)
            return NextResponse.json({ error: gate.error }, { status: gate.status });
        const { blockId } = await params;
        const body = await request.json().catch(() => ({}));
        const result = await updateCalendarBlock({ therapistId: auth.userId, blockId, body });
        if (!result.ok)
            return NextResponse.json({ error: result.error }, { status: result.status });
        return NextResponse.json(result.data);
    }
    catch (err) {
        console.error('[api/therapist/calendar/blocks/:blockId] PUT error', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
export async function DELETE(_request, { params }) {
    try {
        const auth = await requireRole('therapist');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const gate = await requireFeature(auth.userId, 'practice_management');
        if (!gate.ok)
            return NextResponse.json({ error: gate.error }, { status: gate.status });
        const { blockId } = await params;
        const result = await deleteCalendarBlock({ therapistId: auth.userId, blockId });
        if (!result.ok)
            return NextResponse.json({ error: result.error }, { status: result.status });
        return NextResponse.json(result.data);
    }
    catch (err) {
        console.error('[api/therapist/calendar/blocks/:blockId] DELETE error', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
