import { NextResponse } from 'next/server';
import { createClient } from '@/components/9a6b39502e62';
import { markMessagesRead } from '@/components/b11fe24fc293';
export async function POST(request) {
    try {
        const supabase = await createClient();
        const { data: { user }, } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const body = await request.json();
        const { senderId } = body;
        if (!senderId) {
            return NextResponse.json({ error: 'Sender ID is required' }, { status: 400 });
        }
        const result = await markMessagesRead(user.id, senderId);
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        return NextResponse.json(result.data);
    }
    catch (error) {
        console.error('Mark as read API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
