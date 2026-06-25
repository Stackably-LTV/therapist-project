import { NextResponse } from 'next/server';
import { createClient } from '@/components/9a6b39502e62';
import { handleAttachment } from '@/components/bb47dd7e98ef';
export async function POST(request) {
    try {
        const supabase = await createClient();
        const { data: { user }, } = await supabase.auth.getUser();
        if (!user)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const body = await request.json().catch(() => ({}));
        const result = await handleAttachment(user.id, body);
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        return NextResponse.json(result.data, { status: result.status ?? 200 });
    }
    catch (error) {
        console.error('[api/chat/attachments] POST error', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
