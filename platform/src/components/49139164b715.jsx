'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/2795b661f080';
import { Input } from '@/components/c2f62fb0cb5e';
import { Label } from '@/components/78846397f3ca';
import { toast } from 'sonner';
import { createClient } from '@/components/e7335a071b71';
export default function SignupVerifyForm({ email, onBack }) {
    const router = useRouter();
    const [code, setCode] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [resending, setResending] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmed = code.replace(/\s+/g, '');
        if (!/^\d{6}$/.test(trimmed)) {
            toast.error('Enter the 6-digit code from the email');
            return;
        }
        setVerifying(true);
        try {
            const supabase = createClient();
            const { error } = await supabase.auth.verifyOtp({
                email,
                token: trimmed,
                type: 'signup',
            });
            if (error) {
                const message = /expired|otp_expired/i.test(error.message)
                    ? 'That code expired. Send a new one.'
                    : 'Invalid code. Double-check the email and try again.';
                throw new Error(message);
            }
            toast.success('Email verified');
            router.replace('/login');
            router.refresh();
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Could not verify code';
            console.error('Signup verify error:', error);
            toast.error(message);
        }
        finally {
            setVerifying(false);
        }
    };
    const handleResend = async () => {
        setResending(true);
        try {
            const supabase = createClient();
            const { error } = await supabase.auth.resend({ type: 'signup', email });
            if (error)
                throw new Error(error.message || 'Failed to resend code');
            toast.success('New code sent');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to resend code';
            toast.error(message);
        }
        finally {
            setResending(false);
        }
    };
    return (<form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-sm text-gray-600">
        We sent a 6-digit code to <strong className="text-gray-900">{email}</strong>. Enter it
        below to verify your email.
      </p>

      <div className="space-y-2">
        <Label htmlFor="signup-code">6-digit code</Label>
        <Input id="signup-code" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} placeholder="123456" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="h-11 text-center text-lg tracking-[0.5em] font-mono" required disabled={verifying}/>
      </div>

      <Button type="submit" className="w-full h-11" disabled={verifying}>
        {verifying ? (<>
            <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
            Verifying…
          </>) : ('Verify email')}
      </Button>

      <div className="flex items-center justify-between text-sm">
        <button type="button" onClick={onBack} className="text-gray-600 hover:underline" disabled={verifying}>
          Wrong email?
        </button>
        <button type="button" onClick={handleResend} className="text-primary hover:underline font-medium disabled:opacity-50" disabled={verifying || resending}>
          {resending ? 'Resending…' : 'Resend code'}
        </button>
      </div>
    </form>);
}
