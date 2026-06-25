'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/components/e7335a071b71';
import { useRealtimeGroupChat } from '@/components/8b16d2798643';
import { Button } from '@/components/2795b661f080';
import { Textarea } from '@/components/e1d2ad49fd73';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/2318256b5648';
import { MessageSquare, Send, Circle } from 'lucide-react';
import { getProfileImageUrl } from '@/components/98e56006aa84';
import { AnimatePresence, motion } from 'framer-motion';
function initials(name) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] || 'U';
    const b = parts[1]?.[0] || '';
    return (a + b).toUpperCase();
}
function formatClock(iso) {
    if (!iso)
        return '';
    const t = Date.parse(iso);
    if (!Number.isFinite(t))
        return '';
    return new Date(t).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
function formatDay(iso) {
    if (!iso)
        return '';
    const t = Date.parse(iso);
    if (!Number.isFinite(t))
        return '';
    return new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
export function CommunityGroupChat({ groupId }) {
    const supabase = useMemo(() => createClient(), []);
    const [currentUser, setCurrentUser] = useState(null);
    const [input, setInput] = useState('');
    const [senderMeta, setSenderMeta] = useState({});
    const endRef = useRef(null);
    const { messages, loading, error, sendMessage } = useRealtimeGroupChat(groupId);
    useEffect(() => {
        void (async () => {
            const { data } = await supabase.auth.getUser();
            if (!data.user?.id)
                return;
            const { data: me } = await supabase
                .from('user_profiles')
                .select('user_id, full_name, profile_image_url')
                .eq('user_id', data.user.id)
                .single();
            if (!me?.user_id || !me?.full_name)
                return;
            setCurrentUser({
                id: me.user_id,
                name: me.full_name,
                profileImageUrl: me.profile_image_url ?? null,
            });
        })();
    }, [supabase]);
    useEffect(() => {
        const missingIds = Array.from(new Set(messages
            .map((m) => m.senderId)
            .filter((id) => Boolean(id && !senderMeta[id])))).slice(0, 20);
        if (missingIds.length === 0)
            return;
        void (async () => {
            const { data } = await supabase
                .from('user_profiles')
                .select('user_id, full_name, profile_image_url')
                .in('user_id', missingIds);
            if (!data?.length)
                return;
            const next = {};
            for (const row of data) {
                if (!row.user_id || !row.full_name)
                    continue;
                next[row.user_id] = {
                    name: row.full_name,
                    profileImageUrl: row.profile_image_url ?? null,
                };
            }
            setSenderMeta((prev) => ({ ...prev, ...next }));
        })();
    }, [messages, senderMeta, supabase]);
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]);
    const getName = (m) => m.sender?.name || senderMeta[m.senderId]?.name || 'Member';
    const getAvatarUrl = (m) => {
        const senderImage = getProfileImageUrl(m.sender?.profileJson);
        return senderImage ?? senderMeta[m.senderId]?.profileImageUrl ?? null;
    };
    const isMine = (m) => Boolean(currentUser?.id && m.senderId === currentUser.id);
    const isGroupedWithPrev = (idx) => {
        if (idx === 0)
            return false;
        const prev = messages[idx - 1];
        const cur = messages[idx];
        if (!prev || !cur || prev.senderId !== cur.senderId)
            return false;
        const a = Date.parse(prev.createdAt || '');
        const b = Date.parse(cur.createdAt || '');
        if (!Number.isFinite(a) || !Number.isFinite(b))
            return true;
        return Math.abs(b - a) < 2 * 60 * 1000;
    };
    const isGroupedWithNext = (idx) => {
        if (idx >= messages.length - 1)
            return false;
        const next = messages[idx + 1];
        const cur = messages[idx];
        if (!next || !cur || next.senderId !== cur.senderId)
            return false;
        const a = Date.parse(cur.createdAt || '');
        const b = Date.parse(next.createdAt || '');
        if (!Number.isFinite(a) || !Number.isFinite(b))
            return true;
        return Math.abs(b - a) < 2 * 60 * 1000;
    };
    const showDayDivider = (idx) => {
        if (idx === 0)
            return true;
        const prevDay = formatDay(messages[idx - 1]?.createdAt);
        const curDay = formatDay(messages[idx]?.createdAt);
        return prevDay !== curDay;
    };
    const submit = async () => {
        const trimmed = input.trim();
        if (!trimmed)
            return;
        setInput('');
        await sendMessage(trimmed);
    };
    return (<div className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
        <div className="relative">
          <Avatar className="h-8 w-8">
            <AvatarImage src={currentUser?.profileImageUrl ?? undefined}/>
            <AvatarFallback className="bg-indigo-50 text-indigo-600 text-xs">{initials(currentUser?.name ?? 'You')}</AvatarFallback>
          </Avatar>
          <Circle className="absolute bottom-0 right-0 h-3 w-3 fill-emerald-500 text-emerald-500 ring-2 ring-white"/>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">Community Chat</p>
          <p className="text-xs text-gray-400">Live · {currentUser?.name ?? ''}</p>
        </div>
      </div>

      <div className="relative flex-1 overflow-y-auto bg-gray-50 px-4 py-4 dark:bg-gray-950/50">
        {loading ? (<div className="flex h-full flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"/>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Syncing messages...</p>
          </div>) : error ? (<div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>) : messages.length === 0 ? (<div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm dark:bg-gray-800">
              <MessageSquare className="h-7 w-7 text-gray-400"/>
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white">No messages yet</h4>
            <p className="mt-1 max-w-[240px] text-sm text-gray-500">Start the conversation with your community peers.</p>
          </div>) : (<div className="space-y-1">
            <AnimatePresence initial={false}>
              {messages.map((m, idx) => {
                const mine = isMine(m);
                const senderName = getName(m);
                const senderImage = getAvatarUrl(m);
                const showMeta = !isGroupedWithPrev(idx);
                const groupedNext = isGroupedWithNext(idx);
                return (<motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`${showMeta ? 'pt-3' : 'pt-0.5'}`}>
                    {showDayDivider(idx) ? (<div className="mb-3 flex justify-center">
                        <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] font-medium text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                          {formatDay(m.createdAt)}
                        </span>
                      </div>) : null}

                    <div className={`flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
                      {!mine ? (showMeta ? (<Avatar className="h-7 w-7 shrink-0">
                            <AvatarImage src={senderImage ?? undefined} alt={senderName}/>
                            <AvatarFallback className="text-[10px]">{initials(senderName)}</AvatarFallback>
                          </Avatar>) : (<div className="h-7 w-7 shrink-0"/>)) : null}

                      <div className={`max-w-[82%] sm:max-w-[70%] ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
                        {showMeta && !mine ? (<p className="mb-1 px-1 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                            {senderName}
                          </p>) : null}

                        <div className={[
                        'px-3.5 py-2.5 text-[14.5px] leading-relaxed shadow-sm',
                        mine
                            ? 'bg-indigo-600 text-white'
                            : 'border border-gray-100 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100',
                        mine
                            ? showMeta
                                ? 'rounded-[18px] rounded-br-md'
                                : groupedNext
                                    ? 'rounded-[18px] rounded-tr-md rounded-br-md'
                                    : 'rounded-[18px] rounded-tr-md'
                            : showMeta
                                ? 'rounded-[18px] rounded-bl-md'
                                : groupedNext
                                    ? 'rounded-[18px] rounded-tl-md rounded-bl-md'
                                    : 'rounded-[18px] rounded-tl-md',
                    ].join(' ')}>
                          <p className="whitespace-pre-wrap break-words">{m.content}</p>
                        </div>

                        {(showMeta || !groupedNext) ? (<p className={`mt-1 px-1 text-[10px] text-gray-400 ${mine ? 'text-right' : 'text-left'}`}>
                            {formatClock(m.createdAt)}
                          </p>) : null}
                      </div>
                    </div>
                  </motion.div>);
            })}
            </AnimatePresence>
            <div ref={endRef} className="h-1"/>
          </div>)}
      </div>

      <div className="border-t border-gray-100 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-800/60">
          <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." rows={1} className="min-h-[42px] max-h-[120px] flex-1 resize-none border-0 bg-transparent px-1.5 py-2.5 text-[14.5px] text-gray-900 placeholder:text-gray-400 focus-visible:ring-0 dark:text-white" onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void submit();
            }
        }}/>
          <Button onClick={() => void submit()} size="icon" className="h-9 w-9 shrink-0 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50" disabled={!input.trim()}>
            <Send className="h-4.5 w-4.5"/>
          </Button>
        </div>
      </div>
    </div>);
}
