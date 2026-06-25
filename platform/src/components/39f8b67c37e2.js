import { NextResponse } from 'next/server';
import { requireRole, requireFeature } from '@/components/3168fa71d1e4';
import { asOptionalString } from '@/components/95a1b355cb8b';
import { createAdHocSession } from '@/components/28b926d5e37d';
export async function POST(request) {
    try {
        const auth = await requireRole('therapist');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const gate = await requireFeature(auth.userId, 'rtc_sessions');
        if (!gate.ok)
            return NextResponse.json({ error: gate.error }, { status: gate.status });
        const body = await request.json().catch(() => ({}));
        const result = await createAdHocSession({
            therapistId: auth.userId,
            seekerId: asOptionalString(body?.patientId) ?? asOptionalString(body?.seekerId),
            durationMinutes: body?.durationMinutes ?? 60,
        });
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        return NextResponse.json(result.data, { status: 201 });
    }
    catch (error) {
        console.error('[api/therapist/sessions/ad-hoc] POST error', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
