import { NextResponse } from 'next/server';
import { createClient } from '@/components/9a6b39502e62';
import { getConversations } from '@/components/b11fe24fc293';
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const result = await getConversations(user.id);
        return NextResponse.json(result.data);
    }
    catch (error) {
        console.error('Get conversations API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
