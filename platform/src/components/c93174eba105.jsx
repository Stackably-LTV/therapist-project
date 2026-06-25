'use client';
import { useState } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/2795b661f080';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/c0ebd3fbafc6';
import { Input } from '@/components/c2f62fb0cb5e';
import { Label } from '@/components/78846397f3ca';
import { createClient } from '@/components/e7335a071b71';
export function ChangePasswordCard({ email }) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [saving, setSaving] = useState(false);
    const submit = async (event) => {
        event.preventDefault();
        if (newPassword.length < 8) {
            toast.error('New password must be at least 8 characters.');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('New passwords do not match.');
            return;
        }
        setSaving(true);
        try {
            const supabase = createClient();
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password: currentPassword,
            });
            if (signInError)
                throw new Error('Current password is incorrect.');
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error)
                throw error;
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            toast.success('Password updated.');
        }
        catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update password.');
        }
        finally {
            setSaving(false);
        }
    };
    return (<Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5"/>
          Change password
        </CardTitle>
        <CardDescription>Update your login password from settings.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current password</Label>
            <Input id="current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input id="new-password" type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <Input id="confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required/>
          </div>
          <div className="md:col-span-3">
            <Button type="submit" disabled={saving || !currentPassword || !newPassword || !confirmPassword}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
              {saving ? 'Updating...' : 'Update password'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>);
}
