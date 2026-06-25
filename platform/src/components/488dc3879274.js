import { NextResponse } from 'next/server';
import { requireRole } from '@/components/3168fa71d1e4';
import { getRequestIP, getRequestUserAgent } from '@/components/0be57ea0c568';
import { updateUserStatus } from '@/components/2e4a3de82fed';
export async function PATCH(request, { params }) {
    try {
        const { userId } = await params;
        const auth = await requireRole('admin');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const { status, reason } = await request.json();
        const result = await updateUserStatus(auth.userId, userId, status, reason, {
            ipAddress: getRequestIP(request.headers),
            userAgent: getRequestUserAgent(request.headers),
        });
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        if (result.data?.deleted) {
            return NextResponse.json({ success: true, deleted: true });
        }
        return NextResponse.json({ success: true, user: result.data.user });
    }
    catch (error) {
        console.error('User status update error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
