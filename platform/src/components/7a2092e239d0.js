import { NextResponse } from 'next/server';
import { createClient } from '@/components/9a6b39502e62';
import { uploadCredentials } from '@/components/4a9cade36e09';
export async function POST(request) {
    try {
        const supabase = await createClient();
        // Keep Supabase for authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const formData = await request.formData();
        const files = formData.getAll('files');
        const kinds = formData.getAll('kinds');
        const result = await uploadCredentials(user.id, files, kinds);
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        const { paths, warnings } = result.data;
        if (warnings.length > 0) {
            return NextResponse.json({
                paths,
                warnings,
                message: `Uploaded ${paths.length} file(s) successfully. ${warnings.length} warning(s): ${warnings.join('; ')}`
            }, { status: 207 } // Multi-Status
            );
        }
        return NextResponse.json({ paths });
    }
    catch (error) {
        console.error('Storage upload error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
