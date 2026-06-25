import { NextResponse } from 'next/server';
import { requireRole } from '@/components/3168fa71d1e4';
import { deletePost } from '@/components/9c80c27c5389';
export async function DELETE(_request, { params }) {
    try {
        const { postId } = await params;
        const auth = await requireRole('therapist');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const result = await deletePost(auth.userId, postId);
        if (!result.ok)
            return NextResponse.json({ error: result.error }, { status: result.status });
        return NextResponse.json(result.data);
    }
    catch (err) {
        console.error('[api/community/posts/[postId]] DELETE error', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
