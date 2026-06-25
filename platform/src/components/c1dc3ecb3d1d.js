import { NextResponse } from 'next/server';
import { getUser } from '@/components/9a6b39502e62';
import { issueSessionToken } from '@/components/787557937147';
export async function POST(_req, { params }) {
    const { sessionId } = await params;
    const user = await getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const result = await issueSessionToken({ userId: user.id, sessionId });
    if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result.data);
}
