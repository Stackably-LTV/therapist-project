'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/2795b661f080';
import { Input } from '@/components/c2f62fb0cb5e';
import { Label } from '@/components/78846397f3ca';
import { Checkbox } from '@/components/488f67026ba7';
import { Alert, AlertDescription } from '@/components/f199a80a8c3b';
import { authService } from '@/components/040561496129';
import { Loader2, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';
export default function LoginForm() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const getRedirectParam = () => {
        if (typeof window === 'undefined')
            return '';
        const params = new URLSearchParams(window.location.search);
        const redirectTo = params.get('redirect') || '';
        return redirectTo.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : '';
    };
    // Initialize state - always start with false/empty to avoid hydration mismatch
    const [rememberMe, setRememberMe] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    // Load from localStorage after hydration (client-side only)
    useEffect(() => {
        const savedEmail = localStorage.getItem('remembered_email');
        if (savedEmail) {
            setFormData(prev => ({ ...prev, email: savedEmail }));
            setRememberMe(true);
        }
    }, []);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);
        setLoading(true);
        try {
            const result = await authService.signIn({
                email: formData.email,
                password: formData.password,
            });
            // Save email if "Remember me" is checked
            if (rememberMe) {
                localStorage.setItem('remembered_email', formData.email);
            }
            else {
                localStorage.removeItem('remembered_email');
            }
            setSuccess(true);
            await new Promise(resolve => setTimeout(resolve, 600));
            const redirectTo = getRedirectParam();
            if (redirectTo) {
                window.location.href = redirectTo;
                return;
            }
            try {
                const res = await fetch('/api/auth/post-login', {
                    method: 'GET',
                    credentials: 'include',
                    cache: 'no-store',
                });
                const data = await res.json().catch(() => ({}));
                const path = res.ok && typeof data?.path === 'string' ? data.path : '/login';
                window.location.href = path;
            }
            catch {
                window.location.href = '/login';
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Invalid email or password';
            setError(errorMessage);
            setLoading(false);
        }
    };
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        // Clear error when user starts typing
        if (error)
            setError('');
    };
    const isValidEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };
    return (<div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Success Message */}
        {success && (<Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600"/>
            <AlertDescription className="text-green-700">
              Login successful! Redirecting...
            </AlertDescription>
          </Alert>)}

        {/* Error Message */}
        {error && (<Alert variant="destructive">
            <XCircle className="h-4 w-4"/>
            <AlertDescription>{error}</AlertDescription>
          </Alert>)}

        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email">
            Email Address
          </Label>
          <Input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="you@example.com" disabled={loading} autoComplete="email" className="h-11"/>
          {formData.email && !isValidEmail(formData.email) && (<p className="text-xs text-red-600 flex items-center gap-1">
              <XCircle className="h-3 w-3"/>
              Please enter a valid email address
            </p>)}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <Label htmlFor="password">
            Password
          </Label>
          <div className="relative">
            <Input id="password" name="password" type={showPassword ? 'text' : 'password'} required value={formData.password} onChange={handleChange} placeholder="••••••••" disabled={loading} autoComplete="current-password" className="h-11 pr-10"/>
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
              {showPassword ? (<EyeOff className="h-4 w-4"/>) : (<Eye className="h-4 w-4"/>)}
            </button>
          </div>
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox id="remember" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked)} disabled={loading}/>
            <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
              Remember me
            </Label>
          </div>
          <Link href="/login?mode=reset" className="text-sm text-primary hover:underline font-medium">
            Forgot password?
          </Link>
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading || !formData.email || !formData.password}>
          {loading ? (<>
              <Loader2 className="h-4 w-4 mr-2 animate-spin"/>
              Signing in...
            </>) : ('Sign In')}
        </Button>
      </form>
    </div>);
}
