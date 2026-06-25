'use client';
import { useState } from 'react';
import { Button } from '@/components/2795b661f080';
import { Input } from '@/components/c2f62fb0cb5e';
import { Label } from '@/components/78846397f3ca';
import { Textarea } from '@/components/e1d2ad49fd73';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/c0ebd3fbafc6';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/2318256b5648';
import { Alert, AlertDescription } from '@/components/f199a80a8c3b';
import { Separator } from '@/components/19cc3f2900f4';
import { authService } from '@/components/040561496129';
import { uploadProfileImage } from '@/components/fb87d6499041';
import { UsPhoneInput } from '@/components/d8ce739ee04e';
import { normalizeUsPhoneToNationalDigits, usNationalDigitsToE164, } from '@/components/98e56006aa84';
import { User as UserIcon, Mail, Loader2, CheckCircle2, AlertCircle, Camera, Phone, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
export default function ClientProfileForm({ user, profile }) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [uploadingImage, setUploadingImage] = useState(false);
    const profileData = profile?.profile_json || {};
    const authMetadata = user.user_metadata;
    const authAvatar = authMetadata?.avatar_url ||
        authMetadata?.picture ||
        '';
    const [formData, setFormData] = useState({
        name: profile?.name || '',
        email: user.email || '',
        bio: profileData.bio || '',
        phone: normalizeUsPhoneToNationalDigits(profileData.phone_e164 || ''),
        profileImageUrl: profileData.profile_image_url || authAvatar || '',
        pronouns: profileData.pronouns || '',
    });
    const initials = formData.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
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
                // Upload image
                const { url, error: uploadError } = await uploadProfileImage(file);
                if (uploadError) {
                    throw new Error(uploadError);
                }
                if (url) {
                    // Update profile with new image URL
                    await authService.updateProfile(user.id, {
                        profile_image_url: url,
                    });
                    setFormData(prev => ({
                        ...prev,
                        profileImageUrl: url,
                    }));
                    setSuccess(true);
                    setTimeout(() => setSuccess(false), 3000);
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
        setSuccess(false);
        setLoading(true);
        try {
            if (formData.phone && formData.phone.length !== 10) {
                setError('Phone must be 10 digits (US).');
                setLoading(false);
                return;
            }
            const phoneE164 = formData.phone ? usNationalDigitsToE164(formData.phone) : null;
            await authService.updateProfile(user.id, {
                full_name: formData.name,
                bio: formData.bio,
                phone_e164: phoneE164 || '',
                profile_image_url: formData.profileImageUrl,
                pronouns: formData.pronouns,
            });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update profile');
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="grid gap-8 lg:grid-cols-12">
      {/* Left Column: Avatar & Quick Status */}
      <div className="lg:col-span-4 space-y-6">
        <Card className="overflow-hidden border-2 shadow-md">
          <div className="h-32 bg-gradient-to-r from-blue-500 to-cyan-600 relative">
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
              <div className="relative group">
                <Avatar className="h-24 w-24 ring-4 ring-white shadow-lg">
                  <AvatarImage src={formData.profileImageUrl} alt={formData.name}/>
                  <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600 text-xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <label htmlFor="profile-upload" className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  {uploadingImage ? (<Loader2 className="h-6 w-6 animate-spin"/>) : (<Camera className="h-6 w-6"/>)}
                  <input id="profile-upload" type="file" className="hidden" accept="image/*" onChange={handleProfileImageChange} disabled={uploadingImage}/>
                </label>
              </div>
            </div>
          </div>
          <CardContent className="pt-16 pb-6 text-center">
            <h3 className="text-xl font-bold text-gray-900">{formData.name || 'User'}</h3>
            <p className="text-sm text-gray-500">{formData.email}</p>
            <div className="mt-4 flex justify-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                {profile?.role}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600"/>
              Account Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Email Verified</span>
                <span className="flex items-center text-green-600 font-medium">
                  <CheckCircle2 className="h-4 w-4 mr-1"/> Verified
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Profile Completion</span>
                <span className="font-medium text-blue-600">
                  {formData.name && formData.phone ? '100%' : '80%'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Main Form */}
      <div className="lg:col-span-8">
        <Card className="border-2 shadow-md">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your personal details and contact information.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <AnimatePresence>
                {success && (<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <Alert className="bg-green-50 border-green-200 text-green-800">
                      <CheckCircle2 className="h-4 w-4 text-green-600"/>
                      <AlertDescription>Profile updated successfully!</AlertDescription>
                    </Alert>
                  </motion.div>)}
                {error && (<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4"/>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  </motion.div>)}
              </AnimatePresence>

              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-gray-500"/>
                    Full Name
                  </Label>
                  <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Enter your full name" required className="bg-gray-50/50 focus:bg-white transition-colors"/>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500"/>
                    Email Address
                  </Label>
                  <Input id="email" value={formData.email} disabled className="bg-gray-100 text-gray-500 cursor-not-allowed"/>
                  <p className="text-xs text-gray-500">Email address cannot be changed.</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="bio" className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-gray-500"/>
                    Bio (Optional)
                  </Label>
                  <Textarea id="bio" name="bio" value={formData.bio} onChange={handleChange} placeholder="Tell us a little about yourself..." className="min-h-[100px] bg-gray-50/50 focus:bg-white transition-colors resize-none"/>
                </div>

                <div className="grid gap-2 pt-4">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500"/>
                    Phone Number
                  </Label>
                  <UsPhoneInput id="phone" name="phone" value={formData.phone} onValueChange={(next) => {
            setFormData((prev) => ({ ...prev, phone: next }));
            if (error)
                setError('');
            if (success)
                setSuccess(false);
        }} placeholder="5550000000" className="bg-gray-50/50 focus:bg-white transition-colors"/>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="pronouns" className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-gray-500"/>
                    Pronouns
                  </Label>
                  <Input id="pronouns" name="pronouns" value={formData.pronouns} onChange={handleChange} placeholder="e.g., she/her, he/him, they/them" className="bg-gray-50/50 focus:bg-white transition-colors"/>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={loading} className="min-w-[140px] bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-md">
                  {loading ? (<>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                      Saving...
                    </>) : ('Save Changes')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>);
}
