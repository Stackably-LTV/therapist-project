import { NextResponse } from 'next/server';
import { requireRole, requireFeature } from '@/components/3168fa71d1e4';
import { deleteAllCourses } from '@/components/bd2b831f136e';
export async function DELETE(_request) {
    try {
        const auth = await requireRole('therapist');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const gate = await requireFeature(auth.userId, 'course_creation');
        if (!gate.ok)
            return NextResponse.json({ error: gate.error }, { status: gate.status });
        const result = await deleteAllCourses(auth.userId);
        if (!result.ok)
            return NextResponse.json({ error: result.error }, { status: result.status });
        return NextResponse.json(result.data);
    }
    catch (err) {
        console.error('[api/therapist/courses/delete-all] DELETE error', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
