import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/components/3168fa71d1e4';
import { reminderSettingsSchema, getReminderSettings, updateReminderSettings, } from '@/components/7b4587d7473b';
export async function GET() {
    const auth = await requireRole('therapist');
    if (!auth.ok)
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    const result = await getReminderSettings(auth.userId);
    if (!result.ok)
        return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result.data);
}
export async function PUT(req) {
    const auth = await requireRole('therapist');
    if (!auth.ok)
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    let parsed;
    try {
        parsed = reminderSettingsSchema.parse(await req.json());
    }
    catch (e) {
        const message = e instanceof z.ZodError ? e.issues.map((i) => i.message).join(', ') : 'Invalid body';
        return NextResponse.json({ error: message }, { status: 400 });
    }
    const result = await updateReminderSettings(auth.userId, parsed);
    if (!result.ok)
        return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result.data);
}
