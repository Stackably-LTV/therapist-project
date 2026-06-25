import { NextResponse } from 'next/server';
import { createClient } from '@/components/9a6b39502e62';
import { uploadProfileImage } from '@/components/cce769076aa0';
export async function POST(request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const formData = await request.formData();
        const file = formData.get('file');
        const result = await uploadProfileImage(user.id, file);
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        return NextResponse.json({ path: result.data.path, url: result.data.url });
    }
    catch (error) {
        console.error('Profile image upload error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
