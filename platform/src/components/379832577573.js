import { NextResponse } from 'next/server';
import { getUser } from '@/components/9a6b39502e62';
import { submitAssessment } from '@/components/bd2b831f136e';
export async function POST(request, { params }) {
    try {
        const { courseId, assessmentId } = await params;
        const user = await getUser();
        if (!user)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const body = await request.json();
        const answersRaw = body?.answers;
        const result = await submitAssessment(courseId, assessmentId, user.id, answersRaw);
        if (!result.ok)
            return NextResponse.json({ error: result.error }, { status: result.status });
        return NextResponse.json(result.data);
    }
    catch (err) {
        console.error('[api/courses/[courseId]/assessments/[assessmentId]/submit] POST error', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
