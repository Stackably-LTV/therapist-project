'use client';
import { useState } from 'react';
import { Button } from '@/components/2795b661f080';
import { Input } from '@/components/c2f62fb0cb5e';
import { Label } from '@/components/78846397f3ca';
import { Textarea } from '@/components/e1d2ad49fd73';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/c0ebd3fbafc6';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/2318256b5648';
import { completeSeekerOnboarding } from '@/components/4ac815fbf979';
import { Loader2, User, Camera, Phone, FileText } from 'lucide-react';
import { uploadProfileImage } from '@/components/fb87d6499041';
import { UsPhoneInput } from '@/components/d8ce739ee04e';
import { usNationalDigitsToE164 } from '@/components/98e56006aa84';
export default function SeekerOnboardingForm({ defaultValues, redirectTo }) {
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        displayName: defaultValues?.displayName || '',
        pronouns: defaultValues?.pronouns || '',
        goals: defaultValues?.goals || '',
        preferences: defaultValues?.preferences || '',
        bio: '',
        phone: '',
        profileImageUrl: '',
    });
    const initials = formData.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
        if (error)
            setError('');
    };
    const handleProfileImageChange = async (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) {
                setError('Profile image must be less than 5MB');
                return;
            }
            setUploadingImage(true);
            setError('');
            try {
                const { url, error: uploadError } = await uploadProfileImage(file);
                if (uploadError) {
                    throw new Error(uploadError);
                }
                if (url) {
                    setFormData(prev => ({
                        ...prev,
                        profileImageUrl: url,
                    }));
                }
            }
            catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to upload image');
            }
            finally {
                setUploadingImage(false);
            }
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (formData.phone && formData.phone.length !== 10) {
                setError('Phone must be 10 digits (US).');
                setLoading(false);
                return;
            }
            const formDataToSubmit = new FormData();
            formDataToSubmit.append('displayName', formData.displayName);
            formDataToSubmit.append('pronouns', formData.pronouns);
            formDataToSubmit.append('goals', formData.goals);
            formDataToSubmit.append('preferences', formData.preferences);
            formDataToSubmit.append('bio', formData.bio);
            formDataToSubmit.append('phone', usNationalDigitsToE164(formData.phone) || '');
            formDataToSubmit.append('profileImageUrl', formData.profileImageUrl);
            const safeRedirect = redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : '';
            if (safeRedirect) {
                formDataToSubmit.append('redirect', safeRedirect);
            }
            await completeSeekerOnboarding(formDataToSubmit);
        }
        catch (err) {
            // Next.js's redirect() throws NEXT_REDIRECT — let it through.
            if (err && typeof err === 'object' && 'digest' in err && typeof err.digest === 'string' && err.digest.startsWith('NEXT_REDIRECT')) {
                throw err;
            }
            setError(err instanceof Error ? err.message : 'Failed to complete onboarding');
            setLoading(false);
        }
    };
    return (<Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Complete Your Profile</CardTitle>
        <CardDescription>
          Tell us a bit about yourself to help us match you with the right therapist.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (<div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
              {error}
            </div>)}

          {/* Profile Image Upload */}
          <div className="flex flex-col items-center space-y-4 pb-4">
            <div className="relative group">
              <Avatar className="h-24 w-24 ring-4 ring-background shadow-lg">
                <AvatarImage src={formData.profileImageUrl} alt={formData.displayName}/>
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                  {initials || <User className="h-8 w-8"/>}
                </AvatarFallback>
              </Avatar>
              <label htmlFor="profile-upload" className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                {uploadingImage ? (<Loader2 className="h-6 w-6 animate-spin"/>) : (<Camera className="h-6 w-6"/>)}
                <input id="profile-upload" type="file" className="hidden" accept="image/*" onChange={handleProfileImageChange} disabled={uploadingImage}/>
              </label>
            </div>
            <p className="text-sm text-muted-foreground">Upload a profile picture</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName" className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground"/>
              Display Name
            </Label>
            <Input id="displayName" name="displayName" type="text" required value={formData.displayName} onChange={handleChange} placeholder="How would you like to be addressed?" disabled={loading} className="h-11"/>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio" className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground"/>
              Bio (Optional)
            </Label>
            <Textarea id="bio" name="bio" value={formData.bio} onChange={handleChange} placeholder="Tell us a little about yourself..." disabled={loading} className="min-h-[80px] resize-none"/>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground"/>
              Phone Number
            </Label>
            <UsPhoneInput id="phone" name="phone" value={formData.phone} onValueChange={(next) => {
            setFormData((prev) => ({ ...prev, phone: next }));
            if (error)
                setError('');
        }} placeholder="5550000000" disabled={loading} className="h-11"/>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pronouns" className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground"/>
              Pronouns (Optional)
            </Label>
            <Input id="pronouns" name="pronouns" type="text" value={formData.pronouns} onChange={handleChange} placeholder="e.g., she/her, he/him, they/them" disabled={loading} className="h-11"/>
          </div>

          <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading || !formData.displayName.trim()}>
            {loading ? (<>
                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                Completing onboarding...
              </>) : ('Complete Profile')}
          </Button>
        </form>
      </CardContent>
    </Card>);
}
