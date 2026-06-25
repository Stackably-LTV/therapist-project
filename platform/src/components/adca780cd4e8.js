import { NextResponse } from 'next/server';
import { getUser } from '@/components/9a6b39502e62';
import { addTask, parseAddTaskBody } from '@/components/9894497ebaad';
export async function POST(request) {
    try {
        const user = await getUser();
        if (!user)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const body = await request.json().catch(() => ({}));
        const input = parseAddTaskBody(body);
        const result = await addTask(user.id, input);
        if (!result.ok)
            return NextResponse.json({ error: result.error }, { status: result.status });
        return NextResponse.json({
            success: true,
            task: result.data.task,
            messageId: result.data.messageId,
        });
    }
    catch (err) {
        console.error('[api/tasks/add] error', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
