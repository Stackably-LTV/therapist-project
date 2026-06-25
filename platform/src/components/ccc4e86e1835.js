import { NextResponse } from 'next/server';
import { requireRole, requireFeature } from '@/components/3168fa71d1e4';
import { listAssessments, createAssessment } from '@/components/bd2b831f136e';
export async function GET(_request, { params }) {
    try {
        const { courseId, lessonId } = await params;
        const auth = await requireRole('therapist');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const gate = await requireFeature(auth.userId, 'course_creation');
        if (!gate.ok)
            return NextResponse.json({ error: gate.error }, { status: gate.status });
        const result = await listAssessments(courseId, lessonId, auth.userId);
        if (!result.ok)
            return NextResponse.json({ error: result.error }, { status: result.status });
        return NextResponse.json(result.data);
    }
    catch (err) {
        console.error('[api/therapist/courses/.../assessments] GET error', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
export async function POST(request, { params }) {
    try {
        const { courseId, lessonId } = await params;
        const auth = await requireRole('therapist');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const gate = await requireFeature(auth.userId, 'course_creation');
        if (!gate.ok)
            return NextResponse.json({ error: gate.error }, { status: gate.status });
        const body = await request.json();
        const result = await createAssessment(courseId, lessonId, auth.userId, body);
        if (!result.ok)
            return NextResponse.json({ error: result.error }, { status: result.status });
        return NextResponse.json(result.data, { status: 201 });
    }
    catch (err) {
        console.error('[api/therapist/courses/.../assessments] POST error', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
