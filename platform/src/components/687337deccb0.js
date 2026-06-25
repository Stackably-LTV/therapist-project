import { NextResponse } from 'next/server';
import { requireRole, requireFeature } from '@/components/3168fa71d1e4';
import { listPatientTreatmentPlans, createPatientTreatmentPlan } from '@/components/7b4587d7473b';
export async function GET(_request, { params }) {
    try {
        const auth = await requireRole('therapist');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const gate = await requireFeature(auth.userId, 'charts');
        if (!gate.ok)
            return NextResponse.json({ error: gate.error }, { status: gate.status });
        const { patientId } = await params;
        const result = await listPatientTreatmentPlans(auth.userId, patientId);
        if (!result.ok)
            return NextResponse.json({ error: result.error }, { status: result.status });
        return NextResponse.json(result.data);
    }
    catch (err) {
        console.error('[patients/:patientId/treatment-plans] GET error', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
export async function POST(request, { params }) {
    try {
        const auth = await requireRole('therapist');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const gate = await requireFeature(auth.userId, 'charts');
        if (!gate.ok)
            return NextResponse.json({ error: gate.error }, { status: gate.status });
        const { patientId } = await params;
        const body = await request.json().catch(() => ({}));
        const result = await createPatientTreatmentPlan(auth.userId, patientId, body);
        if (!result.ok)
            return NextResponse.json({ error: result.error }, { status: result.status });
        return NextResponse.json(result.data, result.status ? { status: result.status } : undefined);
    }
    catch (err) {
        console.error('[patients/:patientId/treatment-plans] POST error', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
