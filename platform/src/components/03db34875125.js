import { NextResponse } from 'next/server';
import { getUser } from '@/components/9a6b39502e62';
import { updateTaskStatus } from '@/components/9894497ebaad';
export async function POST(request) {
    try {
        const user = await getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const contentType = request.headers.get('content-type') || '';
        let taskId = '';
        let status = null;
        let redirectTo = '/login';
        if (contentType.includes('application/json')) {
            const body = await request.json().catch(() => ({}));
            taskId = String(body?.taskId || '').trim();
            status = String(body?.status || '').trim().toLowerCase();
            redirectTo = String(body?.redirectTo || '/login');
        }
        else {
            const formData = await request.formData();
            taskId = String(formData.get('taskId') || '').trim();
            status = String(formData.get('status') || '').trim().toLowerCase();
            redirectTo = String(formData.get('redirectTo') || '/login');
        }
        const result = await updateTaskStatus(user.id, taskId, status);
        if (!result.ok)
            return NextResponse.json({ error: result.error }, { status: result.status });
        if (contentType.includes('application/json')) {
            return NextResponse.json({ success: true });
        }
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.url;
        return NextResponse.redirect(new URL(redirectTo, baseUrl));
    }
    catch (error) {
        console.error('[api/tasks/update-status] error', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
