import { NextResponse } from 'next/server';
import { createClient } from '@/components/9a6b39502e62';
import { getConversationMessages } from '@/components/b11fe24fc293';
export async function GET(_request, { params }) {
    try {
        const supabase = await createClient();
        const { data: { user }, } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { userId } = await params;
        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }
        const result = await getConversationMessages(user.id, userId);
        return NextResponse.json(result.data);
    }
    catch (error) {
        console.error('Get messages API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
