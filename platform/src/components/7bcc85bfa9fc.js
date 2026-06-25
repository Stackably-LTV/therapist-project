import { NextResponse } from 'next/server';
import { resolvePostLoginPath } from '@/components/a7dd806bff4b';
export async function GET() {
    const result = await resolvePostLoginPath();
    if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result.data);
}
