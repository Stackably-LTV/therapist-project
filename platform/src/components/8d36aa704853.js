import { NextResponse } from 'next/server';
import { requireRole } from '@/components/3168fa71d1e4';
import { cancelSeekerSession } from '@/components/f7f46174d1fc';
/**
 * POST /api/seeker/sessions/[sessionId]/cancel
 *
 * Cancel a session booking and process refund if applicable.
 * Seeker-only endpoint.
 */
export async function POST(_request, { params }) {
    try {
        const auth = await requireRole('seeker');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const { sessionId } = await params;
        const result = await cancelSeekerSession(auth.userId, sessionId);
        if (!result.ok)
            return NextResponse.json({ error: result.error }, { status: result.status });
        return NextResponse.json(result.data, { status: 200 });
    }
    catch (err) {
        console.error('[api/seeker/sessions/:sessionId/cancel] POST error', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
