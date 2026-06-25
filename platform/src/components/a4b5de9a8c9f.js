import { NextResponse } from 'next/server';
import { handleAuthCallback } from '@/components/b68a57010b48';
export async function GET(request) {
    const requestUrl = new URL(request.url);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin;
    const code = requestUrl.searchParams.get('code');
    const token_hash = requestUrl.searchParams.get('token_hash');
    const token = requestUrl.searchParams.get('token');
    const type = requestUrl.searchParams.get('type');
    const nextRaw = requestUrl.searchParams.get('next') || '/login';
    const next = nextRaw.startsWith('/') ? nextRaw : '/login';
    const result = await handleAuthCallback({
        baseUrl,
        code,
        token_hash,
        token,
        type,
        next,
    });
    return NextResponse.redirect(result.data.redirectUrl);
}
