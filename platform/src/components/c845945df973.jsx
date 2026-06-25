'use client';
import { useCallback, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/components/98e56006aa84';
export function FileDropzone({ accept, disabled, hint, onFile, className, }) {
    const inputRef = useRef(null);
    const [dragging, setDragging] = useState(false);
    const pick = () => {
        if (disabled)
            return;
        inputRef.current?.click();
    };
    const handleFiles = useCallback((files) => {
        const file = files?.[0];
        if (!file)
            return;
        void onFile(file);
    }, [onFile]);
    return (<div className={cn('group relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-gray-50 px-4 py-8 text-center transition', dragging ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:bg-gray-100', disabled ? 'cursor-not-allowed opacity-60' : '', className)} role="button" tabIndex={0} onClick={pick} onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ')
                pick();
        }} onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (disabled)
                return;
            setDragging(true);
        }} onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
        }} onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragging(false);
        }} onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragging(false);
            if (disabled)
                return;
            handleFiles(e.dataTransfer.files);
        }}>
      <input ref={inputRef} type="file" className="hidden" accept={accept} disabled={disabled} onChange={(e) => handleFiles(e.target.files)}/>

      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
        <Upload className="h-5 w-5 text-gray-700"/>
      </div>
      <div className="text-sm font-medium text-gray-900">Drop a file here, or click to browse</div>
      {hint ? <div className="text-xs text-gray-600">{hint}</div> : null}
    </div>);
}
