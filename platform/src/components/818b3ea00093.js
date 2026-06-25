import { NextResponse } from 'next/server';
import { requireRole, requireFeature } from '@/components/3168fa71d1e4';
import { cancelSession } from '@/components/28b926d5e37d';
/**
 * POST /api/therapist/sessions/[sessionId]/cancel
 *
 * Cancel a session booking and process refund if applicable.
 * Therapist-only endpoint. Requires practice_management feature.
 */
export async function POST(request, { params }) {
    try {
        const auth = await requireRole('therapist');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const gate = await requireFeature(auth.userId, 'practice_management');
        if (!gate.ok)
            return NextResponse.json({ error: gate.error }, { status: gate.status });
        const { sessionId } = await params;
        const body = await request.json().catch(() => ({}));
        const reason = typeof body.reason === 'string' ? body.reason.trim() : undefined;
        const result = await cancelSession({ therapistId: auth.userId, sessionId, reason });
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        return NextResponse.json(result.data, { status: 200 });
    }
    catch (err) {
        console.error('[api/therapist/sessions/:sessionId/cancel] POST error', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
