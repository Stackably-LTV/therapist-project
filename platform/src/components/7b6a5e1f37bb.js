import { NextResponse } from 'next/server';
import { requireRole } from '@/components/3168fa71d1e4';
import { validateResponses } from '@/components/03f345984aa7';
import { createCancellationRequest } from '@/components/4c1649935362';
export async function POST(request) {
    try {
        const auth = await requireRole('therapist');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        let body;
        try {
            body = await request.json();
        }
        catch {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }
        const responses = body?.responses;
        const validation = validateResponses(responses);
        if (!validation.ok) {
            return NextResponse.json({ error: 'Please complete every required question.', details: validation.errors }, { status: 400 });
        }
        const result = await createCancellationRequest(auth.userId, validation.responses);
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        return NextResponse.json(result.data, { status: 201 });
    }
    catch (error) {
        console.error('Cancellation request error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
