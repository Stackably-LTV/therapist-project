import { NextResponse } from 'next/server';
import { requireRole, requireFeature } from '@/components/3168fa71d1e4';
import { createSessionInvite } from '@/components/baf9940df8b6';
export async function POST(request) {
    try {
        const auth = await requireRole('therapist');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const gate = await requireFeature(auth.userId, 'rtc_sessions');
        if (!gate.ok)
            return NextResponse.json({ error: gate.error }, { status: gate.status });
        const body = await request.json().catch(() => ({}));
        const result = await createSessionInvite(auth.userId, body);
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        return NextResponse.json(result.data, { status: result.status ?? 200 });
    }
    catch (error) {
        console.error('[api/chat/session-invites] POST error', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
