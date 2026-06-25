import { NextResponse } from 'next/server';
import { requireRole, requireFeature } from '@/components/3168fa71d1e4';
import { getSessionNotes, saveSessionNotes } from '@/components/64f7e8e71960';
export async function GET(_request, { params }) {
    try {
        const auth = await requireRole('therapist');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const gate = await requireFeature(auth.userId, 'session_notes');
        if (!gate.ok)
            return NextResponse.json({ error: gate.error }, { status: gate.status });
        const { sessionId } = await params;
        const result = await getSessionNotes({ therapistId: auth.userId, sessionId });
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        return NextResponse.json(result.data);
    }
    catch (error) {
        console.error('Get session notes API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
export async function PUT(request, { params }) {
    try {
        const auth = await requireRole('therapist');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const gate = await requireFeature(auth.userId, 'session_notes');
        if (!gate.ok)
            return NextResponse.json({ error: gate.error }, { status: gate.status });
        const { sessionId } = await params;
        const body = (await request.json());
        const result = await saveSessionNotes({
            therapistId: auth.userId,
            sessionId,
            notes: body?.notes,
            noteType: body?.noteType,
        });
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        return NextResponse.json(result.data);
    }
    catch (error) {
        console.error('Update session notes API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
