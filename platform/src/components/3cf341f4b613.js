import { NextResponse } from 'next/server';
import { getUser } from '@/components/9a6b39502e62';
import { getSessionRecordingUrl } from '@/components/787557937147';
export async function GET(_request, { params }) {
    try {
        const { sessionId } = await params;
        const user = await getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const result = await getSessionRecordingUrl({ userId: user.id, sessionId });
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        return NextResponse.redirect(result.data.signedUrl);
    }
    catch (error) {
        console.error('Recording download error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
