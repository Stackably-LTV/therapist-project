'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/c0ebd3fbafc6';
import { Input } from '@/components/c2f62fb0cb5e';
import { Label } from '@/components/78846397f3ca';
import { Button } from '@/components/2795b661f080';
import { Alert, AlertDescription } from '@/components/f199a80a8c3b';
import { Loader2, CheckCircle2, AlertCircle, Lock } from 'lucide-react';
import { US_STATES } from '@/components/96fabadae962';
import { UsPhoneInput } from '@/components/d8ce739ee04e';
import { normalizeUsPhoneToNationalDigits, usNationalDigitsToE164, } from '@/components/98e56006aa84';
export default function PersonalInfoCard() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        legal_first_name: '',
        legal_last_name: '',
        preferred_name: '',
        dob: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'US',
        mobile_phone_national: '',
        contact_email: '',
    });
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch('/api/seeker/personal-info');
                if (!res.ok)
                    throw new Error('Failed to load');
                const { record } = (await res.json());
                if (cancelled || !record)
                    return;
                setForm((prev) => ({
                    ...prev,
                    legal_first_name: record.legal_first_name ?? '',
                    legal_last_name: record.legal_last_name ?? '',
                    preferred_name: record.preferred_name ?? '',
                    dob: record.dob ?? '',
                    address_line1: record.address_line1 ?? '',
                    address_line2: record.address_line2 ?? '',
                    city: record.city ?? '',
                    state: record.state ?? '',
                    postal_code: record.postal_code ?? '',
                    country: record.country ?? 'US',
                    mobile_phone_national: normalizeUsPhoneToNationalDigits(record.mobile_phone_e164 ?? ''),
                    contact_email: record.contact_email ?? '',
                }));
            }
            catch (err) {
                if (!cancelled)
                    setError(err instanceof Error ? err.message : 'Failed to load');
            }
            finally {
                if (!cancelled)
                    setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);
    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        if (error)
            setError('');
        if (success)
            setSuccess(false);
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.mobile_phone_national && form.mobile_phone_national.length !== 10) {
            setError('Phone must be 10 digits (US).');
            return;
        }
        setSaving(true);
        setError('');
        try {
            const payload = {
                legal_first_name: form.legal_first_name,
                legal_last_name: form.legal_last_name,
                preferred_name: form.preferred_name,
                dob: form.dob || null,
                address_line1: form.address_line1,
                address_line2: form.address_line2,
                city: form.city,
                state: form.state,
                postal_code: form.postal_code,
                country: form.country,
                mobile_phone_e164: form.mobile_phone_national
                    ? usNationalDigitsToE164(form.mobile_phone_national)
                    : null,
                contact_email: form.contact_email,
            };
            const res = await fetch('/api/seeker/personal-info', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data?.error || 'Failed to save');
            }
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save');
        }
        finally {
            setSaving(false);
        }
    };
    if (loading) {
        return (<Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400"/>
        </CardContent>
      </Card>);
    }
    return (<Card className="border-2 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-blue-600"/>
          Personal Information
        </CardTitle>
        <CardDescription>
          Only you can edit this. Therapists can view it but cannot make changes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {success && (<Alert className="bg-green-50 border-green-200 text-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600"/>
              <AlertDescription>Saved.</AlertDescription>
            </Alert>)}
          {error && (<Alert variant="destructive">
              <AlertCircle className="h-4 w-4"/>
              <AlertDescription>{error}</AlertDescription>
            </Alert>)}

          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="legal_first_name">Legal First Name</Label>
              <Input id="legal_first_name" name="legal_first_name" value={form.legal_first_name} onChange={handleChange}/>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="legal_last_name">Legal Last Name</Label>
              <Input id="legal_last_name" name="legal_last_name" value={form.legal_last_name} onChange={handleChange}/>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="preferred_name">Preferred Name</Label>
              <Input id="preferred_name" name="preferred_name" value={form.preferred_name} onChange={handleChange}/>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input id="dob" name="dob" type="date" value={form.dob} onChange={handleChange}/>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input id="contact_email" name="contact_email" type="email" value={form.contact_email} onChange={handleChange} placeholder="contact@example.com"/>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mobile_phone_national">Mobile Phone</Label>
              <UsPhoneInput id="mobile_phone_national" name="mobile_phone_national" value={form.mobile_phone_national} onValueChange={(next) => setForm((prev) => ({ ...prev, mobile_phone_national: next }))} placeholder="5550000000"/>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="address_line1">Address</Label>
            <Input id="address_line1" name="address_line1" value={form.address_line1} onChange={handleChange} placeholder="Street address"/>
            <Input id="address_line2" name="address_line2" value={form.address_line2} onChange={handleChange} placeholder="Apt, suite, unit (optional)"/>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" value={form.city} onChange={handleChange}/>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="state">State</Label>
              <select id="state" name="state" value={form.state} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select state</option>
                {US_STATES.map((s) => (<option key={s.value} value={s.value}>
                    {s.label}
                  </option>))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="postal_code">ZIP</Label>
              <Input id="postal_code" name="postal_code" value={form.postal_code} onChange={handleChange}/>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? (<>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                  Saving...
                </>) : ('Save Personal Info')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>);
}
