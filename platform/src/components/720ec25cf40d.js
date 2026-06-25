import { NextResponse } from 'next/server';
import { sendPasswordResetEmail } from '@/components/536bc6b8a652';
export async function POST(request) {
    try {
        const { email } = await request.json();
        if (!email || typeof email !== 'string') {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }
        const result = await sendPasswordResetEmail(email);
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        return NextResponse.json(result.data);
    }
    catch (error) {
        console.error('Password reset error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
