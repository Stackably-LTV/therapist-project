import { NextResponse } from 'next/server';
import { lookupZipCode } from '@/components/83289adef28b';
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const zip = searchParams.get('zip');
    const result = await lookupZipCode(zip);
    if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result.data);
}
