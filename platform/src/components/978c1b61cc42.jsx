'use client';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/2795b661f080';
import { Input } from '@/components/c2f62fb0cb5e';
import { Label } from '@/components/78846397f3ca';
import { toast } from 'sonner';
export default function PasswordResetRequestForm({ initialEmail = '', onSent, }) {
    const [email, setEmail] = useState(initialEmail);
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) {
            toast.error('Please enter your email address');
            return;
        }
        setLoading(true);
        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to send reset code');
            }
            toast.success('Check your email for the 6-digit code');
            onSent(email);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to send reset code';
            console.error('Reset request error:', error);
            toast.error(message);
        }
        finally {
            setLoading(false);
        }
    };
    return (<form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="reset-email">Email Address</Label>
        <Input id="reset-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" required disabled={loading} autoComplete="email"/>
      </div>

      <Button type="submit" className="w-full h-11" disabled={loading}>
        {loading ? (<>
            <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
            Sending code...
          </>) : ('Send reset code')}
      </Button>
    </form>);
}
