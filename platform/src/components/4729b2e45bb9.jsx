'use client';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/2795b661f080';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from '@/components/ba221113eac7';
import { Input } from '@/components/c2f62fb0cb5e';
import { Label } from '@/components/78846397f3ca';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/93bde5168d2a';
import { Eraser, PenLine } from 'lucide-react';
export function SignaturePadDialog({ open, onOpenChange, onConfirm, saving, defaultTypedName, title = 'Sign document', description = 'Confirm your signature. This is recorded with a timestamp and an audit log.', }) {
    const canvasRef = useRef(null);
    const drawingRef = useRef(false);
    const lastPointRef = useRef(null);
    const [hasInk, setHasInk] = useState(false);
    const [tab, setTab] = useState('drawn');
    const [typedName, setTypedName] = useState(defaultTypedName ?? '');
    const getContext = () => {
        const canvas = canvasRef.current;
        if (!canvas)
            return null;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            return null;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#0f172a';
        return ctx;
    };
    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx)
            return;
        canvas.width = canvas.clientWidth * window.devicePixelRatio;
        canvas.height = canvas.clientHeight * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
        setHasInk(false);
    };
    useEffect(() => {
        if (!open)
            return;
        // Reset on open. Synchronous state updates are intentional here — the
        // dialog content was just mounted by the parent's open state.
        /* eslint-disable react-hooks/set-state-in-effect */
        setHasInk(false);
        setTypedName(defaultTypedName ?? '');
        /* eslint-enable react-hooks/set-state-in-effect */
        requestAnimationFrame(() => clearCanvas());
    }, [open, defaultTypedName]);
    const pointerPos = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onPointerDown = (e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        drawingRef.current = true;
        lastPointRef.current = pointerPos(e);
    };
    const onPointerMove = (e) => {
        if (!drawingRef.current)
            return;
        const ctx = getContext();
        const last = lastPointRef.current;
        if (!ctx || !last)
            return;
        const next = pointerPos(e);
        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(next.x, next.y);
        ctx.stroke();
        lastPointRef.current = next;
        if (!hasInk)
            setHasInk(true);
    };
    const onPointerUp = () => {
        drawingRef.current = false;
        lastPointRef.current = null;
    };
    const handleConfirm = async () => {
        if (tab === 'typed') {
            const name = typedName.trim();
            if (!name)
                return;
            await onConfirm({ method: 'typed', signatureDataUrl: null, typedName: name });
            return;
        }
        const canvas = canvasRef.current;
        if (!canvas || !hasInk)
            return;
        const dataUrl = canvas.toDataURL('image/png');
        await onConfirm({ method: 'drawn', signatureDataUrl: dataUrl });
    };
    const canConfirm = !saving && (tab === 'typed' ? typedName.trim().length > 0 : hasInk);
    return (<Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v === 'typed' ? 'typed' : 'drawn')}>
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="drawn">
              <PenLine className="mr-2 h-4 w-4"/>
              Draw
            </TabsTrigger>
            <TabsTrigger value="typed">Type</TabsTrigger>
          </TabsList>

          <TabsContent value="drawn" className="space-y-3">
            <div className="rounded-md border bg-white">
              <canvas ref={canvasRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onPointerLeave={onPointerUp} className="h-44 w-full cursor-crosshair touch-none rounded-md" style={{ touchAction: 'none' }}/>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Sign with your mouse, finger, or stylus.</span>
              <button type="button" onClick={clearCanvas} className="inline-flex items-center gap-1 text-gray-700 hover:text-gray-900">
                <Eraser className="h-3.5 w-3.5"/>
                Clear
              </button>
            </div>
          </TabsContent>

          <TabsContent value="typed" className="space-y-3">
            <div className="grid gap-2">
              <Label htmlFor="typed-signature-name">Type your full legal name</Label>
              <Input id="typed-signature-name" value={typedName} onChange={(e) => setTypedName(e.target.value)} placeholder="Dr. Jordan Lee, LMFT" autoFocus/>
            </div>
            <p className="text-xs text-gray-500">
              By typing your name and clicking Sign, you affirm this is your legal signature.
            </p>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void handleConfirm()} disabled={!canConfirm}>
            {saving ? 'Signing…' : 'Sign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);
}
