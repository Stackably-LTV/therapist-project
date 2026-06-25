import { NextResponse } from 'next/server';
import { getUser } from '@/components/9a6b39502e62';
import { getLessonAssetSignedUrl } from '@/components/bd2b831f136e';
export async function GET(request, { params }) {
    try {
        const { courseId, lessonId } = await params;
        const user = await getUser();
        if (!user)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const storagePathRaw = request.nextUrl.searchParams.get('path');
        const result = await getLessonAssetSignedUrl(courseId, lessonId, storagePathRaw);
        if (!result.ok)
            return NextResponse.json({ error: result.error }, { status: result.status });
        return NextResponse.redirect(result.data.signedUrl);
    }
    catch (err) {
        console.error('[api/courses/[courseId]/lessons/[lessonId]/asset] error', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
