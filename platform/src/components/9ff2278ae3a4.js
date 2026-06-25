import { NextResponse } from 'next/server';
import { getUser } from '@/components/9a6b39502e62';
import { getCourseDetail } from '@/components/bd2b831f136e';
export async function GET(_request, { params }) {
    try {
        const { courseId } = await params;
        const user = await getUser();
        const result = await getCourseDetail(courseId, user?.id ?? null);
        if (!result.ok)
            return NextResponse.json({ error: result.error }, { status: result.status });
        return NextResponse.json(result.data);
    }
    catch (err) {
        console.error('[api/courses/[courseId]] error', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
