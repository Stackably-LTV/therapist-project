import { NextResponse } from 'next/server';
import { requireRole } from '@/components/3168fa71d1e4';
import { getSeekerTreatmentPlanAttachments } from '@/components/f7f46174d1fc';
export async function GET(_request, { params }) {
    try {
        const auth = await requireRole('seeker');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const { planId } = await params;
        const result = await getSeekerTreatmentPlanAttachments(auth.userId, planId);
        if (!result.ok)
            return NextResponse.json({ error: result.error }, { status: result.status });
        return NextResponse.json(result.data);
    }
    catch (err) {
        console.error('[api/seeker/treatment-plans/:planId/attachments] GET error', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
