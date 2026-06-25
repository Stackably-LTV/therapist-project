import { NextResponse } from 'next/server';
import { requireRole } from '@/components/3168fa71d1e4';
import { getRequestIP, getRequestUserAgent } from '@/components/0be57ea0c568';
import { createCredentialSignedUrl } from '@/components/5634ef3e1736';
export async function POST(request) {
    try {
        const auth = await requireRole('admin');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const body = (await request.json().catch(() => null));
        const result = await createCredentialSignedUrl(auth.userId, body?.path ?? '', {
            ipAddress: getRequestIP(request.headers),
            userAgent: getRequestUserAgent(request.headers),
        });
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        return NextResponse.json({ signedUrl: result.data.signedUrl });
    }
    catch (error) {
        console.error('[AdminCredentialsSignedUrl] error', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
