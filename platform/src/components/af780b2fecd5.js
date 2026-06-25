import { NextResponse } from 'next/server';
import { requireRole, requireFeature } from '@/components/3168fa71d1e4';
import { getRequestIP, getRequestUserAgent } from '@/components/0be57ea0c568';
import { asOptionalString } from '@/components/95a1b355cb8b';
import { signSessionNote } from '@/components/64f7e8e71960';
export async function POST(request, { params }) {
    try {
        const auth = await requireRole('therapist');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const gate = await requireFeature(auth.userId, 'session_notes');
        if (!gate.ok)
            return NextResponse.json({ error: gate.error }, { status: gate.status });
        const { sessionId } = await params;
        const body = await request.json().catch(() => ({}));
        const result = await signSessionNote({
            therapistId: auth.userId,
            sessionId,
            noteType: body?.noteType,
            signatureMethod: asOptionalString(body?.signatureMethod),
            signatureDataUrl: typeof body?.signatureDataUrl === 'string' ? body.signatureDataUrl : null,
            ipAddress: getRequestIP(request.headers),
            userAgent: getRequestUserAgent(request.headers),
        });
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        return NextResponse.json(result.data);
    }
    catch (err) {
        console.error('[api/therapist/sessions/:sessionId/notes/sign] POST error', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
