import { NextResponse } from 'next/server';
import { requireRole } from '@/components/3168fa71d1e4';
import { listGroupMessages, createGroupMessage } from '@/components/9c80c27c5389';
export async function GET(request, { params }) {
    try {
        const { groupId } = await params;
        const auth = await requireRole('therapist');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const { searchParams } = new URL(request.url);
        const limit = Number.parseInt(searchParams.get('limit') || '50', 10);
        const result = await listGroupMessages(auth.userId, groupId, limit);
        if (!result.ok)
            return NextResponse.json({ error: result.error }, { status: result.status });
        return NextResponse.json(result.data);
    }
    catch (err) {
        console.error('[api/community/groups/[groupId]/messages] GET error', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
export async function POST(request, { params }) {
    try {
        const { groupId } = await params;
        const auth = await requireRole('therapist');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const body = await request.json();
        const result = await createGroupMessage(auth.userId, groupId, body);
        if (!result.ok)
            return NextResponse.json({ error: result.error }, { status: result.status });
        return NextResponse.json(result.data, { status: 201 });
    }
    catch (err) {
        console.error('[api/community/groups/[groupId]/messages] POST error', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
