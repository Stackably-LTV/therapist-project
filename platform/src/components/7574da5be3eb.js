import { NextResponse } from 'next/server';
import { createClient } from '@/components/9a6b39502e62';
import { getSharedFiles } from '@/components/702d31c57c22';
export async function GET(request) {
    try {
        const withUserId = request.nextUrl.searchParams.get('withUserId')?.trim();
        if (!withUserId) {
            return NextResponse.json({ error: 'withUserId is required' }, { status: 400 });
        }
        const supabase = await createClient();
        const { data: { user }, } = await supabase.auth.getUser();
        if (!user)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const result = await getSharedFiles(user.id, withUserId);
        return NextResponse.json(result.data);
    }
    catch (err) {
        console.error('[api/chat/shared-files] GET error', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
