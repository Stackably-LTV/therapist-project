import { NextResponse } from 'next/server';
import { requireRole, requireFeature } from '@/components/3168fa71d1e4';
import { createTreatmentPlanVersion } from '@/components/2f6bcc4feedf';
export async function POST(_request, { params }) {
    try {
        const auth = await requireRole('therapist');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const gate = await requireFeature(auth.userId, 'charts');
        if (!gate.ok)
            return NextResponse.json({ error: gate.error }, { status: gate.status });
        const { planId } = await params;
        const result = await createTreatmentPlanVersion(auth.userId, planId);
        if (!result.ok)
            return NextResponse.json({ error: result.error }, { status: result.status });
        return NextResponse.json(result.data, { status: 201 });
    }
    catch (err) {
        console.error('[api/therapist/treatment-plans/:planId/version] POST error', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
