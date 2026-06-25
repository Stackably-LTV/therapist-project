import { NextResponse } from 'next/server';
import { requireRole } from '@/components/3168fa71d1e4';
import { discoverGroups, discoverGroupsParamsSchema } from '@/components/9c80c27c5389';
export async function GET(request) {
    try {
        const auth = await requireRole('therapist');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const { searchParams } = new URL(request.url);
        const params = discoverGroupsParamsSchema.parse({
            q: (searchParams.get('q') || '').trim(),
            popularLimit: searchParams.get('popularLimit') || '12',
            suggestionsLimit: searchParams.get('suggestionsLimit') || '40',
        });
        const result = await discoverGroups(auth.userId, params);
        if (!result.ok)
            return NextResponse.json({ error: result.error }, { status: result.status });
        return NextResponse.json(result.data);
    }
    catch (err) {
        console.error('[api/community/groups/discover] error', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
