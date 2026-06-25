import { NextResponse } from 'next/server';
import { getUser } from '@/components/9a6b39502e62';
import { getBillingHistory } from '@/components/2e19256e3169';
export async function GET(_req) {
    const user = await getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const result = await getBillingHistory(user.id);
    if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result.data);
}
