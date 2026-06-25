import { NextResponse } from 'next/server';
import { requireRole, requireFeature } from '@/components/3168fa71d1e4';
import { asOptionalString } from '@/components/95a1b355cb8b';
import { createSession } from '@/components/28b926d5e37d';
export async function POST(request) {
    try {
        const auth = await requireRole('therapist');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const gate = await requireFeature(auth.userId, 'practice_management');
        if (!gate.ok)
            return NextResponse.json({ error: gate.error }, { status: gate.status });
        const body = await request.json().catch(() => ({}));
        const result = await createSession({
            therapistId: auth.userId,
            origin: request.nextUrl.origin,
            seekerId: asOptionalString(body?.patientId) ?? asOptionalString(body?.seekerId),
            scheduledAtRaw: asOptionalString(body?.scheduledAt),
            durationMinutes: Number(body?.durationMinutes),
            sessionType: asOptionalString(body?.sessionType) ?? 'therapy',
            locationType: asOptionalString(body?.locationType) ?? 'telehealth',
            locationLabel: asOptionalString(body?.locationLabel),
            telehealthUrl: asOptionalString(body?.telehealthUrl),
            conflictOverrideReason: asOptionalString(body?.conflictOverrideReason),
        });
        if (!result.ok) {
            return NextResponse.json({ error: result.error, ...(result.data || {}) }, { status: result.status });
        }
        return NextResponse.json(result.data, { status: 201 });
    }
    catch (err) {
        console.error('[api/therapist/sessions] POST error', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
