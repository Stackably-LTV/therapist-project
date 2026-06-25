import { NextResponse } from 'next/server';
import { acceptPatientInvite } from '@/components/7b4587d7473b';
export async function GET(request) {
    const token = request.nextUrl.searchParams.get('token') ?? '';
    const { redirectTo } = await acceptPatientInvite(token);
    return NextResponse.redirect(redirectTo);
}
