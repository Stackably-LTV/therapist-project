export const SESSION_TYPE_COLORS = {
    therapy: {
        label: 'Therapy',
        dotClassName: 'bg-indigo-600',
        cardClassName: 'bg-indigo-50 border-indigo-200',
        textClassName: 'text-indigo-900',
    },
    quick_session: {
        label: 'Quick session',
        dotClassName: 'bg-blue-600',
        cardClassName: 'bg-blue-50 border-blue-200',
        textClassName: 'text-blue-900',
    },
    initial_intake_90: {
        label: 'Initial Intake',
        dotClassName: 'bg-blue-600',
        cardClassName: 'bg-blue-50 border-blue-200',
        textClassName: 'text-blue-900',
    },
    group_therapy: {
        label: 'Group Therapy',
        dotClassName: 'bg-violet-600',
        cardClassName: 'bg-violet-50 border-violet-200',
        textClassName: 'text-violet-900',
    },
    consultation: {
        label: 'Consultation',
        dotClassName: 'bg-teal-600',
        cardClassName: 'bg-teal-50 border-teal-200',
        textClassName: 'text-teal-900',
    },
    intake: {
        label: 'Intake',
        dotClassName: 'bg-cyan-600',
        cardClassName: 'bg-cyan-50 border-cyan-200',
        textClassName: 'text-cyan-900',
    },
    psych_eval: {
        label: 'Psych Eval',
        dotClassName: 'bg-fuchsia-600',
        cardClassName: 'bg-fuchsia-50 border-fuchsia-200',
        textClassName: 'text-fuchsia-900',
    },
    other: {
        label: 'Other',
        dotClassName: 'bg-slate-600',
        cardClassName: 'bg-slate-100 border-slate-200',
        textClassName: 'text-slate-900',
    },
};
function toAllowedDuration(durationMinutes) {
    if (durationMinutes === 30 || durationMinutes === 45 || durationMinutes === 60) {
        return durationMinutes;
    }
    if (durationMinutes <= 37)
        return 30;
    if (durationMinutes <= 52)
        return 45;
    return 60;
}
export function getSessionTypeColor(sessionType) {
    return SESSION_TYPE_COLORS[sessionType] ?? SESSION_TYPE_COLORS.other;
}
export function normalizeSession(session) {
    const start = new Date(session.scheduledAt);
    const durationMinutes = toAllowedDuration(session.durationMinutes || 60);
    const end = new Date(start.getTime() + durationMinutes * 60000);
    return {
        id: session.id,
        start,
        end,
        durationMinutes,
        status: session.status,
        sessionType: session.sessionType,
        locationType: session.locationType,
        locationLabel: session.locationLabel,
        telehealthUrl: session.telehealthUrl,
        client: session.client,
    };
}
export function normalizeBlock(block) {
    return {
        id: block.id,
        start: new Date(block.startAt),
        end: new Date(block.endAt),
        kind: block.kind === 'event' ? 'event' : 'unavailable',
        title: block.title,
        notes: block.notes,
    };
}
export function formatDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}
