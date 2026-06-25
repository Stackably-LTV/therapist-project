import { NextResponse } from 'next/server';
import { getUser } from '@/components/9a6b39502e62';
import { sendBookingEmails } from '@/components/6eecb4154eb8';
export async function POST(request) {
    try {
        const user = await getUser();
        if (!user)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const { sessionId } = await request.json();
        const result = await sendBookingEmails({ userId: user.id, sessionId });
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        return NextResponse.json(result.data);
    }
    catch (error) {
        console.error('Send booking emails error:', error);
        return NextResponse.json({ error: 'Failed to send emails', details: String(error) }, { status: 500 });
    }
}
