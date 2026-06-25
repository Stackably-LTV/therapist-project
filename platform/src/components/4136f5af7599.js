import { NextResponse } from 'next/server';
import { createClient } from '@/components/9a6b39502e62';
import { sendMessage } from '@/components/b11fe24fc293';
export async function POST(request) {
    try {
        const supabase = await createClient();
        const body = await request.json();
        const { recipientId } = body;
        const content = String(body?.content || '');
        if (!recipientId || !content) {
            return NextResponse.json({ error: 'Recipient ID and content are required' }, { status: 400 });
        }
        if (content.trim().length === 0) {
            return NextResponse.json({ error: 'Message content cannot be empty' }, { status: 400 });
        }
        const { data: { user }, } = await supabase.auth.getUser();
        if (!user)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const result = await sendMessage(user.id, recipientId, content);
        if (!result.ok) {
            const extra = result;
            const payload = { error: result.error };
            if ('code' in extra && extra.code !== undefined)
                payload.code = extra.code;
            if ('details' in extra && extra.details !== undefined)
                payload.details = extra.details;
            if ('hint' in extra && extra.hint !== undefined)
                payload.hint = extra.hint;
            return NextResponse.json(payload, { status: result.status });
        }
        return NextResponse.json(result.data);
    }
    catch (error) {
        console.error('Send message API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
