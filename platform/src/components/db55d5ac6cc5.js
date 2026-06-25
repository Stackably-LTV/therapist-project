import { NextResponse } from 'next/server';
import { requireRole, requireFeature } from '@/components/3168fa71d1e4';
import { endVideoCall } from '@/components/89fb79bece1b';
export async function POST(request) {
    try {
        const auth = await requireRole('therapist');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const gate = await requireFeature(auth.userId, 'rtc_sessions');
        if (!gate.ok)
            return NextResponse.json({ error: gate.error }, { status: gate.status });
        const body = await request.json().catch(() => ({}));
        const result = await endVideoCall(auth.userId, body);
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        return NextResponse.json(result.data);
    }
    catch (error) {
        console.error('[api/chat/video-call/end] POST error', error);
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
