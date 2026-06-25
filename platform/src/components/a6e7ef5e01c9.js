function isRecord(value) {
    return typeof value === 'object' && value !== null;
}
function isSupportedType(value) {
    return (value === 'text' ||
        value === 'task' ||
        value === 'document' ||
        value === 'attachment' ||
        value === 'document_request' ||
        value === 'chart_snapshot' ||
        value === 'treatment_plan_ack' ||
        value === 'session_invite' ||
        value === 'session_invite_response' ||
        value === 'video_call');
}
export function serializeRichMessage(payload) {
    return JSON.stringify(payload);
}
function parseLegacyMessage(content) {
    if (content.startsWith('[TASK]')) {
        const body = content.replace('[TASK]', '').trim();
        const [firstLine, ...rest] = body.split('\n');
        const dueMatch = firstLine.match(/\(Due:\s*([^)]+)\)\s*$/);
        const title = dueMatch ? firstLine.replace(/\(Due:\s*([^)]+)\)\s*$/, '').trim() : firstLine.trim();
        const dueDate = dueMatch?.[1];
        return {
            type: 'task',
            version: 1,
            title,
            description: rest.join('\n').trim() || undefined,
            dueDate,
        };
    }
    const docMatch = content.match(/^\[DOCUMENT:([^\]]+)\]\s*(.+)$/);
    if (docMatch) {
        return {
            type: 'document',
            version: 1,
            documentId: docMatch[1],
            title: docMatch[2],
        };
    }
    return { type: 'text', version: 1, body: content };
}
export function parseMessageContent(content) {
    try {
        const parsed = JSON.parse(content);
        if (!isRecord(parsed))
            return parseLegacyMessage(content);
        if (!isSupportedType(parsed.type))
            return parseLegacyMessage(content);
        if (parsed.type === 'text') {
            return {
                type: 'text',
                version: 1,
                body: String(parsed.body ?? ''),
            };
        }
        if (parsed.type === 'task') {
            return {
                type: 'task',
                version: 1,
                title: String(parsed.title ?? ''),
                description: parsed.description ? String(parsed.description) : undefined,
                dueDate: parsed.dueDate ? String(parsed.dueDate) : undefined,
                taskId: parsed.taskId ? String(parsed.taskId) : undefined,
                clientId: parsed.clientId ? String(parsed.clientId) : undefined,
                source: parsed.source === 'records' || parsed.source === 'chat'
                    ? parsed.source
                    : undefined,
            };
        }
        if (parsed.type === 'document') {
            return {
                type: 'document',
                version: 1,
                documentId: String(parsed.documentId ?? ''),
                title: String(parsed.title ?? ''),
            };
        }
        if (parsed.type === 'attachment') {
            return {
                type: 'attachment',
                version: 1,
                documentId: String(parsed.documentId ?? ''),
                title: String(parsed.title ?? ''),
                mimeType: parsed.mimeType ? String(parsed.mimeType) : undefined,
                sizeBytes: typeof parsed.sizeBytes === 'number' ? parsed.sizeBytes : undefined,
                requestedType: parsed.requestedType ? String(parsed.requestedType) : undefined,
                requestId: parsed.requestId ? String(parsed.requestId) : undefined,
            };
        }
        if (parsed.type === 'document_request') {
            return {
                type: 'document_request',
                version: 1,
                requestId: String(parsed.requestId ?? ''),
                title: String(parsed.title ?? 'Requested document'),
                requestedType: String(parsed.requestedType ?? 'other'),
                note: parsed.note ? String(parsed.note) : undefined,
            };
        }
        if (parsed.type === 'chart_snapshot') {
            return {
                type: 'chart_snapshot',
                version: 1,
                chartKind: parsed.chartKind === 'treatment_plan' ? 'treatment_plan' : 'progress_note',
                chartId: String(parsed.chartId ?? ''),
                title: String(parsed.title ?? ''),
                preview: parsed.preview ? String(parsed.preview) : undefined,
            };
        }
        if (parsed.type === 'treatment_plan_ack') {
            return {
                type: 'treatment_plan_ack',
                version: 1,
                chartId: String(parsed.chartId ?? ''),
                title: String(parsed.title ?? 'Treatment plan'),
                acknowledgedAt: String(parsed.acknowledgedAt ?? new Date().toISOString()),
                note: parsed.note ? String(parsed.note) : undefined,
            };
        }
        if (parsed.type === 'session_invite') {
            return {
                type: 'session_invite',
                version: 1,
                sessionId: String(parsed.sessionId ?? ''),
                title: String(parsed.title ?? 'Session invite'),
                scheduledAt: String(parsed.scheduledAt ?? ''),
                durationMinutes: Number(parsed.durationMinutes ?? 50),
                locationType: parsed.locationType ? String(parsed.locationType) : undefined,
                locationLabel: parsed.locationLabel ? String(parsed.locationLabel) : undefined,
                telehealthUrl: parsed.telehealthUrl ? String(parsed.telehealthUrl) : undefined,
            };
        }
        if (parsed.type === 'video_call') {
            return {
                type: 'video_call',
                version: 1,
                sessionId: String(parsed.sessionId ?? ''),
                title: String(parsed.title ?? 'Video call'),
                startedAt: String(parsed.startedAt ?? new Date().toISOString()),
            };
        }
        return {
            type: 'session_invite_response',
            version: 1,
            sessionId: String(parsed.sessionId ?? ''),
            response: parsed.response === 'declined' ? 'declined' : 'accepted',
            note: parsed.note ? String(parsed.note) : undefined,
        };
    }
    catch {
        return parseLegacyMessage(content);
    }
}
export function getMessagePreview(content) {
    const parsed = parseMessageContent(content);
    if (parsed.type === 'task')
        return `Task: ${parsed.title}`;
    if (parsed.type === 'document')
        return `Document: ${parsed.title}`;
    if (parsed.type === 'attachment')
        return `Attachment: ${parsed.title}`;
    if (parsed.type === 'document_request')
        return `Requested document: ${parsed.title}`;
    if (parsed.type === 'chart_snapshot') {
        return parsed.chartKind === 'progress_note'
            ? `Progress note: ${parsed.title}`
            : `Treatment plan: ${parsed.title}`;
    }
    if (parsed.type === 'treatment_plan_ack') {
        return `Acknowledged treatment plan: ${parsed.title}`;
    }
    if (parsed.type === 'session_invite')
        return `Session invite: ${parsed.title}`;
    if (parsed.type === 'session_invite_response') {
        return parsed.response === 'accepted' ? 'Session invite accepted' : 'Session invite declined';
    }
    if (parsed.type === 'video_call')
        return `Video call: ${parsed.title}`;
    return parsed.body;
}
