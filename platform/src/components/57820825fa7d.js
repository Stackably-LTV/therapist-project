import { NextResponse } from 'next/server';
import { requireRole } from '@/components/3168fa71d1e4';
import { unarchivePatient } from '@/components/7b4587d7473b';
export async function POST(_request, { params }) {
    try {
        const auth = await requireRole('therapist');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const { patientId } = await params;
        const result = await unarchivePatient(auth.userId, patientId);
        if (!result.ok)
            return NextResponse.json({ error: result.error }, { status: result.status });
        return NextResponse.json(result.data);
    }
    catch (err) {
        console.error('[patients/:patientId/unarchive] POST error', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
