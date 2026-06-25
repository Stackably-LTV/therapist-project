'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, MessageSquare, User, Video, Bell, Shield, ChevronDown, ChevronRight, CalendarPlus, FileText, ClipboardList, Loader2, PhoneOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ChatSidebar from '@/components/31c96e28ad54';
import MessageList from '@/components/d03c4c5e7f3d';
import MessageInput from '@/components/d608374a6c14';
import { useRealtimeInbox, useRealtimeMessages, useRealtimeAuthSync, useUpdateLastSeen, useRealtimeConsultationRequests, } from '@/components/8b16d2798643';
import { chatService } from '@/components/3531a03682ac';
import { Button } from '@/components/2795b661f080';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/2318256b5648';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ba221113eac7';
import { Label } from '@/components/78846397f3ca';
import { Input } from '@/components/c2f62fb0cb5e';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/1712d8a01fd3';
import { Textarea } from '@/components/e1d2ad49fd73';
import { toast } from 'sonner';
import { createClient } from '@/components/e7335a071b71';
import { useIsMobile } from '@/components/3dccab7f0b8f';
import { useChatStore, getDmKey } from '@/components/2da802565614';
import { useChatQuickActionsStore } from '@/components/aab3874988f4';
import { getMessagePreview, serializeRichMessage, } from '@/components/a6e7ef5e01c9';
import { CHAT_ATTACHMENT_ACCEPT, MAX_CHAT_ATTACHMENT_BYTES, isAllowedChatAttachment, } from '@/components/bc9ddfa866a2';
function AccordionItem({ title, icon: Icon, children, defaultOpen = false, }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (<div className="border-b border-slate-100 last:border-0">
      <button onClick={() => setIsOpen(!isOpen)} className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-50 transition-colors">
        <span className="flex items-center gap-3">
          {Icon && <Icon className="h-4 w-4 text-slate-500"/>}
          {title}
        </span>
        {isOpen ? (<ChevronDown className="h-4 w-4 text-slate-400"/>) : (<ChevronRight className="h-4 w-4 text-slate-400"/>)}
      </button>
      {isOpen && <div className="px-4 pb-3 pt-0 text-sm text-slate-600">{children}</div>}
    </div>);
}
export default function ChatInterface({ initialConversations, selectedUserId: initialSelectedUserId, currentUserId, currentUserName, currentUserProfileImageUrl, currentUserRole, consultationRequest: initialConsultationRequest, consultationLocked: initialConsultationLocked, endedQuickSessionOverview, }) {
    const router = useRouter();
    const isMobile = useIsMobile();
    const [shareablesLoading, setShareablesLoading] = useState(false);
    const [shareablesLoaded, setShareablesLoaded] = useState(false);
    const [sharedFiles, setSharedFiles] = useState([]);
    const [sharedFilesLoading, setSharedFilesLoading] = useState(false);
    const [actionSaving, setActionSaving] = useState(false);
    const [progressNotes, setProgressNotes] = useState([]);
    const [selectedProgressId, setSelectedProgressId] = useState('');
    const [treatmentPlans, setTreatmentPlans] = useState([]);
    const [selectedTreatmentPlanId, setSelectedTreatmentPlanId] = useState('');
    const [existingAttachments, setExistingAttachments] = useState([]);
    const [selectedExistingAttachmentId, setSelectedExistingAttachmentId] = useState('');
    const [inviteDateTime, setInviteDateTime] = useState('');
    const [inviteDurationMinutes, setInviteDurationMinutes] = useState('50');
    const [inviteLocationType, setInviteLocationType] = useState('telehealth');
    const [inviteLocationLabel, setInviteLocationLabel] = useState('');
    const [inviteNote, setInviteNote] = useState('');
    const [taskTitle, setTaskTitle] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [taskDueDate, setTaskDueDate] = useState('');
    const [taskPriority, setTaskPriority] = useState('normal');
    const [requestDocumentType, setRequestDocumentType] = useState('insurance_card');
    const [requestDocumentTitle, setRequestDocumentTitle] = useState('Insurance card');
    const [requestDocumentNote, setRequestDocumentNote] = useState('');
    const [seekerRequestUploadOpen, setSeekerRequestUploadOpen] = useState(false);
    const [pendingDocumentRequest, setPendingDocumentRequest] = useState(null);
    const [seekerRequestedFile, setSeekerRequestedFile] = useState(null);
    const [attachmentUploading, setAttachmentUploading] = useState(false);
    const [showEndedQuickSessionBanner, setShowEndedQuickSessionBanner] = useState(true);
    const [videoActionLoading, setVideoActionLoading] = useState(false);
    const [activeDmSessionId, setActiveDmSessionId] = useState(null);
    const [activeDmSessionLoading, setActiveDmSessionLoading] = useState(false);
    const [sendingInvite, setSendingInvite] = useState(false);
    const quickActionsOpen = useChatQuickActionsStore((s) => s.open);
    const quickActionsView = useChatQuickActionsStore((s) => s.view);
    const openQuickMenu = useChatQuickActionsStore((s) => s.openMenu);
    const openQuickView = useChatQuickActionsStore((s) => s.openView);
    const closeQuickActions = useChatQuickActionsStore((s) => s.close);
    useRealtimeAuthSync();
    const storeConversations = useChatStore((s) => s.conversations);
    const storeSelectedUserId = useChatStore((s) => s.selectedUserId);
    const hydrateConversations = useChatStore((s) => s.hydrateConversations);
    const setSelectedUserIdStore = useChatStore((s) => s.setSelectedUserId);
    const updateConversationFromInbox = useChatStore((s) => s.updateConversationFromInbox);
    const addConversation = useChatStore((s) => s.addConversation);
    const clearUnreadForConversation = useChatStore((s) => s.clearUnreadForConversation);
    const conversations = storeConversations.length > 0 ? storeConversations : initialConversations;
    const selectedUserId = storeSelectedUserId ?? initialSelectedUserId;
    const setSelectedUserId = (id) => {
        setSelectedUserIdStore(id);
    };
    const conversationKey = selectedUserId && currentUserId ? getDmKey(currentUserId, selectedUserId) : '';
    const storeRequestForConversation = useChatStore((s) => {
        if (!conversationKey)
            return null;
        for (const r of Object.values(s.consultationRequestByRequestId)) {
            if (r.seeker_id && r.therapist_id && getDmKey(r.seeker_id, r.therapist_id) === conversationKey)
                return r;
        }
        return null;
    });
    const storeLocked = useChatStore((s) => conversationKey ? s.consultationLockedByKey[conversationKey] : undefined);
    const consultationRequest = storeRequestForConversation ??
        (initialConsultationRequest &&
            conversationKey &&
            initialConsultationRequest.seeker_id &&
            initialConsultationRequest.therapist_id &&
            getDmKey(initialConsultationRequest.seeker_id, initialConsultationRequest.therapist_id) === conversationKey
            ? initialConsultationRequest
            : null);
    const consultationLocked = storeLocked ?? initialConsultationLocked;
    const hydrateChatAvatars = useChatStore((s) => s.hydrateChatAvatars);
    const hydrateConsultation = useChatStore((s) => s.hydrateConsultation);
    const setConsultationRequestStore = useChatStore((s) => s.setConsultationRequest);
    const setAvatarForUser = useChatStore((s) => s.setAvatarForUser);
    const headerOtherAvatarUrl = useChatStore((s) => selectedUserId ? s.avatarUrlByUserId[selectedUserId] ?? null : null);
    useEffect(() => {
        hydrateChatAvatars({
            currentUserAvatarUrl: currentUserProfileImageUrl,
            conversations: initialConversations,
        });
    }, [currentUserProfileImageUrl, initialConversations, hydrateChatAvatars]);
    useEffect(() => {
        hydrateConversations(initialConversations, currentUserId);
    }, [initialConversations, currentUserId, hydrateConversations]);
    useEffect(() => {
        setSelectedUserIdStore(initialSelectedUserId);
    }, [initialSelectedUserId, setSelectedUserIdStore]);
    // Handle consultation request status updates for therapist-initiated invitations.
    // The onUpdate callback fires inside the existing useRealtimeConsultationRequests
    // subscription so no extra realtime channel is needed.
    const handleConsultationUpdate = useCallback((payload) => {
        if (currentUserRole !== 'therapist' || payload.initiated_by !== 'therapist')
            return;
        if (payload.status === 'accepted') {
            toast.success('They accepted your invitation! You are now connected.');
        }
        else if (payload.status === 'declined') {
            toast.info('Your invitation was declined. You can send another.');
        }
    }, [currentUserRole]);
    useRealtimeConsultationRequests(currentUserId, currentUserRole === 'therapist' ? 'therapist' : 'seeker', handleConsultationUpdate);
    useUpdateLastSeen();
    const { messages, loading, sendMessage } = useRealtimeMessages(currentUserId, selectedUserId);
    const { lastEvent: inboxEvent } = useRealtimeInbox(currentUserId);
    // Presence tracking removed — last_seen_at column no longer exists.
    const selectedConversation = useMemo(() => conversations.find((c) => c.id === selectedUserId), [conversations, selectedUserId]);
    useEffect(() => {
        if (!selectedConversation)
            return;
        const url = selectedConversation.profile_json?.profile_image_url;
        setAvatarForUser(selectedConversation.id, url ?? null);
    }, [selectedConversation, setAvatarForUser]);
    // Use a ref to avoid recreating subscription on conversation change
    const selectedConversationRef = useRef(selectedConversation);
    useEffect(() => {
        selectedConversationRef.current = selectedConversation;
    }, [selectedConversation]);
    // Persistent invitation banner: a therapist-initiated connection_request loaded by
    // page.tsx into `consultationRequest` is rendered as a banner above the message thread,
    // so we no longer need a transient realtime modal here. Realtime inserts/updates flow
    // through useRealtimeConsultationRequests and update the store, which re-renders the
    // banner automatically.
    useEffect(() => {
        if (!conversationKey)
            return;
        hydrateConsultation(initialConsultationRequest, conversationKey, initialConsultationLocked);
    }, [conversationKey, initialConsultationRequest, initialConsultationLocked, hydrateConsultation]);
    useEffect(() => {
        if (!inboxEvent)
            return;
        const partnerId = inboxEvent.sender_id === currentUserId
            ? inboxEvent.recipient_id
            : inboxEvent.sender_id;
        if (!partnerId || partnerId === currentUserId)
            return;
        const isUnread = inboxEvent.recipient_id === currentUserId &&
            inboxEvent.sender_id === partnerId &&
            partnerId !== selectedUserId;
        const existing = useChatStore.getState().conversations.find((c) => c.id === partnerId);
        if (existing) {
            const preview = getMessagePreview(inboxEvent.content);
            updateConversationFromInbox({
                partnerId,
                content: preview,
                created_at: inboxEvent.created_at,
                isUnread,
                selectedUserId,
            });
            return;
        }
        void (async () => {
            const supabase = createClient();
            const [{ data: senderRole }, { data: senderProfile }] = await Promise.all([
                supabase.from('user_roles').select('id, role').eq('id', partnerId).single(),
                supabase
                    .from('user_profiles')
                    .select('user_id, full_name, profile_image_url')
                    .eq('user_id', partnerId)
                    .single(),
            ]);
            if (!senderRole || senderRole.id === currentUserId)
                return;
            if (useChatStore.getState().conversations.some((c) => c.id === senderRole.id))
                return;
            const profileJson = senderProfile?.profile_image_url
                ? { profile_image_url: senderProfile.profile_image_url }
                : undefined;
            addConversation({
                id: senderRole.id,
                name: senderProfile?.full_name ?? '',
                role: senderRole.role,
                profile_json: profileJson,
                last_message: getMessagePreview(inboxEvent.content),
                last_message_at: inboxEvent.created_at,
                unread_count: isUnread ? 1 : 0,
            });
            setAvatarForUser(senderRole.id, senderProfile?.profile_image_url ?? null);
        })();
    }, [inboxEvent, currentUserId, selectedUserId, updateConversationFromInbox, addConversation, setAvatarForUser]);
    useEffect(() => {
        if (!selectedUserId)
            return;
        clearUnreadForConversation(selectedUserId);
        void chatService.markAsRead(selectedUserId);
    }, [selectedUserId, clearUnreadForConversation]);
    useEffect(() => {
        setShareablesLoaded(false);
        setProgressNotes([]);
        setTreatmentPlans([]);
        setExistingAttachments([]);
        setSelectedProgressId('');
        setSelectedTreatmentPlanId('');
        setSelectedExistingAttachmentId('');
    }, [selectedConversation?.id]);
    const isSeekerToTherapist = currentUserRole === 'seeker' && selectedConversation?.role === 'therapist';
    const isTherapistToSeeker = currentUserRole === 'therapist' && selectedConversation?.role === 'seeker';
    const requestStatus = consultationRequest?.status || null;
    const isAccepted = requestStatus === 'accepted';
    const isPending = requestStatus === 'pending';
    const isDeclined = requestStatus === 'declined';
    // Chat is never locked. Consultation requests are surfaced as a banner-with-buttons,
    // never as a barrier — seeker can text the therapist freely before any meeting/booking,
    // and the "Invite to become a client" button is purely an opt-in handshake.
    const isConsultationLocked = false;
    const initiatedBy = consultationRequest?.initiated_by ?? null;
    const isInitiator = isPending &&
        ((initiatedBy === 'seeker' && currentUserRole === 'seeker') ||
            (initiatedBy === 'therapist' && currentUserRole === 'therapist'));
    const isInviteRecipient = isPending && !isInitiator;
    const endedQuickSessionForThread = endedQuickSessionOverview &&
        selectedConversation &&
        endedQuickSessionOverview.otherUserId === selectedConversation.id
        ? endedQuickSessionOverview
        : null;
    const canUseDmVideo = !!selectedConversation &&
        !isConsultationLocked &&
        (isTherapistToSeeker || isSeekerToTherapist);
    const refreshActiveDmSession = useCallback(async () => {
        if (!selectedConversation || !canUseDmVideo) {
            setActiveDmSessionId(null);
            return;
        }
        setActiveDmSessionLoading(true);
        try {
            const res = await fetch(`/api/chat/video-call/active?recipientId=${selectedConversation.id}`, {
                cache: 'no-store',
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data?.error || 'Failed to check active call');
            const session = data?.session;
            setActiveDmSessionId(session?.id || null);
        }
        catch (error) {
            console.error('[chat-interface] refreshActiveDmSession error', error);
            setActiveDmSessionId(null);
        }
        finally {
            setActiveDmSessionLoading(false);
        }
    }, [selectedConversation, canUseDmVideo]);
    useEffect(() => {
        void refreshActiveDmSession();
    }, [refreshActiveDmSession]);
    const handleVideoCallAction = async () => {
        if (!selectedConversation || !canUseDmVideo)
            return;
        setVideoActionLoading(true);
        try {
            const joinQuickSession = (sessionId) => {
                // Go straight into the meeting via the standalone (call) layout page.
                window.location.assign(`/video/${sessionId}`);
            };
            if (isTherapistToSeeker) {
                const res = await fetch('/api/chat/video-call/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        recipientId: selectedConversation.id,
                        durationMinutes: 60,
                    }),
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok)
                    throw new Error(data?.error || 'Failed to start video call');
                const sessionId = data?.session?.id;
                if (!sessionId)
                    throw new Error('Session created without id');
                setActiveDmSessionId(sessionId);
                toast.success('Video call ready');
                joinQuickSession(sessionId);
                return;
            }
            if (activeDmSessionId) {
                joinQuickSession(activeDmSessionId);
                return;
            }
            const activeRes = await fetch(`/api/chat/video-call/active?recipientId=${selectedConversation.id}`, {
                cache: 'no-store',
            });
            const activeData = await activeRes.json().catch(() => ({}));
            if (!activeRes.ok)
                throw new Error(activeData?.error || 'Failed to check active call');
            const refreshedId = activeData?.session?.id || null;
            setActiveDmSessionId(refreshedId);
            if (refreshedId) {
                joinQuickSession(refreshedId);
            }
            else {
                toast.message('No active video call yet. Wait for your therapist to start one.');
            }
        }
        catch (error) {
            console.error('[chat-interface] handleVideoCallAction error', error);
            toast.error(error instanceof Error ? error.message : 'Video call action failed');
        }
        finally {
            setVideoActionLoading(false);
        }
    };
    const handleEndQuickSession = async () => {
        if (!selectedConversation || currentUserRole !== 'therapist')
            return;
        if (!activeDmSessionId)
            return;
        setVideoActionLoading(true);
        try {
            const res = await fetch('/api/chat/video-call/end', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: activeDmSessionId,
                    recipientId: selectedConversation.id,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data?.error || 'Failed to end quick session');
            toast.success('Quick session ended');
            setActiveDmSessionId(null);
        }
        catch (error) {
            console.error('[chat-interface] handleEndQuickSession error', error);
            toast.error(error instanceof Error ? error.message : 'Failed to end quick session');
        }
        finally {
            setVideoActionLoading(false);
        }
    };
    const handleSendMessage = async (content) => {
        if (!selectedUserId)
            return;
        await sendMessage(content);
    };
    const canUseRichActions = !!selectedConversation &&
        currentUserRole === 'therapist' &&
        selectedConversation.role === 'seeker' &&
        !isConsultationLocked;
    const showActionsButton = !!selectedConversation && currentUserRole === 'therapist' && selectedConversation.role === 'seeker';
    const actionsDisabledReason = useMemo(() => {
        if (!showActionsButton)
            return '';
        if (!selectedConversation)
            return '';
        if (!isConsultationLocked)
            return '';
        if (isPending) {
            return 'These actions will be available once this seeker becomes your client (after you accept the consultation request).';
        }
        if (isDeclined) {
            return 'Actions are unavailable because the consultation request was declined.';
        }
        return 'These actions will be available once this seeker becomes your client.';
    }, [showActionsButton, selectedConversation, isConsultationLocked, isPending, isDeclined]);
    const canSeekerRespondToDocumentRequest = !!selectedConversation &&
        currentUserRole === 'seeker' &&
        selectedConversation.role === 'therapist' &&
        !isConsultationLocked;
    const canUseAttachments = !!selectedConversation &&
        ((currentUserRole === 'therapist' && selectedConversation.role === 'seeker') ||
            (currentUserRole === 'seeker' && selectedConversation.role === 'therapist'));
    // Show "Invite to become a client" button only when the therapist is chatting
    // with a seeker who has no pending or accepted consultation request yet.
    const showInviteButton = useMemo(() => isTherapistToSeeker &&
        !isAccepted &&
        !isPending, [isTherapistToSeeker, isAccepted, isPending]);
    const handleInviteToBecomeClient = async () => {
        if (!selectedConversation || !showInviteButton)
            return;
        setSendingInvite(true);
        try {
            const res = await fetch('/api/consultations/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    therapist_id: currentUserId,
                    seeker_id: selectedConversation.id,
                    initiated_by: 'therapist',
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                const msg = data?.error || 'Failed to send invitation';
                toast.error(msg);
                return;
            }
            const request = (data?.consultation_request ?? data?.request);
            if (request?.id && conversationKey) {
                setConsultationRequestStore(request.id, {
                    id: request.id,
                    status: 'pending',
                    initial_message: null,
                    created_at: new Date().toISOString(),
                    seeker_id: selectedConversation.id,
                    therapist_id: currentUserId,
                    initiated_by: 'therapist',
                });
            }
            toast.success('Invitation sent! They will see it in their chat.');
        }
        catch (error) {
            console.error('[chat-interface] handleInviteToBecomeClient error', error);
            toast.error(error instanceof Error ? error.message : 'Failed to send invitation');
        }
        finally {
            setSendingInvite(false);
        }
    };
    const sendRichMessage = async (payload) => {
        await handleSendMessage(serializeRichMessage(payload));
    };
    const getAttachmentValidationError = (file) => {
        if (file.size > MAX_CHAT_ATTACHMENT_BYTES) {
            return 'File size must be 50MB or less.';
        }
        if (!isAllowedChatAttachment(file)) {
            return 'Only PDF, Word, text, and image files are allowed.';
        }
        return null;
    };
    const uploadAttachmentToConversation = async (file, metadata) => {
        if (!selectedConversation)
            return;
        const validationError = getAttachmentValidationError(file);
        if (validationError) {
            toast.error(validationError);
            return;
        }
        const initRes = await fetch('/api/chat/attachments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'init',
                recipientId: selectedConversation.id,
                fileName: file.name,
                fileSize: file.size,
                mimeType: file.type,
                requestedType: metadata?.requestedType,
                requestId: metadata?.requestId,
            }),
        });
        const initData = await initRes.json().catch(() => ({}));
        if (!initRes.ok)
            throw new Error(initData?.error || `Server error: ${initRes.status}`);
        const upload = initData?.upload;
        if (!upload?.bucket || !upload.path || !upload.token || !upload.storagePath) {
            throw new Error('Upload did not return signed storage details');
        }
        const supabase = createClient();
        const { error: uploadError } = await supabase.storage
            .from(upload.bucket)
            .uploadToSignedUrl(upload.path, upload.token, file, {
            contentType: file.type || undefined,
        });
        if (uploadError)
            throw new Error(uploadError.message || 'Storage upload failed');
        const completeRes = await fetch('/api/chat/attachments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'complete',
                recipientId: selectedConversation.id,
                fileName: file.name,
                fileSize: file.size,
                mimeType: file.type,
                storagePath: upload.storagePath,
                requestedType: metadata?.requestedType,
                requestId: metadata?.requestId,
            }),
        });
        const data = await completeRes.json().catch(() => ({}));
        if (!completeRes.ok)
            throw new Error(data?.error || `Server error: ${completeRes.status}`);
        const doc = data.document;
        await sendRichMessage({
            type: 'attachment',
            version: 1,
            documentId: doc.id,
            title: doc.fileName,
            mimeType: doc.mimeType,
            sizeBytes: doc.fileSizeBytes,
            requestedType: metadata?.requestedType,
            requestId: metadata?.requestId,
        });
    };
    const handleSendAttachment = async (file) => {
        if (!selectedConversation || !canUseAttachments)
            return;
        setAttachmentUploading(true);
        try {
            await uploadAttachmentToConversation(file);
            toast.success('Attachment sent');
        }
        catch (error) {
            console.error('[chat-interface] handleSendAttachment error', error);
            toast.error(error instanceof Error ? error.message : 'Failed to send attachment');
        }
        finally {
            setAttachmentUploading(false);
        }
    };
    const loadShareables = useCallback(async () => {
        if (!selectedConversation || selectedConversation.role !== 'seeker')
            return;
        setShareablesLoading(true);
        try {
            const res = await fetch(`/api/chat/shareables?recipientId=${selectedConversation.id}`, { cache: 'no-store' });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data?.error || 'Failed to load shareables');
            const progress = (data?.progressNotes || []);
            const plans = (data?.treatmentPlans || []);
            const docs = (data?.documents || []);
            const priorSharedAttachments = docs
                .filter((doc) => Array.isArray(doc.sharedWith) && doc.sharedWith.includes(selectedConversation.id))
                .map((doc) => ({
                id: doc.id,
                title: doc.fileName,
                mimeType: doc.mimeType,
                sizeBytes: doc.fileSizeBytes,
            }));
            setProgressNotes(progress);
            setSelectedProgressId((prev) => prev || progress[0]?.id || '');
            setTreatmentPlans(plans);
            setSelectedTreatmentPlanId((prev) => prev || plans[0]?.id || '');
            setExistingAttachments(priorSharedAttachments);
            setSelectedExistingAttachmentId((prev) => prev || priorSharedAttachments[0]?.id || '');
            setShareablesLoaded(true);
        }
        catch (error) {
            console.error('[chat-interface] loadShareables error', error);
            setProgressNotes([]);
            setTreatmentPlans([]);
            setExistingAttachments([]);
            setShareablesLoaded(true);
            toast.error('Failed to load quick actions');
        }
        finally {
            setShareablesLoading(false);
        }
    }, [selectedConversation]);
    useEffect(() => {
        if (!quickActionsOpen || !canUseRichActions)
            return;
        if (shareablesLoaded || shareablesLoading)
            return;
        void loadShareables();
    }, [quickActionsOpen, canUseRichActions, shareablesLoaded, shareablesLoading, loadShareables]);
    const loadSharedFiles = useCallback(async () => {
        if (!selectedConversation) {
            setSharedFiles([]);
            return;
        }
        setSharedFilesLoading(true);
        try {
            const res = await fetch(`/api/chat/shared-files?withUserId=${encodeURIComponent(selectedConversation.id)}`, { cache: 'no-store' });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data?.error || 'Failed to load shared files');
            setSharedFiles((data?.files ?? []));
        }
        catch (error) {
            console.error('[chat-interface] loadSharedFiles error', error);
            setSharedFiles([]);
        }
        finally {
            setSharedFilesLoading(false);
        }
    }, [selectedConversation]);
    useEffect(() => {
        void loadSharedFiles();
    }, [loadSharedFiles]);
    // Refresh shared file list when an attachment is sent locally.
    useEffect(() => {
        if (!attachmentUploading)
            return;
        const timer = setTimeout(() => void loadSharedFiles(), 1000);
        return () => clearTimeout(timer);
    }, [attachmentUploading, loadSharedFiles]);
    const ensureQuickActionsAccess = () => {
        if (canUseRichActions)
            return true;
        if (currentUserRole === 'seeker') {
            toast.message('As a seeker, you can send files only when the therapist requests a document.');
            return false;
        }
        if (isConsultationLocked) {
            toast.message(actionsDisabledReason || 'These actions will be available once this seeker becomes your client.');
            return false;
        }
        toast.message('Quick actions are available for therapist-to-client conversations.');
        return false;
    };
    const handleActionsButton = () => {
        if (!ensureQuickActionsAccess())
            return;
        openQuickMenu();
        if (!shareablesLoaded && !shareablesLoading) {
            void loadShareables();
        }
    };
    const openProgressShareOrRedirect = () => {
        if (!selectedConversation)
            return;
        if (shareablesLoading || !shareablesLoaded) {
            toast.message('Loading shareables…');
            if (!shareablesLoading)
                void loadShareables();
            return;
        }
        if (progressNotes.length === 0) {
            toast.message('No progress notes yet. Create one in the patient chart, then share it here.');
            closeQuickActions();
            router.push(`/therapist/clients/${selectedConversation.id}?tab=notes`);
            return;
        }
        openQuickView('progress');
    };
    const openTreatmentPlanShareOrRedirect = () => {
        if (!selectedConversation)
            return;
        if (shareablesLoading || !shareablesLoaded) {
            toast.message('Loading shareables...');
            if (!shareablesLoading)
                void loadShareables();
            return;
        }
        if (treatmentPlans.length === 0) {
            toast.message('No treatment plan yet. Create one in patient records and then share it here.');
            closeQuickActions();
            router.push(`/therapist/clients/${selectedConversation.id}?tab=treatment`);
            return;
        }
        openQuickView('treatment_plan');
    };
    const openExistingDocumentShare = () => {
        if (!selectedConversation)
            return;
        if (shareablesLoading || !shareablesLoaded) {
            toast.message('Loading shareables...');
            if (!shareablesLoading)
                void loadShareables();
            return;
        }
        if (existingAttachments.length === 0) {
            toast.message('No previously shared attachments yet. Attach a file with the paperclip first, then you can re-share it here.');
            return;
        }
        openQuickView('existing_document');
    };
    const shareProgressSnapshot = async () => {
        if (!selectedConversation || selectedConversation.role !== 'seeker')
            return;
        const selectedProgress = progressNotes.find((item) => item.id === selectedProgressId);
        if (!selectedProgress)
            return;
        setActionSaving(true);
        try {
            await sendRichMessage({
                type: 'chart_snapshot',
                version: 1,
                chartKind: 'progress_note',
                chartId: selectedProgress.id,
                title: selectedProgress.title,
                preview: selectedProgress.preview,
            });
            closeQuickActions();
            toast.success('Progress note snapshot shared');
        }
        catch (error) {
            console.error('[chat-interface] shareProgressSnapshot error', error);
            toast.error(error instanceof Error ? error.message : 'Failed to share progress snapshot');
        }
        finally {
            setActionSaving(false);
        }
    };
    const shareTreatmentPlanSnapshot = async () => {
        if (!selectedConversation || selectedConversation.role !== 'seeker')
            return;
        const selectedTreatmentPlan = treatmentPlans.find((item) => item.id === selectedTreatmentPlanId);
        if (!selectedTreatmentPlan)
            return;
        setActionSaving(true);
        try {
            await sendRichMessage({
                type: 'chart_snapshot',
                version: 1,
                chartKind: 'treatment_plan',
                chartId: selectedTreatmentPlan.id,
                title: selectedTreatmentPlan.title,
                preview: selectedTreatmentPlan.preview,
            });
            closeQuickActions();
            toast.success('Treatment plan snapshot shared');
        }
        catch (error) {
            console.error('[chat-interface] shareTreatmentPlanSnapshot error', error);
            toast.error(error instanceof Error ? error.message : 'Failed to share treatment plan snapshot');
        }
        finally {
            setActionSaving(false);
        }
    };
    const shareExistingAttachment = async () => {
        if (!selectedConversation || selectedConversation.role !== 'seeker')
            return;
        const selectedAttachment = existingAttachments.find((item) => item.id === selectedExistingAttachmentId);
        if (!selectedAttachment)
            return;
        setActionSaving(true);
        try {
            await sendRichMessage({
                type: 'attachment',
                version: 1,
                documentId: selectedAttachment.id,
                title: selectedAttachment.title,
                mimeType: selectedAttachment.mimeType,
                sizeBytes: selectedAttachment.sizeBytes,
            });
            closeQuickActions();
            toast.success('Attachment shared');
        }
        catch (error) {
            console.error('[chat-interface] shareExistingAttachment error', error);
            toast.error(error instanceof Error ? error.message : 'Failed to share attachment');
        }
        finally {
            setActionSaving(false);
        }
    };
    const createSessionInvite = async () => {
        if (!selectedConversation || selectedConversation.role !== 'seeker')
            return;
        if (!inviteDateTime) {
            toast.message('Choose date and time first.');
            return;
        }
        setActionSaving(true);
        try {
            const res = await fetch('/api/chat/session-invites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipientId: selectedConversation.id,
                    scheduledAt: new Date(inviteDateTime).toISOString(),
                    durationMinutes: Number(inviteDurationMinutes || 50),
                    locationType: inviteLocationType,
                    locationLabel: inviteLocationLabel || null,
                    telehealthUrl: null,
                    note: inviteNote || null,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data?.error || 'Failed to create session invite');
            // The API returns the raw appointments row in snake_case; we use the form state
            // we just submitted (which is authoritative anyway) to build the rich message.
            const session = data.session;
            const scheduledIso = new Date(inviteDateTime).toISOString();
            const durationMin = Number(inviteDurationMinutes || 50);
            await sendRichMessage({
                type: 'session_invite',
                version: 1,
                sessionId: session.id,
                title: 'Session invite',
                scheduledAt: scheduledIso,
                durationMinutes: durationMin,
                locationType: inviteLocationType,
                locationLabel: inviteLocationLabel || undefined,
                telehealthUrl: undefined,
            });
            closeQuickActions();
            setInviteDateTime('');
            setInviteDurationMinutes('50');
            setInviteLocationType('telehealth');
            setInviteLocationLabel('');
            setInviteNote('');
            toast.success('Session invite sent');
        }
        catch (error) {
            console.error('[chat-interface] createSessionInvite error', error);
            toast.error(error instanceof Error ? error.message : 'Failed to send session invite');
        }
        finally {
            setActionSaving(false);
        }
    };
    const requestDocumentFromClient = async () => {
        if (!selectedConversation || selectedConversation.role !== 'seeker')
            return;
        if (!requestDocumentTitle.trim()) {
            toast.message('Add a document title first.');
            return;
        }
        setActionSaving(true);
        try {
            const requestId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
                ? crypto.randomUUID()
                : `${Date.now()}`;
            await sendRichMessage({
                type: 'document_request',
                version: 1,
                requestId,
                title: requestDocumentTitle.trim(),
                requestedType: requestDocumentType,
                note: requestDocumentNote.trim() || undefined,
            });
            setRequestDocumentNote('');
            closeQuickActions();
            toast.success('Document request sent');
        }
        catch (error) {
            console.error('[chat-interface] requestDocumentFromClient error', error);
            toast.error(error instanceof Error ? error.message : 'Failed to send document request');
        }
        finally {
            setActionSaving(false);
        }
    };
    const assignTaskFromChat = async () => {
        if (!selectedConversation || selectedConversation.role !== 'seeker')
            return;
        if (!taskTitle.trim()) {
            toast.message('Add a task title first.');
            return;
        }
        setActionSaving(true);
        try {
            const dueIso = taskDueDate ? new Date(taskDueDate).toISOString() : '';
            const res = await fetch('/api/tasks/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId: selectedConversation.id,
                    title: taskTitle.trim(),
                    description: taskDescription.trim(),
                    dueDate: dueIso,
                    priority: taskPriority,
                    source: 'chat',
                    sourceContext: {
                        createdFrom: 'chat_quick_actions',
                        conversationUserId: selectedConversation.id,
                    },
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data?.error || 'Failed to assign task');
            await sendRichMessage({
                type: 'task',
                version: 1,
                title: taskTitle.trim(),
                description: taskDescription.trim() || undefined,
                dueDate: data?.task?.due_date || dueIso || undefined,
                taskId: data?.task?.id ? String(data.task.id) : undefined,
                clientId: selectedConversation.id,
                source: 'chat',
            });
            setTaskTitle('');
            setTaskDescription('');
            setTaskDueDate('');
            setTaskPriority('normal');
            closeQuickActions();
            toast.success('Task assigned');
        }
        catch (error) {
            console.error('[chat-interface] assignTaskFromChat error', error);
            toast.error(error instanceof Error ? error.message : 'Failed to assign task');
        }
        finally {
            setActionSaving(false);
        }
    };
    const handleFulfillDocumentRequest = async (requestMessage) => {
        if (!canSeekerRespondToDocumentRequest)
            return;
        setPendingDocumentRequest(requestMessage);
        setSeekerRequestedFile(null);
        setSeekerRequestUploadOpen(true);
    };
    const submitRequestedDocument = async () => {
        if (!selectedConversation || !pendingDocumentRequest || !seekerRequestedFile)
            return;
        setActionSaving(true);
        try {
            await uploadAttachmentToConversation(seekerRequestedFile, {
                requestedType: pendingDocumentRequest.requestedType,
                requestId: pendingDocumentRequest.requestId,
            });
            setSeekerRequestUploadOpen(false);
            setPendingDocumentRequest(null);
            setSeekerRequestedFile(null);
            toast.success('Requested document sent');
        }
        catch (error) {
            console.error('[chat-interface] submitRequestedDocument error', error);
            toast.error(error instanceof Error ? error.message : 'Failed to send requested document');
        }
        finally {
            setActionSaving(false);
        }
    };
    const updateRequestStatus = async (nextStatus) => {
        if (!consultationRequest || !conversationKey)
            return;
        const prevStatus = consultationRequest.status;
        setConsultationRequestStore(consultationRequest.id, {
            ...consultationRequest,
            status: nextStatus,
        });
        const res = await fetch(`/api/consultations/requests/${consultationRequest.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: nextStatus }),
        });
        const data = await res.json();
        if (!res.ok) {
            setConsultationRequestStore(consultationRequest.id, {
                ...consultationRequest,
                status: prevStatus,
            });
            throw new Error(data.error || 'Failed to update request');
        }
    };
    const respondToSessionInvite = async (sessionId, response) => {
        const res = await fetch(`/api/chat/session-invites/${sessionId}/respond`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ response }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok)
            throw new Error(data?.error || 'Failed to respond to invite');
        await sendRichMessage({
            type: 'session_invite_response',
            version: 1,
            sessionId,
            response,
        });
        toast.success(response === 'accepted' ? 'Session invite accepted' : 'Session invite declined');
    };
    const getProfileUrl = () => {
        if (!selectedUserId || !selectedConversation)
            return '#';
        if (selectedConversation.role === 'therapist') {
            return `/seeker/therapists/${selectedUserId}`;
        }
        else {
            return `/therapist/clients/${selectedUserId}`;
        }
    };
    const formatLastSeen = (lastSeenTime) => {
        const seen = new Date(lastSeenTime);
        if (Number.isNaN(seen.getTime()))
            return 'recently';
        const now = new Date();
        const diffMs = now.getTime() - seen.getTime();
        if (diffMs < 0)
            return 'recently';
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        if (diffMins < 1)
            return 'Just now';
        if (diffMins < 60)
            return `${diffMins}m ago`;
        if (diffHours < 24)
            return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };
    const latestConversationActivityAt = useMemo(() => {
        const candidates = [selectedConversation?.last_message_at, messages.at(-1)?.created_at].filter((value) => Boolean(value));
        let latest = null;
        let latestTs = 0;
        for (const iso of candidates) {
            const ts = new Date(iso).getTime();
            if (!Number.isNaN(ts) && ts > latestTs) {
                latestTs = ts;
                latest = iso;
            }
        }
        return latest;
    }, [selectedConversation?.last_message_at, messages]);
    const activityLabel = useMemo(() => {
        if (latestConversationActivityAt)
            return `Active ${formatLastSeen(latestConversationActivityAt)}`;
        return null;
    }, [latestConversationActivityAt]);
    return (<div className="flex h-full overflow-hidden bg-white">
      {(!isMobile || !selectedUserId) && (<ChatSidebar conversations={conversations} selectedUserId={selectedUserId} onSelectConversation={(id) => {
                setSelectedUserId(id);
            }}/>)}

      <div className="flex min-w-0 flex-1 border-r border-slate-200">
        <div className="flex min-w-0 flex-1 flex-col">
        {selectedUserId && selectedConversation ? (<>
            <div className="px-4 sm:px-6 py-3 border-b border-slate-200 bg-white/95 backdrop-blur z-10 shadow-sm">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                {isMobile && (<Button variant="ghost" size="icon" className="shrink-0 -ml-2" onClick={() => {
                    setSelectedUserId(null);
                    router.push('/chat');
                }}>
                    <ArrowLeft className="h-5 w-5"/>
                    <span className="sr-only">Back</span>
                  </Button>)}

                <Avatar className="h-10 w-10 ring-2 ring-white">
                  {(() => {
                const profileImageUrl = (headerOtherAvatarUrl ?? selectedConversation.profile_json?.profile_image_url);
                const initials = selectedConversation.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);
                return (<>
                        {profileImageUrl && (<AvatarImage src={profileImageUrl} alt={selectedConversation.name}/>)}
                        <AvatarFallback className={`text-xs font-bold ${selectedConversation.role === 'therapist'
                        ? 'bg-purple-600 text-white'
                        : 'bg-blue-600 text-white'}`}>
                          {initials}
                        </AvatarFallback>
                      </>);
            })()}
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-slate-900 truncate leading-none">
                      {selectedConversation.name}
                    </h2>
                  </div>
                  {activityLabel && (<p className="text-xs text-slate-500 mt-0.5 truncate">{activityLabel}</p>)}
                </div>

                <div className="shrink-0 flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors rounded-full" disabled={!canUseDmVideo ||
                videoActionLoading ||
                activeDmSessionLoading ||
                (isSeekerToTherapist && !activeDmSessionId)} onClick={() => void handleVideoCallAction()} title={!canUseDmVideo
                ? 'Video call is unavailable for this conversation'
                : isTherapistToSeeker
                    ? activeDmSessionId
                        ? 'Open active video call'
                        : 'Start video call'
                    : activeDmSessionId
                        ? 'Join active video call'
                        : 'Waiting for therapist to start video call'}>
                    {videoActionLoading || activeDmSessionLoading ? (<Loader2 className="h-5 w-5 animate-spin"/>) : (<Video className="h-5 w-5"/>)}
                  </Button>
                  {isTherapistToSeeker && activeDmSessionId ? (<Button variant="ghost" size="icon" className="text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors rounded-full" disabled={videoActionLoading || activeDmSessionLoading} onClick={() => void handleEndQuickSession()} title="End quick session">
                      <PhoneOff className="h-5 w-5"/>
                    </Button>) : null}
                  {showInviteButton && (<Button variant="ghost" size="sm" className="text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors rounded-full text-xs px-3" disabled={sendingInvite} onClick={() => void handleInviteToBecomeClient()} title="Invite to become a client">
                      {sendingInvite ? (<>
                          <Loader2 className="h-4 w-4 animate-spin mr-1"/>
                          Sending...
                        </>) : ('Invite to become a client')}
                    </Button>)}
                  <Link href={getProfileUrl()}>
                    <Button variant="ghost" size="icon" className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors rounded-full">
                      <User className="h-5 w-5"/>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {(isSeekerToTherapist || isTherapistToSeeker) && (isPending || isDeclined) && (<div className="px-4 py-2 border-b border-slate-200 bg-amber-50 text-amber-900 flex items-center gap-3 text-sm">
                <Shield className="h-4 w-4 shrink-0"/>
                <div className="flex-1">
                {isInviteRecipient && isTherapistToSeeker ? (<>
                    <span className="font-semibold">Consultation request.</span> {selectedConversation?.name} wants to become your client.
                    {consultationRequest?.initial_message && (<span className="block text-xs mt-0.5 opacity-80 line-clamp-1">
                        &quot;{consultationRequest.initial_message}&quot;
                      </span>)}
                  </>) : isInviteRecipient && isSeekerToTherapist ? (<>
                    <span className="font-semibold">{selectedConversation?.name} invited you to become their client.</span>
                  </>) : isInitiator && isTherapistToSeeker ? ("Invitation sent — awaiting their response.") : isInitiator && isSeekerToTherapist ? ("Consultation request sent — awaiting therapist response.") : isDeclined ? ("Consultation request declined.") : null}
                </div>
                {isInviteRecipient && (<div className="flex gap-2">
                    <Button size="sm" variant="default" className="h-7 px-3 text-xs bg-amber-600 hover:bg-amber-700 text-white border-0" onClick={() => updateRequestStatus('accepted')}>Accept</Button>
                    <Button size="sm" variant="ghost" className="h-7 px-3 text-xs hover:bg-amber-100 text-amber-900" onClick={() => updateRequestStatus('declined')}>Decline</Button>
                  </div>)}
              </div>)}

            {endedQuickSessionForThread && showEndedQuickSessionBanner && (<div className="px-4 py-3 border-b border-blue-200 bg-blue-50 text-blue-900 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">Quick session ended</p>
                    <p className="mt-1 text-blue-800">
                      Started {new Date(endedQuickSessionForThread.startedAt).toLocaleString()} •{' '}
                      {endedQuickSessionForThread.durationMinutes} min planned • Status:{' '}
                      {endedQuickSessionForThread.status.replace('_', ' ')}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Link href={currentUserRole === 'therapist'
                    ? `/therapist/sessions/${endedQuickSessionForThread.sessionId}`
                    : `/seeker/sessions/${endedQuickSessionForThread.sessionId}`} className="text-xs font-medium underline underline-offset-2">
                        View session details
                      </Link>
                      <button type="button" className="text-xs font-medium underline underline-offset-2" onClick={() => void handleVideoCallAction()}>
                        Start another quick call
                      </button>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-blue-900 hover:bg-blue-100" onClick={() => setShowEndedQuickSessionBanner(false)}>
                    Dismiss
                  </Button>
                </div>
              </div>)}

            {(<>
                <MessageList messages={messages} loading={loading} currentUserId={currentUserId} currentUserName={currentUserName} currentUserProfileImageUrl={currentUserProfileImageUrl} otherUserId={selectedConversation.id} otherUserName={selectedConversation.name} otherUserRole={selectedConversation.role} otherUserProfileImageUrl={selectedConversation.profile_json?.profile_image_url || null} activeQuickSessionId={activeDmSessionId} consultationRequest={consultationRequest} consultationLocked={isConsultationLocked} currentUserRole={currentUserRole} onRespondToSessionInvite={respondToSessionInvite} onFulfillDocumentRequest={handleFulfillDocumentRequest}/>

                <MessageInput onSend={handleSendMessage} onAttachmentSelect={handleSendAttachment} attachmentUploading={attachmentUploading} showAttachmentButton={canUseAttachments} onActionsClick={handleActionsButton} showActionsButton={showActionsButton} placeholder="Message…"/>
              </>)}
          </>) : (<div className="flex-1 flex items-center justify-center bg-white">
            <div className="mx-auto max-w-md text-center px-6">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
                <MessageSquare className="h-10 w-10 text-slate-400"/>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Your Messages</h3>
              <p className="mt-2 text-sm text-slate-500">
                Send private messages to your therapist or seeker.
              </p>
              <Button variant="default" className="mt-6 rounded-full bg-blue-600 hover:bg-blue-700" onClick={() => {
                // If mobile, show sidebar. If desktop, just focus search (conceptually)
                if (isMobile) {
                    router.push('/chat');
                }
            }}>
                Start a conversation
              </Button>
            </div>
          </div>)}
        </div>
      </div>

      <Dialog open={quickActionsOpen} onOpenChange={(open) => {
            if (!open)
                closeQuickActions();
            else
                openQuickMenu();
        }}>
        <DialogContent className="sm:max-w-lg rounded-2xl border-slate-200 p-0 overflow-hidden">
          <DialogHeader>
            <div className="bg-gradient-to-r from-slate-50 to-white px-6 py-4 border-b border-slate-200">
            <DialogTitle className="text-slate-900">Quick actions</DialogTitle>
            <DialogDescription className="text-slate-600">
              Send charts, session invites, requests, and tasks without leaving chat.
            </DialogDescription>
            </div>
          </DialogHeader>

          <div className="px-6 pb-6 space-y-4">

          {quickActionsView !== 'menu' ? (<Button type="button" variant="ghost" className="w-fit -ml-2" onClick={() => openQuickMenu()}>
              <ArrowLeft className="h-4 w-4 mr-1"/>
              Back
            </Button>) : null}

          {quickActionsView === 'menu' ? (<div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="list" aria-label="Quick action options">
              <Button type="button" variant="outline" className="justify-start gap-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300" onClick={openProgressShareOrRedirect}>
                <ClipboardList className="h-4 w-4"/>
                Share progress note
              </Button>
              <Button type="button" variant="outline" className="justify-start gap-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300" onClick={openTreatmentPlanShareOrRedirect}>
                <ClipboardList className="h-4 w-4"/>
                Share treatment plan
              </Button>
              <Button type="button" variant="outline" className="justify-start gap-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300" onClick={openExistingDocumentShare}>
                <FileText className="h-4 w-4"/>
                Share existing document
              </Button>
              <Button type="button" variant="outline" className="justify-start gap-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300" onClick={() => openQuickView('invite')}>
                <CalendarPlus className="h-4 w-4"/>
                Send session invite
              </Button>
              <Button type="button" variant="outline" className="justify-start gap-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300" onClick={() => openQuickView('request_document')}>
                <FileText className="h-4 w-4"/>
                Request document
              </Button>
              <Button type="button" variant="outline" className="justify-start gap-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300" onClick={() => openQuickView('task')}>
                <ClipboardList className="h-4 w-4"/>
                Assign task
              </Button>
            </div>) : null}

          {quickActionsView === 'progress' ? (<div className="space-y-3">
              <Label htmlFor="quick-progress-select">Progress note</Label>
              <Select value={selectedProgressId} onValueChange={setSelectedProgressId}>
                <SelectTrigger id="quick-progress-select" aria-label="Choose progress note">
                  <SelectValue placeholder={shareablesLoading ? 'Loading progress notes...' : 'Select progress note'}/>
                </SelectTrigger>
                <SelectContent>
                  {progressNotes.map((item) => (<SelectItem key={item.id} value={item.id}>
                      {item.title}
                    </SelectItem>))}
                </SelectContent>
              </Select>
            </div>) : null}

          {quickActionsView === 'treatment_plan' ? (<div className="space-y-3">
              <Label htmlFor="quick-treatment-plan-select">Treatment plan</Label>
              <Select value={selectedTreatmentPlanId} onValueChange={setSelectedTreatmentPlanId}>
                <SelectTrigger id="quick-treatment-plan-select" aria-label="Choose treatment plan">
                  <SelectValue placeholder={shareablesLoading ? 'Loading treatment plans...' : 'Select treatment plan'}/>
                </SelectTrigger>
                <SelectContent>
                  {treatmentPlans.map((item) => (<SelectItem key={item.id} value={item.id}>
                      {item.title}
                    </SelectItem>))}
                </SelectContent>
              </Select>
            </div>) : null}

          {quickActionsView === 'existing_document' ? (<div className="space-y-3">
              <Label htmlFor="quick-existing-document-select">Previously shared attachment</Label>
              <Select value={selectedExistingAttachmentId} onValueChange={setSelectedExistingAttachmentId}>
                <SelectTrigger id="quick-existing-document-select" aria-label="Choose existing attachment">
                  <SelectValue placeholder={shareablesLoading ? 'Loading attachments...' : 'Select attachment'}/>
                </SelectTrigger>
                <SelectContent>
                  {existingAttachments.map((item) => (<SelectItem key={item.id} value={item.id}>
                      {item.title}
                    </SelectItem>))}
                </SelectContent>
              </Select>
            </div>) : null}

          {quickActionsView === 'invite' ? (<div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="quick-invite-datetime">Date and time</Label>
                <Input id="quick-invite-datetime" type="datetime-local" value={inviteDateTime} onChange={(e) => setInviteDateTime(e.target.value)}/>
              </div>
              <div className="space-y-1">
                <Label htmlFor="quick-invite-duration">Duration (minutes)</Label>
                <Input id="quick-invite-duration" type="number" min={15} step={5} value={inviteDurationMinutes} onChange={(e) => setInviteDurationMinutes(e.target.value)}/>
              </div>
              <div className="space-y-1">
                <Label htmlFor="quick-invite-location-type">Location type</Label>
                <Select value={inviteLocationType} onValueChange={(value) => setInviteLocationType(value)}>
                  <SelectTrigger id="quick-invite-location-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="telehealth">Telehealth</SelectItem>
                    <SelectItem value="in_person">In person</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {inviteLocationType === 'telehealth' ? (<div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  Telehealth invites use the built-in video room link.
                </div>) : (<div className="space-y-1">
                  <Label htmlFor="quick-invite-location-label">Location details (optional)</Label>
                  <Input id="quick-invite-location-label" value={inviteLocationLabel} onChange={(e) => setInviteLocationLabel(e.target.value)} placeholder="Clinic room / address"/>
                </div>)}
              <div className="space-y-1">
                <Label htmlFor="quick-invite-note">Invite note (optional)</Label>
                <Textarea id="quick-invite-note" rows={3} value={inviteNote} onChange={(e) => setInviteNote(e.target.value)} placeholder="Message to include with invite"/>
              </div>
            </div>) : null}

          {quickActionsView === 'request_document' ? (<div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="quick-request-document-type">Required document type</Label>
                <Select value={requestDocumentType} onValueChange={setRequestDocumentType}>
                  <SelectTrigger id="quick-request-document-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="insurance_card">Insurance card</SelectItem>
                    <SelectItem value="id_verification">ID verification</SelectItem>
                    <SelectItem value="consent_form">Consent form</SelectItem>
                    <SelectItem value="intake_form">Intake form</SelectItem>
                    <SelectItem value="lab_report">Lab report</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="quick-request-document-title">Title</Label>
                <Input id="quick-request-document-title" value={requestDocumentTitle} onChange={(e) => setRequestDocumentTitle(e.target.value)} placeholder="What do you need from the client?"/>
              </div>
              <div className="space-y-1">
                <Label htmlFor="quick-request-document-note">Instructions (optional)</Label>
                <Textarea id="quick-request-document-note" rows={3} value={requestDocumentNote} onChange={(e) => setRequestDocumentNote(e.target.value)} placeholder="Add upload instructions"/>
              </div>
            </div>) : null}

          {quickActionsView === 'task' ? (<div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="quick-task-title">Task title</Label>
                <Input id="quick-task-title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Example: Complete breathing exercise"/>
              </div>
              <div className="space-y-1">
                <Label htmlFor="quick-task-priority">Priority</Label>
                <Select value={taskPriority} onValueChange={(value) => setTaskPriority(value)}>
                  <SelectTrigger id="quick-task-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="quick-task-due">Due date (optional)</Label>
                <Input id="quick-task-due" type="datetime-local" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)}/>
              </div>
              <div className="space-y-1">
                <Label htmlFor="quick-task-description">Description (optional)</Label>
                <Textarea id="quick-task-description" rows={3} value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} placeholder="Add practical steps the client should follow"/>
              </div>
            </div>) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => closeQuickActions()} disabled={actionSaving}>
              Cancel
            </Button>
            {quickActionsView === 'progress' ? (<Button type="button" onClick={() => void shareProgressSnapshot()} disabled={actionSaving || !selectedProgressId}>
                {actionSaving ? 'Sharing...' : 'Share progress'}
              </Button>) : null}
            {quickActionsView === 'treatment_plan' ? (<Button type="button" onClick={() => void shareTreatmentPlanSnapshot()} disabled={actionSaving || !selectedTreatmentPlanId}>
                {actionSaving ? 'Sharing...' : 'Share treatment plan'}
              </Button>) : null}
            {quickActionsView === 'existing_document' ? (<Button type="button" onClick={() => void shareExistingAttachment()} disabled={actionSaving || !selectedExistingAttachmentId}>
                {actionSaving ? 'Sharing...' : 'Share document'}
              </Button>) : null}
            {quickActionsView === 'invite' ? (<Button type="button" onClick={() => void createSessionInvite()} disabled={actionSaving || !inviteDateTime}>
                {actionSaving ? 'Sending...' : 'Send invite'}
              </Button>) : null}
            {quickActionsView === 'request_document' ? (<Button type="button" onClick={() => void requestDocumentFromClient()} disabled={actionSaving || !requestDocumentTitle.trim()}>
                {actionSaving ? 'Sending...' : 'Send request'}
              </Button>) : null}
            {quickActionsView === 'task' ? (<Button type="button" onClick={() => void assignTaskFromChat()} disabled={actionSaving || !taskTitle.trim()}>
                {actionSaving ? 'Assigning...' : 'Assign task'}
              </Button>) : null}
          </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={seekerRequestUploadOpen} onOpenChange={setSeekerRequestUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send requested document</DialogTitle>
            <DialogDescription>
              {pendingDocumentRequest
            ? `${pendingDocumentRequest.title} (${pendingDocumentRequest.requestedType})`
            : 'Upload the requested document.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {pendingDocumentRequest?.note ? (<p className="text-xs text-slate-600 whitespace-pre-wrap">{pendingDocumentRequest.note}</p>) : null}
            <div className="space-y-1">
              <Label htmlFor="requested-doc-file">File</Label>
              <Input id="requested-doc-file" type="file" accept={CHAT_ATTACHMENT_ACCEPT} onChange={(e) => setSeekerRequestedFile(e.target.files?.[0] ?? null)}/>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSeekerRequestUploadOpen(false)} disabled={actionSaving}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void submitRequestedDocument()} disabled={actionSaving || !seekerRequestedFile}>
              {actionSaving ? 'Sending...' : 'Send document'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedUserId && selectedConversation ? (<aside className="hidden xl:flex w-80 shrink-0 flex-col bg-white border-l border-slate-200 overflow-y-auto">
          <div className="px-4 py-6 flex flex-col items-center border-b border-slate-100">
            <Avatar className="h-24 w-24 ring-4 ring-slate-50 mb-3">
              {headerOtherAvatarUrl ? (<AvatarImage src={headerOtherAvatarUrl} alt={selectedConversation.name}/>) : null}
              <AvatarFallback className="text-2xl font-bold bg-slate-100 text-slate-400">
                {selectedConversation.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <h3 className="text-lg font-bold text-slate-900 text-center px-4">
              {selectedConversation.name}
            </h3>
            <p className="text-sm text-slate-500 capitalize mt-0.5">
              {selectedConversation.role}
            </p>
          </div>

          <div className="flex-1">
            <AccordionItem title={`Shared files${sharedFiles.length ? ` (${sharedFiles.length})` : ''}`} icon={FileText} defaultOpen>
              {sharedFilesLoading ? (<div className="px-2 py-3 text-xs text-slate-500">Loading…</div>) : sharedFiles.length === 0 ? (<div className="px-2 py-3 text-xs text-slate-500">
                  No files shared yet. Use the paperclip on the message bar to send one.
                </div>) : (<ul className="space-y-1 py-1">
                  {sharedFiles.map((f) => {
                    const sizeMb = f.fileSizeBytes ? (f.fileSizeBytes / 1024 / 1024).toFixed(1) : null;
                    return (<li key={f.id}>
                        <a href={`/api/documents/${f.id}/download`} target="_blank" rel="noreferrer" className="flex items-start gap-3 rounded px-2 py-2 hover:bg-slate-50">
                          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded bg-slate-100 text-slate-700">
                            <FileText className="h-4 w-4"/>
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-slate-900">
                              {f.fileName}
                            </span>
                            <span className="block text-[11px] text-slate-500">
                              {f.direction === 'outgoing' ? 'Sent' : 'Received'} ·{' '}
                              {new Date(f.createdAt).toLocaleDateString()}
                              {sizeMb ? ` · ${sizeMb} MB` : ''}
                            </span>
                          </span>
                        </a>
                      </li>);
                })}
                </ul>)}
            </AccordionItem>
            <AccordionItem title="Privacy & support" icon={Shield}>
              <div className="space-y-1 py-1">
                <button className="flex w-full items-center gap-3 py-2 text-slate-600 hover:bg-slate-50 rounded px-2">
                  <Bell className="h-4 w-4"/>
                  Mute notifications
                </button>
                <button className="flex w-full items-center gap-3 py-2 text-amber-600 hover:bg-amber-50 rounded px-2">
                  <Shield className="h-4 w-4"/>
                  Report
                </button>
                <button className="flex w-full items-center gap-3 py-2 text-red-600 hover:bg-red-50 rounded px-2">
                  <Shield className="h-4 w-4"/>
                  Block
                </button>
              </div>
            </AccordionItem>
          </div>
        </aside>) : null}

    </div>);
}
