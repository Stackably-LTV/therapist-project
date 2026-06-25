import { NextResponse } from 'next/server';
import { createClient } from '@/components/9a6b39502e62';
import { resolveDocumentDownload } from '@/components/5c84b185b1ef';
export async function GET(request, { params }) {
    try {
        const supabase = await createClient();
        const { id } = await params;
        const { data: { user }, } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const inline = request.nextUrl.searchParams.get('inline') === '1';
        const result = await resolveDocumentDownload(user.id, id, inline);
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        const data = result.data;
        if (data.kind === 'redirect') {
            return NextResponse.redirect(data.url);
        }
        return new NextResponse(data.bytes, {
            headers: {
                'Content-Type': data.contentType,
                'Content-Disposition': `inline; filename="${data.fileName}"`,
                'Cache-Control': 'private, max-age=60',
            },
        });
    }
    catch (error) {
        console.error('Download error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
