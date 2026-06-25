'use client';
import { useState } from 'react';
import { Button } from '@/components/2795b661f080';
import { Input } from '@/components/c2f62fb0cb5e';
import { Label } from '@/components/78846397f3ca';
import { Alert, AlertDescription } from '@/components/f199a80a8c3b';
import { authService } from '@/components/040561496129';
function getInitialEmail() {
    if (typeof window === 'undefined')
        return '';
    const urlParams = new URLSearchParams(window.location.search);
    const fromUrl = urlParams.get('email');
    if (fromUrl)
        return fromUrl;
    return localStorage.getItem('remembered_email') || '';
}
export default function SignupInitialForm({ onSent }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: getInitialEmail(),
        password: '',
        confirmPassword: '',
    });
    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
        if (error)
            setError('');
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }
        setLoading(true);
        try {
            const result = await authService.signUp({
                email: formData.email,
                password: formData.password,
                name: formData.name,
            });
            // If Supabase auto-confirms (project has email confirmations disabled),
            // skip the OTP step entirely — the user is already signed in.
            if (result.user?.email_confirmed_at) {
                window.location.href = '/login';
                return;
            }
            onSent(formData.email);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to create account. Please try again.';
            setError(message);
        }
        finally {
            setLoading(false);
        }
    };
    return (<form onSubmit={handleSubmit} className="space-y-5">
      {error && (<Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>)}

      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input id="name" name="name" type="text" value={formData.name} onChange={handleChange} placeholder="Jane Doe" required disabled={loading} className="h-11"/>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" required disabled={loading} autoComplete="email" className="h-11"/>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="••••••••" required disabled={loading} autoComplete="new-password" className="h-11"/>
        <p className="text-xs text-gray-500">Must be at least 8 characters long.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" required disabled={loading} autoComplete="new-password" className="h-11"/>
      </div>

      <Button type="submit" className="w-full h-11" disabled={loading}>
        {loading ? 'Creating account...' : 'Continue'}
      </Button>
    </form>);
}
