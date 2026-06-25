import { NextResponse } from 'next/server';
import { requireRole } from '@/components/3168fa71d1e4';
import { checkoutCourse } from '@/components/bd2b831f136e';
export async function POST(request, { params }) {
    try {
        const { courseId } = await params;
        const auth = await requireRole('seeker');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
        const result = await checkoutCourse(courseId, auth.userId, appUrl);
        if (!result.ok)
            return NextResponse.json({ error: result.error }, { status: result.status });
        return NextResponse.json(result.data);
    }
    catch (error) {
        console.error('[api/courses/[courseId]/checkout] error', error);
        return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 });
    }
}
