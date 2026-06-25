'use client';
import { useState } from 'react';
import { Button } from '@/components/2795b661f080';
import { Input } from '@/components/c2f62fb0cb5e';
import { Label } from '@/components/78846397f3ca';
import { Textarea } from '@/components/e1d2ad49fd73';
import { Alert, AlertDescription } from '@/components/f199a80a8c3b';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/1712d8a01fd3';
import { Loader2, CheckCircle2, AlertCircle, Send } from 'lucide-react';
const SUBJECT_OPTIONS = [
    'General Inquiry',
    'Technical Support',
    'Billing Question',
    'Therapist Application',
    'Partnership Opportunity',
    'Other',
];
export default function ContactForm() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
    });
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        if (error)
            setError('');
        if (success)
            setSuccess(false);
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);
        setLoading(true);
        try {
            // Simulate API call - replace with actual endpoint
            await new Promise(resolve => setTimeout(resolve, 1500));
            // TODO: Replace with actual API call
            // const response = await fetch('/api/contact', {
            //   method: 'POST',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify(formData),
            // });
            setSuccess(true);
            setFormData({
                name: '',
                email: '',
                subject: '',
                message: '',
            });
            setTimeout(() => setSuccess(false), 5000);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send message');
        }
        finally {
            setLoading(false);
        }
    };
    const isValidEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };
    return (<form onSubmit={handleSubmit} className="space-y-4">
      {/* Success Message */}
      {success && (<Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600"/>
          <AlertDescription className="text-green-700 text-sm">
            Thank you! We&apos;ll get back to you within 24 hours.
          </AlertDescription>
        </Alert>)}

      {error && (<Alert variant="destructive">
          <AlertCircle className="h-4 w-4"/>
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>)}

      {/* Name and Email in a row on larger screens */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs font-medium text-gray-700">
            Full Name *
          </Label>
          <Input id="name" name="name" type="text" required value={formData.name} onChange={handleChange} placeholder="John Doe" disabled={loading} className="h-9 text-sm"/>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-medium text-gray-700">
            Email Address *
          </Label>
          <Input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="john@example.com" disabled={loading} className="h-9 text-sm"/>
        </div>
      </div>

      {formData.email && !isValidEmail(formData.email) && (<p className="text-xs text-red-600 flex items-center gap-1 -mt-2">
          <AlertCircle className="h-3 w-3"/>
          Please enter a valid email address
        </p>)}

      {/* Subject */}
      <div className="space-y-1.5">
        <Label htmlFor="subject" className="text-xs font-medium text-gray-700">
          Subject *
        </Label>
        <Select value={formData.subject} onValueChange={(value) => {
            setFormData({ ...formData, subject: value });
            if (error)
                setError('');
            if (success)
                setSuccess(false);
        }} disabled={loading}>
          <SelectTrigger className="h-9 text-sm w-full">
            <SelectValue placeholder="Select a subject"/>
          </SelectTrigger>
          <SelectContent>
            {SUBJECT_OPTIONS.map((subject) => (<SelectItem key={subject} value={subject}>
                {subject}
              </SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      {/* Message */}
      <div className="space-y-1.5">
        <Label htmlFor="message" className="text-xs font-medium text-gray-700">
          Message *
        </Label>
        <Textarea id="message" name="message" required value={formData.message} onChange={handleChange} placeholder="Tell us how we can help you..." disabled={loading} rows={4} maxLength={2000} className="resize-none text-sm"/>
        <p className="text-xs text-gray-400">
          {formData.message.length} / 2000 characters
        </p>
      </div>

      {/* Submit Button */}
      <Button type="submit" disabled={loading || !formData.name || !formData.email || !formData.subject || !formData.message} className="w-full h-9 text-sm font-medium mt-2">
        {loading ? (<>
            <Loader2 className="h-4 w-4 mr-2 animate-spin"/>
            Sending...
          </>) : (<>
            <Send className="h-4 w-4 mr-2"/>
            Send Message
          </>)}
      </Button>
    </form>);
}
