'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/2318256b5648';
import { Input } from '@/components/c2f62fb0cb5e';
import { MessageSquare, Search } from 'lucide-react';
export default function ChatSidebar({ conversations, selectedUserId, onSelectConversation, }) {
    const [query, setQuery] = useState('');
    const getProfileImageUrl = (conversation) => {
        return conversation.profile_json?.profile_image_url;
    };
    const getInitials = (name) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };
    const formatRowTime = (iso) => {
        const d = new Date(iso);
        const now = new Date();
        const isToday = d.toDateString() === now.toDateString();
        if (isToday) {
            return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        }
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q)
            return conversations;
        return conversations.filter((c) => {
            return (c.name.toLowerCase().includes(q) ||
                c.role.toLowerCase().includes(q) ||
                c.last_message.toLowerCase().includes(q));
        });
    }, [conversations, query]);
    return (<div className="w-full sm:w-96 md:w-80 border-r border-slate-200 bg-white flex flex-col">
      <div className="px-4 py-3 bg-white">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"/>
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search messages" className="h-10 pl-9 rounded-full bg-slate-100 border-none focus-visible:ring-1 focus-visible:ring-slate-300 placeholder:text-slate-500"/>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (<div className="px-6 py-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-slate-400"/>
            </div>
            <p className="text-sm font-medium text-slate-900 mb-1">
              {conversations.length === 0 ? 'No conversations yet' : 'No results'}
            </p>
            <p className="text-xs text-slate-500">
              {conversations.length === 0
                ? 'Start messaging your therapist or seeker'
                : 'Try a different search'}
            </p>
          </div>) : (<div className="px-2 py-1 space-y-0.5">
            {filtered.map((conversation) => {
                const profileImageUrl = getProfileImageUrl(conversation);
                const initials = getInitials(conversation.name);
                const isSelected = selectedUserId === conversation.id;
                const hasUnread = conversation.unread_count > 0;
                const unreadLabel = conversation.unread_count >= 4 ? '4+' : String(conversation.unread_count);
                return (<Link key={conversation.id} href={`/chat?with=${conversation.id}`} onClick={() => onSelectConversation(conversation.id)} className={[
                        'group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all duration-200 cursor-pointer',
                        isSelected
                            ? 'bg-slate-100 shadow-sm ring-1 ring-slate-200/80'
                            : 'hover:bg-slate-50 active:bg-slate-100',
                    ].join(' ')}>
                  <div className="relative shrink-0">
                    <Avatar className="h-12 w-12 ring-2 ring-white shadow-sm">
                      {profileImageUrl && (<AvatarImage src={profileImageUrl} alt={conversation.name}/>)}
                      <AvatarFallback className={`text-sm font-semibold ${conversation.role === 'therapist'
                        ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white'
                        : 'bg-gradient-to-br from-sky-500 to-blue-600 text-white'}`}>
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="flex items-baseline gap-1.5 min-w-0">
                        <h3 className={`text-sm truncate ${hasUnread ? 'font-semibold text-slate-900' : 'font-medium text-slate-800'}`}>
                          {conversation.name}
                        </h3>
                        <span className="text-slate-300 shrink-0" aria-hidden>·</span>
                        <span className={`shrink-0 text-[10px] font-medium uppercase tracking-wide ${conversation.role === 'therapist' ? 'text-violet-500' : 'text-sky-600'}`} aria-label={conversation.role}>
                          {conversation.role}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 shrink-0 tabular-nums">
                        {conversation.last_message_at ? formatRowTime(conversation.last_message_at) : ''}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <p className="text-xs text-slate-500 truncate flex-1">
                        {conversation.last_message || 'No messages yet'}
                      </p>
                      {hasUnread && (<span className="shrink-0 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-semibold text-white">
                          {unreadLabel}
                        </span>)}
                    </div>
                  </div>
                </Link>);
            })}
          </div>)}
      </div>
    </div>);
}
