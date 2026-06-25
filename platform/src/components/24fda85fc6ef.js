import { NextResponse } from 'next/server';
import { signOutUser } from '@/components/db45141a9654';
export async function POST(request) {
    await signOutUser();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.url;
    return NextResponse.redirect(new URL('/', baseUrl));
}
