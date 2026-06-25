import { NextResponse } from 'next/server';
import { requireRole } from '@/components/3168fa71d1e4';
import { listUsers, parseListUsersParams } from '@/components/2e4a3de82fed';
export async function GET(request) {
    try {
        const auth = await requireRole('admin');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const params = parseListUsersParams(request.nextUrl.searchParams);
        const result = await listUsers(params);
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        return NextResponse.json(result.data);
    }
    catch (error) {
        console.error('User search error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
