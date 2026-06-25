'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/2795b661f080';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/c0ebd3fbafc6';
import { Input } from '@/components/c2f62fb0cb5e';
import { Label } from '@/components/78846397f3ca';
import { Textarea } from '@/components/e1d2ad49fd73';
import { Alert, AlertDescription } from '@/components/f199a80a8c3b';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/2318256b5648';
import { Info, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
export function AddPatientForm({ existingClients = [], therapist, onRequestClose, }) {
    const router = useRouter();
    const [savingMode, setSavingMode] = useState(null);
    const [showValidation, setShowValidation] = useState(false);
    const [sourceMode, setSourceMode] = useState('new');
    const [selectedExistingClientId, setSelectedExistingClientId] = useState('');
    const emptyForm = () => ({
        fullName: '',
        email: '',
        internalNote: '',
    });
    const [form, setForm] = useState(emptyForm);
    const selectedExisting = useMemo(() => existingClients.find((c) => c.id === selectedExistingClientId) || null, [existingClients, selectedExistingClientId]);
    const canSubmit = useMemo(() => {
        if (sourceMode === 'existing')
            return Boolean(selectedExistingClientId);
        return form.fullName.trim().length > 0 && form.email.trim().length > 0;
    }, [sourceMode, selectedExistingClientId, form.fullName, form.email]);
    const nameMissing = showValidation && sourceMode === 'new' && form.fullName.trim().length === 0;
    const emailMissing = showValidation && sourceMode === 'new' && form.email.trim().length === 0;
    const existingMissing = showValidation && sourceMode === 'existing' && !selectedExistingClientId;
    const saving = savingMode !== null;
    const submit = async (mode) => {
        if (!canSubmit) {
            setShowValidation(true);
            toast.error('Please complete all required fields.');
            return;
        }
        setSavingMode(mode);
        try {
            const payload = sourceMode === 'existing' && selectedExisting
                ? {
                    fullName: selectedExisting.name,
                    email: selectedExisting.email,
                    internalNote: form.internalNote,
                    existingUserId: selectedExisting.id,
                }
                : {
                    fullName: form.fullName,
                    email: form.email,
                    internalNote: form.internalNote,
                    existingUserId: null,
                };
            const res = await fetch('/api/therapist/patients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data.error || 'Failed to send invite');
            toast.success(data?.alreadyClient
                ? 'This person is already your client.'
                : 'Invite sent. They will appear here as “Not accepted” until they accept.');
            if (mode === 'another') {
                setForm(emptyForm());
                setSelectedExistingClientId('');
                setShowValidation(false);
                return;
            }
            onRequestClose?.();
            router.push('/therapist/records');
        }
        catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to send invite');
        }
        finally {
            setSavingMode(null);
        }
    };
    return (<Card className="border-2 shadow-sm">
      <CardHeader>
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            {therapist.profileImageUrl && <AvatarImage src={therapist.profileImageUrl} alt={therapist.name}/>}
            <AvatarFallback>{(therapist.name || 'T').slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5"/>
              Invite a client
            </CardTitle>
            <CardDescription>
              Send a consent invite. After they accept, they appear in your records.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="bg-blue-50 border-blue-200 text-blue-900">
          <Info className="h-4 w-4 text-blue-600"/>
          <AlertDescription>
            Your client owns their personal info (name, address, DOB, contact). They’ll fill it in
            on their own profile after accepting your invite. You’ll be able to view it — but only
            they can edit it.
          </AlertDescription>
        </Alert>

        {/* Source toggle */}
        <div className="rounded-lg border p-4 space-y-4">
          <div className="text-sm font-semibold">How are you adding this person?</div>
          <div className="flex gap-2">
            <Button type="button" variant={sourceMode === 'new' ? 'default' : 'outline'} size="sm" onClick={() => setSourceMode('new')}>
              By email
            </Button>
            <Button type="button" variant={sourceMode === 'existing' ? 'default' : 'outline'} size="sm" onClick={() => setSourceMode('existing')} disabled={existingClients.length === 0}>
              Existing person on platform
            </Button>
          </div>

          {sourceMode === 'new' ? (<div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fullName">
                  Full name <span className="text-red-600">*</span>
                </Label>
                <Input id="fullName" value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} placeholder="Jane Doe" aria-invalid={nameMissing}/>
                {nameMissing && <p className="text-xs text-red-600">Name is required</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">
                  Email <span className="text-red-600">*</span>
                </Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="jane@example.com" aria-invalid={emailMissing}/>
                {emailMissing && <p className="text-xs text-red-600">Email is required</p>}
              </div>
            </div>) : (<div className="grid gap-2">
              <Label htmlFor="existingClient">Choose person</Label>
              <select id="existingClient" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={selectedExistingClientId} onChange={(e) => setSelectedExistingClientId(e.target.value)} aria-invalid={existingMissing}>
                <option value="">— Select —</option>
                {existingClients.map((c) => (<option key={c.id} value={c.id}>
                    {c.name} {c.email ? `(${c.email})` : ''}
                  </option>))}
              </select>
              {existingMissing && <p className="text-xs text-red-600">Pick a person</p>}
            </div>)}
        </div>

        {/* Internal note (therapist-only) */}
        <div className="grid gap-2">
          <Label htmlFor="internalNote">Internal note (optional, only you see this)</Label>
          <Textarea id="internalNote" value={form.internalNote} onChange={(e) => setForm((p) => ({ ...p, internalNote: e.target.value }))} placeholder="Notes about this client — referral source, intake context, etc." className="min-h-[100px]"/>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-2">
          <Button type="button" variant="outline" disabled={saving} onClick={() => submit('another')}>
            {savingMode === 'another' ? 'Sending…' : 'Send & add another'}
          </Button>
          <Button type="button" disabled={saving} onClick={() => submit('open')}>
            {savingMode === 'open' ? 'Sending…' : 'Send invite'}
          </Button>
        </div>
      </CardContent>
    </Card>);
}
