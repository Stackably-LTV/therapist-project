'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/2318256b5648';
import { Button } from '@/components/2795b661f080';
import { ArrowUpRight, ClipboardList, Clock, Download, FileText, Loader2, MapPin, MessageSquare, Video } from 'lucide-react';
import { useChatStore } from '@/components/2da802565614';
import { parseMessageContent } from '@/components/a6e7ef5e01c9';
export default function MessageList({ messages, loading, currentUserId, currentUserName, currentUserProfileImageUrl, otherUserId: _otherUserId, otherUserName, otherUserRole, otherUserProfileImageUrl, activeQuickSessionId = null, consultationRequest = null, consultationLocked = false, currentUserRole = 'seeker', onRespondToSessionInvite, onFulfillDocumentRequest, }) {
    const scrollRef = useRef(null);
    const endRef = useRef(null);
    const initialScrollDoneRef = useRef(false);
    const storeCurrentAvatar = useChatStore((s) => s.currentUserAvatarUrl);
    const storeOtherAvatar = useChatStore((s) => s.avatarUrlByUserId[_otherUserId] ?? null);
    const resolvedCurrentAvatar = storeCurrentAvatar ?? currentUserProfileImageUrl;
    const resolvedOtherAvatar = storeOtherAvatar ?? otherUserProfileImageUrl;
    const [isAtBottom, setIsAtBottom] = useState(true);
    const [showJump, setShowJump] = useState(false);
    const [inviteActionLoading, setInviteActionLoading] = useState(null);
    const [documentRequestLoading, setDocumentRequestLoading] = useState(null);
    const [failedImagePreviews, setFailedImagePreviews] = useState({});
    const [imageDimensions, setImageDimensions] = useState({});
    const formatBytes = (size) => {
        if (!size || size <= 0)
            return null;
        if (size < 1024)
            return `${size} B`;
        if (size < 1024 * 1024)
            return `${Math.round(size / 102.4) / 10} KB`;
        return `${Math.round(size / (1024 * 102.4)) / 10} MB`;
    };
    const isImageAttachment = (title, mimeType) => {
        if (mimeType?.startsWith('image/'))
            return true;
        const lower = title.toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'].some((ext) => lower.endsWith(ext));
    };
    useEffect(() => {
        const el = scrollRef.current;
        if (!el)
            return;
        const onScroll = () => {
            const threshold = 80;
            const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
            setIsAtBottom(atBottom);
            if (atBottom)
                setShowJump(false);
        };
        el.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return () => el.removeEventListener('scroll', onScroll);
    }, []);
    useEffect(() => {
        if (!endRef.current)
            return;
        // Initial load: jump to bottom without animation
        if (!initialScrollDoneRef.current) {
            endRef.current.scrollIntoView({ behavior: 'auto' });
            initialScrollDoneRef.current = true;
            return;
        }
        // New messages: only autoscroll if user is already near bottom
        if (isAtBottom) {
            endRef.current.scrollIntoView({ behavior: 'smooth' });
        }
        else {
            setShowJump(true);
        }
    }, [messages]);
    const groupedMessages = useMemo(() => {
        const synthetic = [];
        if (consultationRequest &&
            (consultationRequest.status === 'pending' || consultationRequest.status === 'accepted') &&
            (consultationRequest.initial_message || consultationRequest.initial_message === null) &&
            consultationRequest.seeker_id &&
            consultationRequest.therapist_id) {
            synthetic.push({
                id: `consultation:${consultationRequest.id}`,
                sender_id: consultationRequest.seeker_id,
                recipient_id: consultationRequest.therapist_id,
                content: consultationRequest.initial_message?.trim() ||
                    'Consultation request sent.',
                read_at: null,
                created_at: consultationRequest.created_at ||
                    new Date().toISOString(),
            });
        }
        const allMessages = synthetic.length
            ? [...synthetic, ...messages]
            : messages;
        const groups = [];
        const byDate = new Map();
        for (const m of allMessages) {
            const dateLabel = new Date(m.created_at).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            });
            if (!byDate.has(dateLabel))
                byDate.set(dateLabel, []);
            byDate.get(dateLabel).push(m);
        }
        for (const [dateLabel, items] of byDate.entries()) {
            groups.push({ dateLabel, items });
        }
        return groups;
    }, [messages, consultationRequest]);
    const getTime = (iso) => new Date(iso).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
    });
    const getInitials = (name) => name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'U';
    // Build a lookup of sessionId → response status from any session_invite_response
    // messages in the thread, so the original invite card can show the live state.
    const sessionInviteResponses = useMemo(() => {
        const map = new Map();
        for (const m of messages) {
            const parsed = parseMessageContent(m.content || '');
            if (parsed.type === 'session_invite_response' && parsed.sessionId) {
                map.set(parsed.sessionId, parsed.response);
            }
        }
        return map;
    }, [messages]);
    const renderMessageBody = (content, isCurrentUser) => {
        const parsed = parseMessageContent(content);
        if (parsed.type === 'task') {
            const due = parsed.dueDate ? new Date(parsed.dueDate) : null;
            const dueLabel = due && !Number.isNaN(due.getTime())
                ? due.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : parsed.dueDate || null;
            return (<div className="inline-block w-full max-w-[520px] overflow-hidden rounded-xl border border-blue-200/70 bg-gradient-to-b from-white to-blue-50/40 shadow-sm ring-1 ring-slate-900/5">
          <div className="flex items-start gap-3 px-4 py-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <ClipboardList className="h-4 w-4" aria-hidden="true"/>
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                  Task assigned
                </p>
                {dueLabel ? (<span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-800">
                    Due {dueLabel}
                  </span>) : null}
              </div>

              <p className="mt-1 text-sm font-semibold text-slate-900 whitespace-pre-wrap break-words">
                {parsed.title}
              </p>

              {parsed.description ? (<p className="mt-1 text-xs text-slate-600 whitespace-pre-wrap break-words leading-relaxed">
                  {parsed.description}
                </p>) : null}
            </div>
          </div>

          {parsed.taskId && parsed.clientId ? (<div className="flex items-center justify-between gap-3 border-t border-blue-200/60 bg-white/60 px-4 py-3">
              <p className="text-xs text-slate-600">View and manage this task.</p>
              <Button size="sm" variant="outline" className="bg-white/80" asChild>
                <a href={currentUserRole === 'therapist'
                        ? '/therapist/records'
                        : '/seeker/chart?tab=tasks&status=all'}>
                  Open task tracker
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true"/>
                </a>
              </Button>
            </div>) : null}
        </div>);
        }
        if (parsed.type === 'document') {
            return (<div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Document shared</p>
          <a className="mt-1 inline-block text-sm text-emerald-900 underline underline-offset-2" href={`/api/documents/${parsed.documentId}/download`} target="_blank" rel="noreferrer">
            {parsed.title}
          </a>
        </div>);
        }
        if (parsed.type === 'attachment') {
            const href = `/api/documents/${parsed.documentId}/download`;
            const previewHref = `/api/documents/${parsed.documentId}/download?inline=1`;
            const sizeLabel = formatBytes(parsed.sizeBytes);
            const imageFailed = failedImagePreviews[parsed.documentId] === true;
            const isImage = isImageAttachment(parsed.title, parsed.mimeType) && !imageFailed;
            const imageSize = imageDimensions[parsed.documentId];
            const rawRatio = imageSize && imageSize.width > 0 && imageSize.height > 0
                ? imageSize.width / imageSize.height
                : 1;
            const clampedRatio = Math.min(16 / 9, Math.max(9 / 16, rawRatio));
            const appliedRatio = imageSize ? clampedRatio : 1;
            if (isImage) {
                return (<div className="mt-1 inline-block w-full max-w-[520px] space-y-2">
            {parsed.requestedType ? (<p className="text-xs text-slate-600">Requested type: {parsed.requestedType}</p>) : null}
            <div className="relative w-full overflow-hidden rounded-md border border-slate-200 bg-white" style={{ aspectRatio: `${appliedRatio}` }}>
              <img src={previewHref} alt={parsed.title} className="h-full w-full object-contain bg-white" loading="lazy" onLoad={(event) => {
                        const img = event.currentTarget;
                        if (!img.naturalWidth || !img.naturalHeight)
                            return;
                        setImageDimensions((prev) => ({
                            ...prev,
                            [parsed.documentId]: {
                                width: img.naturalWidth,
                                height: img.naturalHeight,
                            },
                        }));
                    }} onError={() => setFailedImagePreviews((prev) => ({
                        ...prev,
                        [parsed.documentId]: true,
                    }))}/>
              <a href={href} target="_blank" rel="noreferrer" className="absolute right-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/70 text-white hover:bg-slate-900" aria-label={`Download ${parsed.title}`}>
                <Download className="h-3.5 w-3.5"/>
              </a>
            </div>
            <div className="flex items-center justify-between gap-2 px-1">
              <span className="truncate text-sm font-medium text-slate-800">{parsed.title}</span>
              {sizeLabel ? <span className="shrink-0 text-xs text-slate-600">{sizeLabel}</span> : null}
            </div>
          </div>);
            }
            return (<div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Attachment</p>
          {parsed.requestedType ? (<p className="mt-1 text-xs text-indigo-800">Requested type: {parsed.requestedType}</p>) : null}
          <a className="mt-2 flex items-center gap-3 rounded-md border border-indigo-200 bg-white px-3 py-2 hover:bg-indigo-50" href={href} target="_blank" rel="noreferrer">
            <span className="flex h-8 w-8 items-center justify-center rounded bg-indigo-100 text-indigo-700">
              <FileText className="h-4 w-4"/>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-indigo-900">{parsed.title}</span>
              <span className="block text-xs text-indigo-700">
                {[parsed.mimeType || 'File', sizeLabel].filter(Boolean).join(' • ')}
              </span>
            </span>
            <Download className="h-4 w-4 shrink-0 text-indigo-500"/>
          </a>
        </div>);
        }
        if (parsed.type === 'document_request') {
            const canFulfill = currentUserRole === 'seeker' && !isCurrentUser && Boolean(onFulfillDocumentRequest);
            return (<div className="rounded-lg border border-amber-200 bg-amber-50/80 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">Requested document</p>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
              {parsed.requestedType.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="mt-1 text-sm font-medium text-amber-950">{parsed.title}</p>
          {parsed.note ? (<p className="mt-2 text-xs text-amber-900 whitespace-pre-wrap leading-relaxed">{parsed.note}</p>) : null}
          {canFulfill ? (<Button type="button" size="sm" className="mt-3" onClick={async () => {
                        if (!onFulfillDocumentRequest)
                            return;
                        setDocumentRequestLoading(parsed.requestId || parsed.title);
                        try {
                            await onFulfillDocumentRequest(parsed);
                        }
                        finally {
                            setDocumentRequestLoading(null);
                        }
                    }} disabled={documentRequestLoading !== null}>
              {documentRequestLoading === (parsed.requestId || parsed.title)
                        ? 'Preparing...'
                        : 'Send requested document'}
            </Button>) : null}
        </div>);
        }
        if (parsed.type === 'chart_snapshot') {
            const previewLines = (parsed.preview || '')
                .split('\n')
                .map((line) => line.trim())
                .filter(Boolean);
            const headlineLine = previewLines.find((line) => line.startsWith('Diagnosis:')) || previewLines[0] || '';
            const detailLines = previewLines.filter((line) => line !== headlineLine);
            const treatmentPlanHref = currentUserRole === 'seeker'
                ? `/seeker/chart?plan=${parsed.chartId}`
                : '/therapist/records';
            return (<div className="rounded-lg border border-violet-200 bg-violet-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
            {parsed.chartKind === 'progress_note' ? 'Progress note snapshot' : 'Treatment plan snapshot'}
          </p>
          <p className="mt-1 text-sm font-semibold text-violet-900">{parsed.title}</p>
          {parsed.chartKind === 'treatment_plan' ? (<div className="mt-2 space-y-2 rounded-md border border-violet-200 bg-white/70 p-2.5">
              {headlineLine ? (<p className="text-xs font-medium text-violet-900">{headlineLine}</p>) : null}
              {detailLines.length > 0 ? (<ul className="space-y-1 text-xs text-violet-800">
                  {detailLines.map((line) => (<li key={line} className="list-inside list-disc">
                      {line}
                    </li>))}
                </ul>) : null}
            </div>) : parsed.preview ? (<p className="mt-1 text-xs text-violet-800 whitespace-pre-wrap">{parsed.preview}</p>) : null}
          {parsed.chartKind === 'treatment_plan' ? (<Button size="sm" variant="outline" className="mt-3 bg-white/80" asChild>
              <a href={treatmentPlanHref}>
                Open treatment plan
                <ArrowUpRight className="h-4 w-4" aria-hidden="true"/>
              </a>
            </Button>) : null}
        </div>);
        }
        if (parsed.type === 'treatment_plan_ack') {
            const acknowledgedAt = new Date(parsed.acknowledgedAt);
            const acknowledgedLabel = Number.isNaN(acknowledgedAt.getTime())
                ? parsed.acknowledgedAt
                : acknowledgedAt.toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                });
            return (<div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Treatment plan acknowledged
          </p>
          <p className="mt-1 text-sm font-medium text-emerald-900">{parsed.title}</p>
          <p className="mt-1 text-xs text-emerald-800">Acknowledged {acknowledgedLabel}</p>
          {parsed.note ? <p className="mt-1 text-xs text-emerald-800 whitespace-pre-wrap">{parsed.note}</p> : null}
        </div>);
        }
        if (parsed.type === 'session_invite') {
            const responseStatus = sessionInviteResponses.get(parsed.sessionId) ?? null;
            const isAccepted = responseStatus === 'accepted';
            const isDeclined = responseStatus === 'declined';
            const canRespond = Boolean(onRespondToSessionInvite) &&
                currentUserRole === 'seeker' &&
                !isAccepted &&
                !isDeclined;
            const scheduledAt = new Date(parsed.scheduledAt);
            const scheduledLabel = Number.isNaN(scheduledAt.getTime())
                ? parsed.scheduledAt
                : scheduledAt.toLocaleString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                });
            const locationLabel = parsed.locationType === 'telehealth'
                ? 'Telehealth'
                : parsed.locationType === 'in_person'
                    ? 'In person'
                    : null;
            const locationDetail = parsed.locationType === 'in_person' && parsed.locationLabel
                ? parsed.locationLabel
                : parsed.locationType === 'telehealth' && parsed.locationLabel
                    ? parsed.locationLabel
                    : null;
            return (<div className="inline-block w-full max-w-[520px] overflow-hidden rounded-xl border border-amber-200/70 bg-gradient-to-b from-white to-amber-50/40 shadow-sm ring-1 ring-slate-900/5">
          <div className="flex items-start justify-between gap-3 px-4 py-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                {parsed.locationType === 'telehealth' ? (<Video className="h-4 w-4" aria-hidden="true"/>) : (<MapPin className="h-4 w-4" aria-hidden="true"/>)}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800">
                    Session invite
                  </p>
                  {locationLabel ? (<span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-900">
                      {parsed.locationType === 'telehealth' ? (<Video className="h-3 w-3" aria-hidden="true"/>) : (<MapPin className="h-3 w-3" aria-hidden="true"/>)}
                      {locationLabel}
                    </span>) : null}
                </div>

                <p className="mt-1 text-sm font-semibold text-slate-900">{scheduledLabel}</p>

                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true"/>
                    {parsed.durationMinutes} min
                  </span>
                  {locationDetail ? (<span className="truncate">{locationDetail}</span>) : null}
                </div>
              </div>
            </div>

            {isAccepted && parsed.locationType === 'telehealth' ? (<Button size="sm" className="shrink-0" asChild>
                <a href={parsed.telehealthUrl || `/video/${parsed.sessionId}`} target={parsed.telehealthUrl ? '_blank' : undefined} rel="noreferrer">
                  Join call
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true"/>
                </a>
              </Button>) : parsed.telehealthUrl && !isDeclined ? (<Button size="sm" variant="outline" className="shrink-0" asChild>
                <a href={parsed.telehealthUrl} target="_blank" rel="noreferrer">
                  Open link
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true"/>
                </a>
              </Button>) : null}
          </div>

          {isAccepted ? (<div className="flex flex-wrap items-center justify-between gap-3 border-t border-emerald-200/60 bg-emerald-50/60 px-4 py-2.5 text-xs text-emerald-900">
              <span className="font-semibold">Confirmed</span>
              {parsed.locationType === 'telehealth' ? (<span className="text-emerald-800">Tap &quot;Join call&quot; at {scheduledLabel}</span>) : parsed.locationLabel ? (<span className="text-emerald-800 truncate">{parsed.locationLabel}</span>) : (<span className="text-emerald-800">In-person session</span>)}
            </div>) : isDeclined ? (<div className="border-t border-rose-200/60 bg-rose-50/60 px-4 py-2.5 text-xs font-semibold text-rose-900">
              Declined
            </div>) : null}

          {canRespond ? (<div className="flex flex-wrap items-center justify-between gap-3 border-t border-amber-200/60 bg-white/60 px-4 py-3">
              <p className="text-xs text-slate-600">Reply to confirm this session.</p>
              <div className="flex items-center gap-2">
                <Button type="button" size="sm" onClick={async () => {
                        if (!onRespondToSessionInvite)
                            return;
                        setInviteActionLoading(`${parsed.sessionId}:accepted`);
                        try {
                            await onRespondToSessionInvite(parsed.sessionId, 'accepted');
                        }
                        finally {
                            setInviteActionLoading(null);
                        }
                    }} disabled={inviteActionLoading !== null}>
                  {inviteActionLoading === `${parsed.sessionId}:accepted` ? (<>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true"/>
                      Accepting...
                    </>) : ('Accept')}
                </Button>
                <Button type="button" size="sm" variant="outline" className="bg-white/80" onClick={async () => {
                        if (!onRespondToSessionInvite)
                            return;
                        setInviteActionLoading(`${parsed.sessionId}:declined`);
                        try {
                            await onRespondToSessionInvite(parsed.sessionId, 'declined');
                        }
                        finally {
                            setInviteActionLoading(null);
                        }
                    }} disabled={inviteActionLoading !== null}>
                  {inviteActionLoading === `${parsed.sessionId}:declined` ? (<>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true"/>
                      Declining...
                    </>) : ('Decline')}
                </Button>
              </div>
            </div>) : null}
        </div>);
        }
        if (parsed.type === 'session_invite_response') {
            return (<div className="rounded-lg border border-slate-300 bg-slate-100 p-3">
          <p className="text-sm text-slate-800">
            Session invite {parsed.response === 'accepted' ? 'accepted' : 'declined'}.
          </p>
          {parsed.note ? <p className="mt-1 text-xs text-slate-700">{parsed.note}</p> : null}
        </div>);
        }
        if (parsed.type === 'video_call') {
            const startedAt = new Date(parsed.startedAt);
            const startedLabel = Number.isNaN(startedAt.getTime())
                ? parsed.startedAt
                : startedAt.toLocaleString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                });
            return (<div className="inline-block w-full max-w-[520px] overflow-hidden rounded-xl border border-blue-200/70 bg-gradient-to-b from-white to-blue-50/40 shadow-sm ring-1 ring-slate-900/5">
          <div className="flex items-start justify-between gap-3 px-4 py-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                <Video className="h-4 w-4" aria-hidden="true"/>
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                  Quick session
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900 whitespace-pre-wrap break-words">
                  {parsed.title}
                </p>
                <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-600">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true"/>
                  Started {startedLabel}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {activeQuickSessionId && parsed.sessionId === activeQuickSessionId ? 'Ongoing' : 'Ended'}
                </p>
              </div>
            </div>

            {parsed.sessionId && activeQuickSessionId && parsed.sessionId === activeQuickSessionId ? (<Button size="sm" className="shrink-0" onClick={() => {
                        // Open the standalone call page; it fetches an Agora token and joins.
                        window.location.assign(`/video/${parsed.sessionId}`);
                    }}>
                Join now
                <ArrowUpRight className="h-4 w-4" aria-hidden="true"/>
              </Button>) : null}
          </div>
        </div>);
        }
        return <>{parsed.body}</>;
    };
    if (loading) {
        return (<div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-3"/>
          <p className="text-sm font-medium text-slate-700">Loading messages...</p>
        </div>
      </div>);
    }
    const hasSyntheticOnly = groupedMessages.length === 1 && groupedMessages[0]?.items?.length === 1 &&
        groupedMessages[0].items[0].id.startsWith('consultation:');
    if (messages.length === 0 && !hasSyntheticOnly) {
        return (<div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-10 h-10 text-blue-600"/>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No messages yet</h3>
          <p className="text-sm text-slate-600">Send a message to start your conversation</p>
        </div>
      </div>);
    }
    return (<div className="relative flex-1 min-h-0 bg-slate-50">
      <div ref={scrollRef} className="absolute inset-0 overflow-y-auto">
        <div className="mx-auto max-w-4xl">
          <div className="px-2 sm:px-4 py-4 sm:py-6 space-y-6">
            {groupedMessages.map(({ dateLabel, items }) => (<div key={dateLabel} className="space-y-3">
                <div className="flex items-center gap-3 px-2 sm:px-0">
                  <div className="h-px flex-1 bg-slate-200"/>
                  <span className="text-xs font-medium text-slate-500">
                    {dateLabel}
                  </span>
                  <div className="h-px flex-1 bg-slate-200"/>
                </div>

                <div className="space-y-0">
                  {items.map((m, idx) => {
                const prev = items[idx - 1];
                const isCurrentUser = m.sender_id === currentUserId;
                const seekerPendingGrey = consultationLocked &&
                    consultationRequest?.status === 'pending' &&
                    currentUserRole === 'seeker' &&
                    isCurrentUser;
                const displayName = isCurrentUser ? currentUserName : otherUserName;
                const displayRole = isCurrentUser ? 'seeker' : otherUserRole;
                const displayAvatarUrl = isCurrentUser
                    ? resolvedCurrentAvatar
                    : resolvedOtherAvatar;
                const isCompact = !!prev &&
                    prev.sender_id === m.sender_id &&
                    (new Date(m.created_at).getTime() - new Date(prev.created_at).getTime()) / 60000 < 5;
                if (isCompact) {
                    return (<div key={m.id} className="group flex gap-3 px-3 sm:px-4 py-1 hover:bg-white">
                          <div className="w-11 shrink-0 flex justify-end pt-0.5">
                            <span className="opacity-0 group-hover:opacity-100 text-[11px] text-slate-400">
                              {getTime(m.created_at)}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className={[
                            'text-sm whitespace-pre-wrap break-words',
                            seekerPendingGrey
                                ? 'text-slate-400'
                                : 'text-slate-900',
                        ].join(' ')}>
                              {renderMessageBody(m.content, isCurrentUser)}
                            </div>
                          </div>
                        </div>);
                }
                return (<div key={m.id} className="group flex gap-3 px-3 sm:px-4 py-2 hover:bg-white">
                        <Avatar className="h-10 w-10 shrink-0 ring-1 ring-slate-200 bg-white">
                          {displayAvatarUrl ? (<AvatarImage src={displayAvatarUrl} alt={displayName}/>) : null}
                          <AvatarFallback className={[
                        'text-xs font-bold',
                        displayRole === 'therapist'
                            ? 'bg-gradient-to-br from-purple-500 to-pink-600 text-white'
                            : 'bg-gradient-to-br from-blue-500 to-cyan-600 text-white',
                    ].join(' ')}>
                            {getInitials(displayName)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-2 min-w-0">
                            <span className="text-sm font-semibold text-slate-900 truncate">
                              {displayName}
                            </span>
                            <span className="text-xs text-slate-500 shrink-0">
                              {getTime(m.created_at)}
                            </span>
                          </div>
                          <div className={[
                        'mt-0.5 text-sm whitespace-pre-wrap break-words',
                        seekerPendingGrey
                            ? 'text-slate-400'
                            : 'text-slate-900',
                    ].join(' ')}>
                            {renderMessageBody(m.content, isCurrentUser)}
                          </div>
                        </div>
                      </div>);
            })}
                </div>
              </div>))}
            <div ref={endRef}/>
          </div>
        </div>
      </div>

      {showJump && (<div className="absolute bottom-4 right-4">
          <Button size="sm" variant="secondary" className="rounded-full shadow-sm" onClick={() => {
                endRef.current?.scrollIntoView({ behavior: 'smooth' });
                setShowJump(false);
            }}>
            Jump to present
          </Button>
        </div>)}
    </div>);
}
