import { NextResponse } from 'next/server';
import { requireRole } from '@/components/3168fa71d1e4';
import { listGroupPosts, createGroupPost } from '@/components/9c80c27c5389';
export async function GET(_request, { params }) {
    try {
        const { groupId } = await params;
        const auth = await requireRole('therapist');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const result = await listGroupPosts(auth.userId, groupId);
        if (!result.ok)
            return NextResponse.json({ error: result.error }, { status: result.status });
        return NextResponse.json(result.data);
    }
    catch (err) {
        console.error('[api/community/groups/[groupId]/posts] GET error', err);
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
        const result = await createGroupPost(auth.userId, groupId, body);
        if (!result.ok)
            return NextResponse.json({ error: result.error }, { status: result.status });
        return NextResponse.json(result.data, { status: 201 });
    }
    catch (err) {
        console.error('[api/community/groups/[groupId]/posts] POST error', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
