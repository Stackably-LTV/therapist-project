import { NextResponse } from 'next/server';
import { requireRole, requireFeature } from '@/components/3168fa71d1e4';
import { getPatientComment, updatePatientComment } from '@/components/7b4587d7473b';
export async function GET(_request, { params }) {
    try {
        const auth = await requireRole('therapist');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const gate = await requireFeature(auth.userId, 'charts');
        if (!gate.ok)
            return NextResponse.json({ error: gate.error }, { status: gate.status });
        const { patientId } = await params;
        const result = await getPatientComment(auth.userId, patientId);
        if (!result.ok)
            return NextResponse.json({ error: result.error }, { status: result.status });
        return NextResponse.json(result.data);
    }
    catch (err) {
        console.error('[patients/:patientId/comments] GET error', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
export async function PUT(request, { params }) {
    try {
        const auth = await requireRole('therapist');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const gate = await requireFeature(auth.userId, 'charts');
        if (!gate.ok)
            return NextResponse.json({ error: gate.error }, { status: gate.status });
        const { patientId } = await params;
        const body = await request.json().catch(() => ({}));
        const result = await updatePatientComment(auth.userId, patientId, body);
        if (!result.ok)
            return NextResponse.json({ error: result.error }, { status: result.status });
        return NextResponse.json(result.data);
    }
    catch (err) {
        console.error('[patients/:patientId/comments] PUT error', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
