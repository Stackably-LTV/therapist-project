import { NextResponse } from 'next/server';
import { requireRole } from '@/components/3168fa71d1e4';
import { respondToSessionInvite } from '@/components/baf9940df8b6';
export async function POST(request, { params }) {
    try {
        const auth = await requireRole('seeker');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const { sessionId } = await params;
        const body = await request.json().catch(() => ({}));
        const result = await respondToSessionInvite(auth.userId, sessionId, body);
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        return NextResponse.json(result.data);
    }
    catch (error) {
        console.error('[api/chat/session-invites/:sessionId/respond] POST error', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
