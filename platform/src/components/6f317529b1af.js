import { NextResponse } from 'next/server';
import { requireRole } from '@/components/3168fa71d1e4';
import { uploadGroupMedia } from '@/components/9c80c27c5389';
export async function POST(request, { params }) {
    try {
        const { groupId } = await params;
        const auth = await requireRole('therapist');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const formData = await request.formData();
        const file = formData.get('file');
        const result = await uploadGroupMedia(auth.userId, groupId, file);
        if (!result.ok)
            return NextResponse.json({ error: result.error }, { status: result.status });
        return NextResponse.json(result.data, { status: 201 });
    }
    catch (err) {
        console.error('[api/community/groups/[groupId]/media] POST error', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
