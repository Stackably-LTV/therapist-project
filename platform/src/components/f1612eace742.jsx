'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/2795b661f080';
import { Input } from '@/components/c2f62fb0cb5e';
import { Label } from '@/components/78846397f3ca';
import { Textarea } from '@/components/e1d2ad49fd73';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/c0ebd3fbafc6';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/2318256b5648';
import { Badge } from '@/components/30348591d689';
import { Alert, AlertDescription } from '@/components/f199a80a8c3b';
import { authService } from '@/components/040561496129';
import { uploadProfileImage } from '@/components/fb87d6499041';
import { User as UserIcon, Mail, Loader2, CheckCircle2, AlertCircle, Upload, Award, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { US_STATES } from '@/components/96fabadae962';
import { THERAPIST_SPECIALTIES } from '@/components/57e166f9150d';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/1712d8a01fd3';
import { UsPhoneInput } from '@/components/d8ce739ee04e';
import { normalizeUsPhoneToNationalDigits, usNationalDigitsToE164, } from '@/components/98e56006aa84';
import BookingAvailabilityCard from '@/components/36a1dfb25c85';
export default function TherapistProfileForm({ user, profile }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [uploadingImage, setUploadingImage] = useState(false);
    const profileData = profile?.profile_json || {};
    const authMetadata = user.user_metadata;
    const authAvatar = authMetadata?.avatar_url ||
        authMetadata?.picture ||
        '';
    const initialAvailability = Array.isArray(profileData.availability)
        ? profileData.availability
            .map((s) => ({
            dayOfWeek: Number(s.dayOfWeek),
            startTime: String(s.startTime || ''),
            endTime: String(s.endTime || ''),
        }))
            .filter((s) => Number.isInteger(s.dayOfWeek) &&
            s.dayOfWeek >= 0 &&
            s.dayOfWeek <= 6 &&
            /^\d{2}:\d{2}$/.test(s.startTime) &&
            /^\d{2}:\d{2}$/.test(s.endTime))
        : [];
    const [formData, setFormData] = useState({
        name: profile?.name || '',
        email: user.email || '',
        bio: profileData.bio || '',
        phone: normalizeUsPhoneToNationalDigits(profileData.phone_e164 || profileData.phone || ''),
        license_number: profileData.license_number || '',
        state: Array.isArray(profileData.licensed_states) && profileData.licensed_states.length > 0
            ? profileData.licensed_states[0]
            : '',
        specialties: profileData.specialties || [],
        years_experience: String(profileData.years_experience || ''),
        rate: String(profileData.rate || ''),
        approach: profileData.approach || '',
        education: profileData.education || '',
        profileImage: null,
        profileImageUrl: profileData.profile_image_url || authAvatar || '',
    });
    const [booking, setBooking] = useState({
        allowSelfBooking: typeof profileData.allow_self_booking === 'boolean' ? profileData.allow_self_booking : true,
        calendarVisible: typeof profileData.calendar_visible === 'boolean' ? profileData.calendar_visible : true,
        sessionDuration: typeof profileData.session_duration === 'number'
            ? profileData.session_duration
            : Number(profileData.session_duration) || 60,
        availability: initialAvailability,
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
    const handleSpecialtyToggle = (specialty) => {
        setFormData({
            ...formData,
            specialties: formData.specialties.includes(specialty)
                ? formData.specialties.filter((s) => s !== specialty)
                : [...formData.specialties, specialty],
        });
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
                const { url, error: uploadError } = await uploadProfileImage(file);
                if (uploadError) {
                    throw new Error(uploadError);
                }
                if (url) {
                    await authService.updateProfile(user.id, {
                        profile_image_url: url,
                    });
                    setFormData({
                        ...formData,
                        profileImage: file,
                        profileImageUrl: url,
                    });
                    router.refresh();
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
            const normalizedRate = Math.round((parseFloat(formData.rate) || 0) * 100) / 100;
            const phoneE164 = formData.phone ? usNationalDigitsToE164(formData.phone) : null;
            await authService.updateProfile(user.id, {
                full_name: formData.name,
                bio: formData.bio,
                phone_e164: phoneE164 || '',
                specialties: formData.specialties,
                rate: normalizedRate,
                ...(formData.profileImageUrl ? { profile_image_url: formData.profileImageUrl } : {}),
                allow_self_booking: booking.allowSelfBooking,
                calendar_visible: booking.calendarVisible,
                session_duration: booking.sessionDuration,
                availability: booking.availability,
                years_experience: formData.years_experience ? parseInt(formData.years_experience, 10) : null,
                approach: formData.approach || null,
            });
            setSuccess(true);
            router.refresh();
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update profile');
        }
        finally {
            setLoading(false);
        }
    };
    return (<form onSubmit={handleSubmit} className="space-y-6">
      {/* Success/Error Messages */}
      <AnimatePresence>
        {success && (<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600"/>
              <AlertDescription className="text-green-700">
                Profile updated successfully!
              </AlertDescription>
            </Alert>
          </motion.div>)}

        {error && (<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4"/>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>)}
      </AnimatePresence>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Col 1: Profile Picture & Basic Info - Stacked */}
        <div className="md:col-span-1 space-y-6">
          {/* Profile Picture Card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Profile Picture</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center">
              <div className="relative group cursor-pointer mb-4">
                 <Avatar className="h-32 w-32 border-4 border-indigo-50 shadow-inner group-hover:border-indigo-100 transition-colors">
                  {formData.profileImageUrl ? (<AvatarImage src={formData.profileImageUrl} alt="Profile" className="object-cover"/>) : (<AvatarFallback className="bg-indigo-50 text-indigo-500 text-4xl">
                      <UserIcon className="h-12 w-12"/>
                    </AvatarFallback>)}
                </Avatar>
                <div className="absolute bottom-0 right-0 bg-white rounded-full p-2 border shadow-sm group-hover:bg-indigo-50 transition-colors">
                   <Label htmlFor="profile-image" className="cursor-pointer block">
                      <Upload className="h-4 w-4 text-indigo-600"/>
                   </Label>
                </div>
              </div>

               <Label htmlFor="profile-image" className="cursor-pointer">
                  <span className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                    {uploadingImage ? 'Uploading...' : 'Click to Change'}
                  </span>
               </Label>
               <Input id="profile-image" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleProfileImageChange} disabled={loading || uploadingImage} className="hidden"/>
               <p className="text-xs text-muted-foreground mt-2 max-w-[150px]">
                 JPG, PNG or WEBP (max 5MB)
               </p>
            </CardContent>
          </Card>

          {/* Basic Contact Info */}
           <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                 <UserIcon className="h-4 w-4 text-indigo-500"/>
                 Contact Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Email</Label>
                <div className="relative">
                   <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"/>
                   <Input id="email" value={formData.email} disabled className="bg-gray-50 pl-9 border-gray-200 text-gray-600"/>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Phone</Label>
                <UsPhoneInput id="phone" name="phone" value={formData.phone} onValueChange={(next) => {
            setFormData((prev) => ({ ...prev, phone: next }));
            if (error)
                setError('');
            if (success)
                setSuccess(false);
        }} placeholder="5550000000" disabled={loading} className="bg-white"/>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Col 2 & 3: Main Profile Data */}
        <div className="md:col-span-2 space-y-6">
           
           {/* Row 1: Key Professional Details */}
           <Card>
              <CardHeader className="pb-4">
                 <CardTitle className="text-lg flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-indigo-500"/>
                    Professional Identity
                 </CardTitle>
                 <CardDescription>How you appear to clients</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleChange} disabled={loading} className="bg-gray-50/50"/>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="license_number">License Number</Label>
                    <div className="relative">
                        <Award className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"/>
                        <Input id="license_number" name="license_number" value={formData.license_number} onChange={handleChange} className="pl-9" disabled/>
                    </div>
                    <p className="text-xs text-gray-500">
                      Read-only. To change, contact Admin/Support.
                    </p>
                  </div>

                   <div className="space-y-2">
                    <Label htmlFor="state">Licensed State</Label>
                    <Select value={formData.state} onValueChange={(value) => {
            setFormData({ ...formData, state: value });
            if (error)
                setError('');
            if (success)
                setSuccess(false);
        }} disabled>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select State"/>
                      </SelectTrigger>
                      <SelectContent>
                        {US_STATES.map((state) => (<SelectItem key={state.value} value={state.value}>
                            {state.label}
                          </SelectItem>))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      Read-only. To change, contact Admin/Support.
                    </p>
                  </div>
              </CardContent>
           </Card>

           {/* Row 2: Practice Specifics */}
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <Card className="sm:col-span-1">
                  <CardContent className="p-4 pt-6">
                      <div className="flex flex-col gap-3">
                         <Label htmlFor="years_experience" className="text-xs text-muted-foreground uppercase font-semibold">Experience</Label>
                         <div className="flex items-center gap-2">
                            <Input id="years_experience" name="years_experience" type="number" min="0" value={formData.years_experience} onChange={handleChange} className="text-lg font-bold h-12" disabled={loading}/>
                            <span className="text-sm text-gray-500">Yrs</span>
                         </div>
                      </div>
                  </CardContent>
               </Card>

                <Card className="sm:col-span-1">
                  <CardContent className="p-4 pt-6">
                      <div className="flex flex-col gap-3">
                         <Label htmlFor="rate" className="text-xs text-muted-foreground uppercase font-semibold">Hourly Rate</Label>
                         <div className="relative">
                            <span className="absolute left-3 top-3 text-gray-500 font-bold">$</span>
                            <Input id="rate" name="rate" type="number" min="0" step="0.01" value={formData.rate} onChange={handleChange} className="text-lg font-bold h-12 pl-7" disabled={loading}/>
                         </div>
                      </div>
                  </CardContent>
               </Card>

           </div>
           
           {/* Education & Bio */}
           <Card>
              <CardHeader className="pb-4">
                 <CardTitle className="text-lg">Credentials & Bio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="education">Education</Label>
                    <Input id="education" name="education" value={formData.education} onChange={handleChange} placeholder="Degree, University..." disabled/>
                    <p className="text-xs text-gray-500">
                      Read-only. To change, contact Admin/Support.
                    </p>
                 </div>
                 
                 <div className="space-y-2">
                    <Label htmlFor="bio">Professional Bio</Label>
                    <Textarea id="bio" name="bio" value={formData.bio} onChange={handleChange} placeholder="Tell clients about yourself..." rows={4} className="resize-none bg-gray-50/50" disabled={loading}/>
                 </div>
              </CardContent>
           </Card>


        </div>

        {/* Booking & Availability — full width */}
        <div className="md:col-span-3">
          <BookingAvailabilityCard value={booking} onChange={setBooking} disabled={loading}/>
        </div>

        {/* Col 3: Spanning Footer Area or Side Panels depending on design preferrence, here putting bigger text areas at bottom full width */}
        <div className="md:col-span-3">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Specialties */}
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle className="text-lg">Specialties</CardTitle>
                      <CardDescription>Select your areas of expertise</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {THERAPIST_SPECIALTIES.map((specialty) => (<Badge key={specialty} variant={formData.specialties.includes(specialty) ? 'default' : 'outline'} className={`cursor-pointer px-3 py-1.5 text-sm transition-all ${formData.specialties.includes(specialty)
                ? 'bg-indigo-600 hover:bg-indigo-700 shadow-sm'
                : 'hover:bg-gray-100 text-gray-600 border-gray-200'}`} onClick={() => handleSpecialtyToggle(specialty)}>
                              {specialty}
                              {formData.specialties.includes(specialty) && <CheckCircle2 className="ml-1.5 h-3 w-3"/>}
                            </Badge>))}
                        </div>
                    </CardContent>
                  </Card>

                 {/* Approach */}
                 <Card className="h-full">
                    <CardHeader>
                      <CardTitle className="text-lg">Therapeutic Approach</CardTitle>
                      <CardDescription>Describe your methods</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <Textarea id="approach" name="approach" value={formData.approach} onChange={handleChange} placeholder="My approach combines..." rows={6} className="resize-none h-full min-h-[150px]" disabled={loading}/>
                    </CardContent>
                 </Card>
             </div>
        </div>

      </div>



      {/* Submit Button */}
      <div className="flex items-center justify-end gap-4 pt-4">
        <Button type="button" variant="outline" onClick={() => window.location.reload()} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="min-w-[120px]">
          {loading ? (<>
              <Loader2 className="h-4 w-4 mr-2 animate-spin"/>
              Saving...
            </>) : ('Save Changes')}
        </Button>
      </div>
    </form>);
}
