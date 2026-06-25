import { NextResponse } from 'next/server';
import { getUser } from '@/components/9a6b39502e62';
import { getLessonDetail } from '@/components/bd2b831f136e';
export async function GET(_request, { params }) {
    try {
        const { courseId, lessonId } = await params;
        const user = await getUser();
        if (!user)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const result = await getLessonDetail(courseId, lessonId);
        if (!result.ok)
            return NextResponse.json({ error: result.error }, { status: result.status });
        return NextResponse.json(result.data);
    }
    catch (err) {
        console.error('[api/courses/[courseId]/lessons/[lessonId]] GET error', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
