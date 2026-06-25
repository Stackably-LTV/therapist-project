'use client';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/2795b661f080';
import { Textarea } from '@/components/e1d2ad49fd73';
import { Send, Loader2, ThumbsUp, Paperclip } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/943378a021ef';
import { CHAT_ATTACHMENT_ACCEPT } from '@/components/bc9ddfa866a2';
export default function MessageInput({ onSend, onAttachmentSelect, disabled = false, attachmentUploading = false, showAttachmentButton = false, placeholder = 'Message…', onActionsClick, showActionsButton = false, actionsDisabled = false, actionsDisabledReason = '', }) {
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const handleSend = async () => {
        if (disabled || !message.trim()) {
            if (!message.trim() && !disabled && !sending) {
                // Handle Thumbs Up logic here if desired, or just return
                await onSend('👍');
                return;
            }
            return;
        }
        if (sending)
            return;
        setSending(true);
        try {
            await onSend(message);
            setMessage('');
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        }
        catch (error) {
            console.error('Failed to send message:', error);
        }
        finally {
            setSending(false);
        }
    };
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    const triggerAttachmentPicker = () => {
        if (disabled || attachmentUploading || !onAttachmentSelect)
            return;
        fileInputRef.current?.click();
    };
    const handleAttachmentChange = async (e) => {
        if (!onAttachmentSelect || disabled || attachmentUploading)
            return;
        const file = e.target.files?.[0];
        e.currentTarget.value = '';
        if (!file)
            return;
        await onAttachmentSelect(file);
    };
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [message]);
    return (<div className="px-4 py-3 bg-white border-t border-slate-100 relative">
      <input ref={fileInputRef} type="file" accept={CHAT_ATTACHMENT_ACCEPT} className="hidden" onChange={(e) => void handleAttachmentChange(e)}/>
      <div className="flex items-end gap-2">
        <div className="flex items-end gap-1 mb-1">
          {showAttachmentButton ? (<Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50 rounded-full" disabled={disabled || attachmentUploading} onClick={triggerAttachmentPicker} aria-label="Attach file">
              {attachmentUploading ? (<Loader2 className="h-5 w-5 animate-spin"/>) : (<Paperclip className="h-5 w-5"/>)}
            </Button>) : null}
          {showActionsButton ? (<TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="shrink-0">
                    <Button type="button" variant="outline" size="sm" className="h-8 px-3 rounded-full shrink-0 border-green-600 bg-green-600 text-white hover:bg-green-700 hover:border-green-700 disabled:opacity-60 disabled:cursor-not-allowed" disabled={disabled || actionsDisabled} onClick={onActionsClick} aria-label="Open quick actions">
                      Actions
                    </Button>
                  </span>
                </TooltipTrigger>
                {actionsDisabled && actionsDisabledReason ? (<TooltipContent>
                    <p>{actionsDisabledReason}</p>
                  </TooltipContent>) : null}
              </Tooltip>
            </TooltipProvider>) : null}
        </div>

        <div className="flex-1 relative bg-slate-100 rounded-[20px] transition-colors focus-within:bg-slate-200/50 flex items-center min-h-[40px]">
          <Textarea ref={textareaRef} value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={handleKeyPress} placeholder={placeholder} disabled={disabled || sending} rows={1} className="flex-1 w-full resize-none border-0 bg-transparent px-4 py-2.5 text-[15px] focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-slate-500 disabled:opacity-50 min-h-[40px] max-h-[120px] leading-5 rounded-[20px]"/>
        </div>

        <div className="mb-1 shrink-0">
          {(message.trim() || sending) ? (<Button onClick={() => handleSend()} disabled={disabled || sending} size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:bg-blue-50 rounded-full transition-all">
              {sending ? (<Loader2 className="h-6 w-6 animate-spin"/>) : (<Send className="h-6 w-6 fill-current"/>)}
            </Button>) : (<Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50 rounded-full" disabled={disabled} onClick={() => handleSend()}>
              <ThumbsUp className="h-6 w-6 fill-current"/>
            </Button>)}
        </div>
      </div>
    </div>);
}
