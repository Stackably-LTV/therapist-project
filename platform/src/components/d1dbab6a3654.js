import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getUser } from '@/components/9a6b39502e62';
import { createConsultationRequestSchema } from '@/components/8cb29cb938f6';
import { createConsultationRequest } from '@/components/d6f403b8fbcb';
export async function POST(request) {
    try {
        const user = await getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        let body;
        try {
            body = await request.json();
        }
        catch (e) {
            if (e instanceof SyntaxError) {
                return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
            }
            throw e;
        }
        const validated = createConsultationRequestSchema.parse(body);
        const result = await createConsultationRequest(user.id, validated);
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        return NextResponse.json({ consultation_request: result.data, success: true }, { status: 201 });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid request body', details: error.issues }, { status: 400 });
        }
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[consultations/requests] POST failed:', { error: errorMessage });
        return NextResponse.json({ error: 'Failed to create consultation request' }, { status: 500 });
    }
}
