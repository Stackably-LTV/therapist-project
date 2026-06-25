import { NextResponse } from 'next/server';
import { requireRole, requireFeature } from '@/components/3168fa71d1e4';
import { listAssignments, createAssignment } from '@/components/bd2b831f136e';
export async function GET(_request, { params }) {
    try {
        const { courseId } = await params;
        const auth = await requireRole('therapist');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const gate = await requireFeature(auth.userId, 'course_creation');
        if (!gate.ok)
            return NextResponse.json({ error: gate.error }, { status: gate.status });
        const result = await listAssignments(courseId, auth.userId);
        if (!result.ok)
            return NextResponse.json({ error: result.error }, { status: result.status });
        return NextResponse.json(result.data);
    }
    catch (err) {
        console.error('[api/therapist/courses/[courseId]/assignments] GET error', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
export async function POST(request, { params }) {
    try {
        const { courseId } = await params;
        const auth = await requireRole('therapist');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const gate = await requireFeature(auth.userId, 'course_creation');
        if (!gate.ok)
            return NextResponse.json({ error: gate.error }, { status: gate.status });
        const body = await request.json().catch(() => ({}));
        const result = await createAssignment(courseId, auth.userId, body);
        if (!result.ok)
            return NextResponse.json({ error: result.error }, { status: result.status });
        return NextResponse.json(result.data, { status: 201 });
    }
    catch (err) {
        console.error('[api/therapist/courses/[courseId]/assignments] POST error', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
