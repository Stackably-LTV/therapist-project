import { NextResponse } from 'next/server';
import { requireRole, requireFeature } from '@/components/3168fa71d1e4';
import { getShareables } from '@/components/29527b14bdff';
export async function GET(request) {
    try {
        const auth = await requireRole('therapist');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const gate = await requireFeature(auth.userId, 'charts');
        if (!gate.ok)
            return NextResponse.json({ error: gate.error }, { status: gate.status });
        const recipientId = request.nextUrl.searchParams.get('recipientId')?.trim();
        if (!recipientId)
            return NextResponse.json({ error: 'recipientId is required' }, { status: 400 });
        const result = await getShareables(auth.userId, recipientId);
        return NextResponse.json(result.data);
    }
    catch (error) {
        console.error('[api/chat/shareables] GET error', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
