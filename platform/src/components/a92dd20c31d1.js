import { NextResponse } from 'next/server';
import { createClient } from '@/components/9a6b39502e62';
import { getActiveVideoCall } from '@/components/89fb79bece1b';
function asOptionalString(v) {
    if (typeof v !== 'string')
        return null;
    const s = v.trim();
    return s.length ? s : null;
}
export async function GET(request) {
    try {
        const supabase = await createClient();
        const { data: { user }, } = await supabase.auth.getUser();
        if (!user)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const recipientId = asOptionalString(request.nextUrl.searchParams.get('recipientId'));
        if (!recipientId)
            return NextResponse.json({ error: 'recipientId is required' }, { status: 400 });
        const result = await getActiveVideoCall(user.id, recipientId);
        return NextResponse.json(result.data);
    }
    catch (error) {
        console.error('[api/chat/video-call/active] GET error', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
