import { NextResponse } from 'next/server';
import { requireRole } from '@/components/3168fa71d1e4';
import { getSeekerPersonalInfo, updateSeekerPersonalInfo } from '@/components/f7f46174d1fc';
export async function GET() {
    const auth = await requireRole('seeker');
    if (!auth.ok)
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    const result = await getSeekerPersonalInfo(auth.userId);
    if (!result.ok)
        return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result.data);
}
export async function PUT(request) {
    const auth = await requireRole('seeker');
    if (!auth.ok)
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    const body = (await request.json().catch(() => ({})));
    const result = await updateSeekerPersonalInfo(auth.userId, body);
    if (!result.ok)
        return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result.data);
}
