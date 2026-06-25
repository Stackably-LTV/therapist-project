'use client';
import { useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/2795b661f080';
import { Textarea } from '@/components/e1d2ad49fd73';
import { cn } from '@/components/98e56006aa84';
function applyCommand(text, selectionStart, selectionEnd, cmd) {
    const before = text.slice(0, selectionStart);
    const selected = text.slice(selectionStart, selectionEnd);
    const after = text.slice(selectionEnd);
    if (cmd.kind === 'wrap') {
        const next = `${before}${cmd.left}${selected || ''}${cmd.right}${after}`;
        const cursorStart = selectionStart + cmd.left.length;
        const cursorEnd = cursorStart + (selected || '').length;
        return { next, nextSelectionStart: cursorStart, nextSelectionEnd: cursorEnd };
    }
    if (cmd.kind === 'prefixLine') {
        const lineStart = before.lastIndexOf('\n') + 1;
        const nextBefore = text.slice(0, lineStart);
        const lineRest = text.slice(lineStart, selectionEnd);
        const next = `${nextBefore}${cmd.prefix}${lineRest}${after}`;
        const delta = cmd.prefix.length;
        return {
            next,
            nextSelectionStart: selectionStart + delta,
            nextSelectionEnd: selectionEnd + delta,
        };
    }
    const next = `${before}${cmd.text}${after}`;
    const cursor = selectionStart + cmd.text.length;
    return { next, nextSelectionStart: cursor, nextSelectionEnd: cursor };
}
export function MarkdownRichEditor({ value, onChange, disabled, className, placeholder, }) {
    const textareaRef = useRef(null);
    const [mode, setMode] = useState('edit');
    const preview = useMemo(() => value.trim(), [value]);
    const run = (cmd) => {
        const el = textareaRef.current;
        if (!el)
            return;
        const { next, nextSelectionStart, nextSelectionEnd } = applyCommand(value, el.selectionStart, el.selectionEnd, cmd);
        onChange(next);
        requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(nextSelectionStart, nextSelectionEnd);
        });
    };
    return (<div className={cn('rounded-xl border bg-white', className)}>
      <div className="flex flex-wrap items-center gap-2 border-b p-2">
        <div className="flex flex-wrap items-center gap-1">
          <Button type="button" variant="outline" size="sm" disabled={disabled || mode !== 'edit'} onClick={() => run({ kind: 'wrap', left: '**', right: '**' })}>
            Bold
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={disabled || mode !== 'edit'} onClick={() => run({ kind: 'wrap', left: '*', right: '*' })}>
            Italic
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={disabled || mode !== 'edit'} onClick={() => run({ kind: 'wrap', left: '`', right: '`' })}>
            Code
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={disabled || mode !== 'edit'} onClick={() => run({ kind: 'prefixLine', prefix: '- ' })}>
            List
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={disabled || mode !== 'edit'} onClick={() => run({ kind: 'insert', text: '[link text](https://)' })}>
            Link
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <Button type="button" variant={mode === 'edit' ? 'default' : 'outline'} size="sm" onClick={() => setMode('edit')}>
            Edit
          </Button>
          <Button type="button" variant={mode === 'preview' ? 'default' : 'outline'} size="sm" onClick={() => setMode('preview')}>
            Preview
          </Button>
        </div>
      </div>

      {mode === 'edit' ? (<Textarea ref={textareaRef} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} placeholder={placeholder ?? 'Write in Markdown…'} className="min-h-[220px] resize-y border-0 focus-visible:ring-0"/>) : (<div className="prose prose-sm max-w-none p-4">
          {preview ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{preview}</ReactMarkdown> : <div className="text-sm text-muted-foreground">Nothing to preview.</div>}
        </div>)}
    </div>);
}
