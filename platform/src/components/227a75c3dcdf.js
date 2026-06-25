import { NextResponse } from 'next/server';
import { requireRole } from '@/components/3168fa71d1e4';
import { removeSeekerTherapist } from '@/components/f7f46174d1fc';
export async function DELETE(_request, { params }) {
    try {
        const auth = await requireRole('seeker');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const { therapistId } = await params;
        const result = await removeSeekerTherapist(auth.userId, therapistId);
        if (!result.ok)
            return NextResponse.json({ error: result.error }, { status: result.status });
        return NextResponse.json(result.data);
    }
    catch (err) {
        console.error('[api/seeker/therapists/:therapistId] DELETE error', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
