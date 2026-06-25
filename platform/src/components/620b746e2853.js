import { NextResponse } from 'next/server';
import { requireRole, requireFeature } from '@/components/3168fa71d1e4';
import { asOptionalString } from '@/components/95a1b355cb8b';
import { updateSession } from '@/components/28b926d5e37d';
export async function PATCH(request, { params }) {
    try {
        const auth = await requireRole('therapist');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const gate = await requireFeature(auth.userId, 'practice_management');
        if (!gate.ok)
            return NextResponse.json({ error: gate.error }, { status: gate.status });
        const { sessionId } = await params;
        const body = await request.json().catch(() => ({}));
        const result = await updateSession({
            therapistId: auth.userId,
            sessionId,
            scheduledAt: asOptionalString(body?.scheduledAt),
            durationMinutes: body?.durationMinutes,
            sessionType: asOptionalString(body?.sessionType),
            locationType: asOptionalString(body?.locationType),
            locationLabel: asOptionalString(body?.locationLabel),
            telehealthUrl: asOptionalString(body?.telehealthUrl),
            conflictOverrideReason: asOptionalString(body?.conflictOverrideReason),
        });
        if (!result.ok) {
            return NextResponse.json({ error: result.error, ...(result.data || {}) }, { status: result.status });
        }
        return NextResponse.json(result.data);
    }
    catch (err) {
        console.error('[api/therapist/sessions/:sessionId] PATCH error', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
