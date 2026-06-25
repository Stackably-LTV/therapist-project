'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/2795b661f080';
import { Input } from '@/components/c2f62fb0cb5e';
import { Label } from '@/components/78846397f3ca';
import { toast } from 'sonner';
import { createClient } from '@/components/e7335a071b71';
export default function PasswordResetVerifyForm({ email, onBack, }) {
    const router = useRouter();
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmedCode = code.replace(/\s+/g, '');
        if (!/^\d{6}$/.test(trimmedCode)) {
            toast.error('Enter the 6-digit code from the email');
            return;
        }
        if (password.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }
        setLoading(true);
        try {
            const supabase = createClient();
            const { error: verifyError } = await supabase.auth.verifyOtp({
                email,
                token: trimmedCode,
                type: 'recovery',
            });
            if (verifyError) {
                const message = /expired|otp_expired/i.test(verifyError.message)
                    ? 'That code expired. Send a new one.'
                    : 'Invalid code. Double-check the email and try again.';
                throw new Error(message);
            }
            const { error: updateError } = await supabase.auth.updateUser({ password });
            if (updateError) {
                throw new Error(updateError.message || 'Could not update password');
            }
            toast.success('Password updated. Signing you in…');
            router.replace('/');
            router.refresh();
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Could not reset password';
            console.error('Reset verify error:', error);
            toast.error(message);
        }
        finally {
            setLoading(false);
        }
    };
    const handleResend = async () => {
        setResending(true);
        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to resend code');
            }
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
        below along with your new password.
      </p>

      <div className="space-y-2">
        <Label htmlFor="reset-code">6-digit code</Label>
        <Input id="reset-code" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} placeholder="123456" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="h-11 text-center text-lg tracking-[0.5em] font-mono" required disabled={loading}/>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reset-password">New password</Label>
        <Input id="reset-password" type="password" placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" required minLength={8} disabled={loading} autoComplete="new-password"/>
      </div>

      <Button type="submit" className="w-full h-11" disabled={loading}>
        {loading ? (<>
            <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
            Updating password…
          </>) : ('Update password')}
      </Button>

      <div className="flex items-center justify-between text-sm">
        <button type="button" onClick={onBack} className="text-gray-600 hover:underline" disabled={loading}>
          Wrong email?
        </button>
        <button type="button" onClick={handleResend} className="text-primary hover:underline font-medium disabled:opacity-50" disabled={loading || resending}>
          {resending ? 'Resending…' : 'Resend code'}
        </button>
      </div>
    </form>);
}
