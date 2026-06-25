import { NextResponse } from 'next/server';
import { getUser } from '@/components/9a6b39502e62';
import { listPublishedCourses } from '@/components/bd2b831f136e';
export async function GET(request) {
    try {
        const user = await getUser();
        if (!user)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const { searchParams } = new URL(request.url);
        const q = searchParams.get('q') || '';
        const limit = Number.parseInt(searchParams.get('limit') || '50', 10);
        const result = await listPublishedCourses(q, limit);
        if (!result.ok)
            return NextResponse.json({ error: result.error }, { status: result.status });
        return NextResponse.json(result.data);
    }
    catch (err) {
        console.error('[api/courses] error', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
