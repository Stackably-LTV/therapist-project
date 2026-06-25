import { NextResponse } from 'next/server';
import { isCronAuthorized, runDueReminders } from '@/components/a22bc9d8cc4d';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;
export async function GET(req) {
    if (!isCronAuthorized(req.headers)) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    const result = await runDueReminders();
    return NextResponse.json(result);
}
export async function POST(req) {
    return GET(req);
}
