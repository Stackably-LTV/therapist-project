import { NextResponse } from 'next/server';
import { createClient } from '@/components/9a6b39502e62';
import { uploadCommunityCover } from '@/components/9b425d9de250';
export async function POST(request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError, } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const formData = await request.formData();
        const file = formData.get('file');
        const result = await uploadCommunityCover(user.id, file);
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        return NextResponse.json({ path: result.data.path, url: result.data.url });
    }
    catch (error) {
        console.error('[upload-community-cover]', error);
        const msg = error instanceof Error ? error.message : 'Upload failed';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
