'use client';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/93bde5168d2a';
import { Button } from '@/components/2795b661f080';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/c0ebd3fbafc6';
import { Badge } from '@/components/30348591d689';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/2318256b5648';
import { User as UserIcon, Briefcase, Calendar, MapPin, Award, Mail, Clock, Heart, FileText, Eye, Download, ShieldCheck } from 'lucide-react';
import TherapistProfileForm from '@/components/f1612eace742';
import AvailabilitySettings from '@/components/8af84d2e91ac';
import { US_STATES } from '@/components/96fabadae962';
import { Dialog, DialogContent, DialogHeader, DialogTitle, } from '@/components/ba221113eac7';
import { Loader2 } from 'lucide-react';
export default function TherapistProfileTabs({ user, profile, isOnboarding = false, canEdit = true, showConfidentialDocuments = false, initialTab, }) {
    const profileData = profile?.profile_json || {};
    const stateCodes = Array.isArray(profileData.licensed_states)
        ? profileData.licensed_states.filter((v) => typeof v === 'string' && v.trim().length > 0)
        : [];
    const primaryStateCode = stateCodes[0] || '';
    const primaryStateName = US_STATES.find((s) => s.value === primaryStateCode)?.label || 'Not set';
    const stateName = stateCodes.length > 1 ? `${primaryStateName} +${stateCodes.length - 1}` : primaryStateName;
    const stateCode = stateCodes.length > 1 ? `${primaryStateCode} +${stateCodes.length - 1}` : primaryStateCode;
    const authMetadata = user?.user_metadata;
    const resolvedProfileImage = profileData.profile_image_url ||
        authMetadata?.avatar_url ||
        authMetadata?.picture ||
        '';
    const availability = profileData.availability || [];
    // Map 'availability' to 'schedule' to assume the new tab name
    const defaultTab = initialTab === 'availability' ? 'schedule' : (initialTab || (canEdit ? (isOnboarding ? "profile" : "overview") : "overview"));
    const [viewingDoc, setViewingDoc] = useState(null);
    const [isSigningUrl, setIsSigningUrl] = useState(false);
    // Get credentials from profile or empty array
    const credentials = profile?.credentials || [];
    // Organize credentials by kind
    const licenseCredential = credentials.find((c) => c.credential_kind === 'license');
    const resumeCredential = credentials.find((c) => c.credential_kind === 'resume');
    const degreeCredential = credentials.find((c) => c.credential_kind === 'degree');
    const certificationCredentials = credentials.filter((c) => c.credential_kind === 'certification');
    const additionalCredentials = credentials.filter((c) => c.credential_kind === 'additional' || !c.credential_kind);
    const displayRate = Number(profileData.rate || 0).toFixed(2);
    const handleViewDocument = async (path, docName) => {
        try {
            setIsSigningUrl(true);
            const isPdf = path.toLowerCase().endsWith('.pdf');
            const res = await fetch('/api/admin/credentials/signed-url', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ path }),
            });
            if (!res.ok) {
                const body = (await res.json().catch(() => null));
                console.error('Error creating signed URL:', body?.error || res.statusText);
                return;
            }
            const body = (await res.json());
            setViewingDoc({ name: docName, url: body.signedUrl, type: isPdf ? 'pdf' : 'image' });
        }
        catch (err) {
            console.error('Error viewing document:', err);
        }
        finally {
            setIsSigningUrl(false);
        }
    };
    return (<div className="space-y-6">
      {/* Profile Summary Header (Premium Design) */}
      <Card className="border-none shadow-xl bg-white overflow-visible ring-1 ring-black/5 rounded-3xl mt-4">
        {/* Banner Section */}
        <div className="relative h-48 w-full rounded-t-3xl overflow-hidden group">
          <div className="absolute inset-0 bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-purple-900 to-slate-900"></div>
          <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150 mix-blend-overlay"></div>
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 via-black/30 to-transparent"></div>
          
          {/* Subtle animated blurs */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500/30 rounded-full blur-3xl group-hover:bg-purple-500/40 transition-colors duration-700"></div>
          <div className="absolute bottom-0 left-20 w-40 h-40 bg-blue-500/20 rounded-full blur-2xl"></div>
        </div>
        
        <CardContent className="px-6 md:px-10 pb-8 relative">
           <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start -mt-20">
              
              {/* Avatar Section with Ring & Glass effect */}
              <div className="relative z-10 flex-shrink-0 mx-auto md:mx-0 group">
                 <div className="p-1.5 bg-white/20 backdrop-blur-md rounded-full ring-1 ring-white/40 shadow-2xl">
                     <Avatar className="h-40 w-40 md:h-44 md:w-44 border-4 border-white shadow-xl bg-white transition-transform duration-300 group-hover:scale-[1.02]">
                        {resolvedProfileImage ? (<AvatarImage src={resolvedProfileImage} alt={profile?.name} className="object-cover"/>) : (<AvatarFallback className="text-4xl md:text-5xl font-bold text-white bg-gradient-to-br from-indigo-500 to-purple-600">
                            {profile?.name?.charAt(0).toUpperCase() || 'T'}
                          </AvatarFallback>)}
                     </Avatar>
                 </div>
                 {/* Optional: Status Indicator */}
                 <div className="absolute bottom-4 right-4 h-6 w-6 bg-green-500 border-4 border-white rounded-full shadow-md z-20" title="Available"></div>
              </div>

              {/* Main Info Section */}
              <div className="flex-1 pt-3 md:pt-24 space-y-5 text-center md:text-left w-full">
                  <div className="space-y-2">
                      <div className="flex flex-col md:flex-row items-center md:items-end gap-3 justify-center md:justify-start">
                          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
                            {profile?.name || 'Your Name'}
                          </h2>
                          <Badge variant="secondary" className="mb-1.5 bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100 transition-colors">
                             <ShieldCheck className="h-3.5 w-3.5 mr-1"/> Verified Therapist
                          </Badge>
                      </div>
                      
                      <div className="flex items-center justify-center md:justify-start gap-2 text-gray-500 font-medium">
                          <div className="p-1 rounded-full bg-gray-100">
                             <Mail className="h-4 w-4 text-gray-400"/>
                          </div>
                          <span>{profile?.email}</span>
                      </div>
                  </div>

                  {/* Badges / Meta Data */}
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                      <div className="flex items-center px-4 py-2 bg-slate-50 border border-slate-100 rounded-full text-sm font-semibold text-slate-700 shadow-sm hover:shadow-md transition-shadow cursor-default">
                          <MapPin className="h-4 w-4 mr-2 text-amber-500"/>
                          {stateName} <span className="mx-2 text-gray-300">|</span> {stateCode}
                      </div>
                      <div className="flex items-center px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full text-sm font-semibold text-indigo-700 shadow-sm hover:shadow-md transition-shadow cursor-default">
                          <Award className="h-4 w-4 mr-2 text-indigo-500"/>
                          Lic: <span className="font-mono ml-1">{profileData.license_number || 'N/A'}</span>
                      </div>
                  </div>
              </div>

               {/* Stats Box Right Side */}
               <div className="md:pt-24 w-full md:w-auto flex flex-col items-center md:items-end gap-3 px-4 md:px-0">
                   <div className="flex items-stretch gap-0 border border-gray-100 rounded-2xl overflow-hidden shadow-sm bg-white divide-x divide-gray-100 ring-1 ring-gray-200/50 hover:shadow-md transition-all duration-300">
                       <div className="px-6 py-4 text-center min-w-[110px] bg-gradient-to-b from-white to-gray-50/50">
                           <div className="text-[11px] text-gray-400 font-extrabold uppercase tracking-widest mb-1">Rate</div>
                           <div className="text-2xl font-black text-gray-900 tracking-tight flex items-center justify-center">
                              <span className="text-sm text-gray-400 font-medium mr-0.5 mt-1">$</span>
                              {displayRate}
                           </div>
                           <div className="text-[10px] text-gray-400 font-semibold">per hour</div>
                       </div>
                       <div className="px-6 py-4 text-center min-w-[110px] bg-gradient-to-b from-white to-gray-50/50">
                           <div className="text-[11px] text-gray-400 font-extrabold uppercase tracking-widest mb-1">Exp</div>
                           <div className="text-2xl font-black text-gray-900 tracking-tight">
                              {profileData.years_experience || '0'}
                              <span className="text-sm text-gray-400 font-medium ml-0.5">+</span>
                           </div>
                           <div className="text-[10px] text-gray-400 font-semibold">years</div>
                       </div>
                   </div>
               </div>

           </div>
        </CardContent>
      </Card>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="bg-white p-1 border shadow-sm w-full justify-start overflow-x-auto h-auto">
          <TabsTrigger value="overview" className="gap-2 py-2.5 px-4">
             <Briefcase className="h-4 w-4"/>
             Overview
          </TabsTrigger>
          {canEdit && (<TabsTrigger value="profile" className="gap-2 py-2.5 px-4">
               <UserIcon className="h-4 w-4"/>
               Edit Profile
            </TabsTrigger>)}
          <TabsTrigger value="schedule" className="gap-2 py-2.5 px-4">
             <Calendar className="h-4 w-4"/>
             Schedule
          </TabsTrigger>
          {showConfidentialDocuments && (<TabsTrigger value="documents" className="gap-2 py-2.5 px-4">
              <FileText className="h-4 w-4"/>
              Documents
            </TabsTrigger>)}
        </TabsList>

        <TabsContent value="overview" className="space-y-6 animate-in fade-in-50 duration-500">
          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-auto">
            
            {/* Bio - Span 2 cols, 2 rows */}
            <Card className="md:col-span-2 md:row-span-2 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserIcon className="h-5 w-5 text-indigo-500"/>
                  About Me
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-sm">
                  {profileData.bio || 'No bio added yet. Update your profile to add one.'}
                </p>
              </CardContent>
            </Card>

            {/* Specialties - Span 2 cols, 1 row */}
            <Card className="md:col-span-2 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Heart className="h-5 w-5 text-pink-500"/>
                  Specialties
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(profileData.specialties || []).map((specialty) => (<Badge key={specialty} variant="secondary" className="bg-pink-50 text-pink-700 hover:bg-pink-100 border-pink-100 px-3 py-1">
                      {specialty}
                    </Badge>))}
                  {(profileData.specialties || []).length === 0 && (<span className="text-sm text-gray-500 italic">No specialties listed</span>)}
                </div>
              </CardContent>
            </Card>

            {/* Approach - Span 2 cols, 1 row */}
            <Card className="md:col-span-2 shadow-sm hover:shadow-md transition-shadow">
               <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Brain className="h-5 w-5 text-purple-500"/>
                  Approach
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 leading-relaxed line-clamp-4">
                  {profileData.approach || 'No approach listed.'}
                </p>
              </CardContent>
            </Card>

            {/* Quick Details - Span 4 cols (Full Width) Grid */}
            <div className="md:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                 <Card className="bg-gray-50 border-gray-200">
                    <CardContent className="p-4 flex flex-row items-center gap-4">
                        <div className="p-2 bg-white rounded-lg shadow-sm text-green-600">
                           <Clock className="h-6 w-6"/>
                        </div>
                        <div>
                           <div className="text-xs text-gray-500 font-medium uppercase">Session Length</div>
                           <div className="font-bold text-gray-900">{profileData.session_duration || 60} mins</div>
                        </div>
                    </CardContent>
                 </Card>
                 
                 <Card className="bg-gray-50 border-gray-200">
                    <CardContent className="p-4 flex flex-row items-center gap-4">
                        <div className="p-2 bg-white rounded-lg shadow-sm text-blue-600">
                           <Award className="h-6 w-6"/>
                        </div>
                        <div>
                           <div className="text-xs text-gray-500 font-medium uppercase">Education</div>
                           <div className="font-bold text-gray-900 truncate max-w-[150px]" title={profileData.education || 'N/A'}>
                              {profileData.education ? 'On File' : 'N/A'}
                           </div>
                        </div>
                    </CardContent>
                 </Card>

                 <Card className="bg-gray-50 border-gray-200">
                    <CardContent className="p-4 flex flex-row items-center gap-4">
                        <div className="p-2 bg-white rounded-lg shadow-sm text-orange-600">
                           <MapPin className="h-6 w-6"/>
                        </div>
                        <div>
                           <div className="text-xs text-gray-500 font-medium uppercase">Location</div>
                           <div className="font-bold text-gray-900">{stateName}</div>
                        </div>
                    </CardContent>
                 </Card>

                 <Card className="bg-gray-50 border-gray-200">
                    <CardContent className="p-4 flex flex-row items-center gap-4">
                        <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-600">
                           <ShieldCheck className="h-6 w-6"/>
                        </div>
                        <div>
                           <div className="text-xs text-gray-500 font-medium uppercase">Verification</div>
                           <div className="font-bold text-gray-900">Verified</div>
                        </div>
                    </CardContent>
                 </Card>
            </div>
          </div>
        </TabsContent>

        {canEdit && user && (<TabsContent value="profile" className="animate-in fade-in-50 duration-500">
            <TherapistProfileForm user={user} profile={profile}/>
          </TabsContent>)}

        <TabsContent value="schedule" className="space-y-6 animate-in fade-in-50 duration-500">
          {canEdit && user ? (<>
              <div className="flex items-center justify-between mb-2">
                 <div>
                    <h3 className="text-lg font-semibold text-gray-900">Weekly Availability</h3>
                    <p className="text-sm text-gray-500">Define your standard weekly schedule for client bookings.</p>
                 </div>
              </div>
              <AvailabilitySettings user={user} initialAvailability={availability} profileId={profile?.id || ''} profileJson={profileData}/>
            </>) : (<Card className="border-2 border-indigo-100 bg-gradient-to-br from-indigo-50/30 to-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-indigo-600"/>
                  Weekly Schedule
                </CardTitle>
                <CardDescription>
                  Available weekly slots for client sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {availability.length > 0 ? (<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => {
                    const daySlots = availability
                        .filter(slot => slot.dayOfWeek === index)
                        .sort((a, b) => a.startTime.localeCompare(b.startTime));
                    if (daySlots.length === 0)
                        return null;
                    return (<div key={day} className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-2 mb-3">
                            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                              {day}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            {daySlots.map((slot, i) => (<div key={i} className="flex items-center text-sm text-gray-600 bg-gray-50 rounded-md px-2 py-1.5">
                                <Clock className="h-3.5 w-3.5 mr-2 text-indigo-400"/>
                                <span>{slot.startTime}</span>
                                <span className="mx-1 text-gray-400">-</span>
                                <span>{slot.endTime}</span>
                              </div>))}
                          </div>
                        </div>);
                })}
                  </div>) : (<div className="text-center py-12 bg-white/50 rounded-xl border-2 border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="h-8 w-8 text-indigo-400"/>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">No availability set</h3>
                    <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                      This therapist hasn&apos;t set up their schedule yet.
                    </p>
                  </div>)}
              </CardContent>
            </Card>)}
        </TabsContent>

        {showConfidentialDocuments && (<TabsContent value="documents" className="space-y-6">
            <Card className="border-2 border-indigo-100 bg-gradient-to-br from-indigo-50/30 to-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-indigo-600"/>
                  Credential Verification
                </CardTitle>
                <CardDescription>
                  Review uploaded documents for compliance and verification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {credentials.length === 0 ? (<div className="text-center py-12 bg-white/50 rounded-xl border-2 border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 text-indigo-400"/>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">No credentials uploaded</h3>
                    <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                      This therapist has not yet uploaded any credential documents.
                    </p>
                  </div>) : (<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {/* License Document */}
                    {licenseCredential && (<Card className="border shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-4">
                            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                              <Award className="h-6 w-6"/>
                            </div>
                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                              License
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-1">Professional License</h3>
                          <p className="text-xs text-muted-foreground mb-2">{licenseCredential.file_name}</p>
                          <p className="text-xs text-muted-foreground mb-4">Uploaded document</p>
                          <div className="flex gap-2">
                            <Button variant="outline" className="flex-1 h-9 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border-indigo-200" onClick={() => {
                        handleViewDocument(licenseCredential.file_url, 'Professional License');
                    }} disabled={isSigningUrl}>
                              {isSigningUrl ? <Loader2 className="h-4 w-4 animate-spin"/> : <Eye className="h-4 w-4 mr-2"/>}
                              View
                            </Button>
                          </div>
                        </CardContent>
                      </Card>)}

                    {/* Resume Document */}
                    {resumeCredential && (<Card className="border shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-4">
                            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                              <FileText className="h-6 w-6"/>
                            </div>
                            <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                              Resume
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-1">CV / Resume</h3>
                          <p className="text-xs text-muted-foreground mb-2">{resumeCredential.file_name}</p>
                          <p className="text-xs text-muted-foreground mb-4">Uploaded document</p>
                          <div className="flex gap-2">
                            <Button variant="outline" className="flex-1 h-9 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border-indigo-200" onClick={() => {
                        handleViewDocument(resumeCredential.file_url, 'CV / Resume');
                    }} disabled={isSigningUrl}>
                              {isSigningUrl ? <Loader2 className="h-4 w-4 animate-spin"/> : <Eye className="h-4 w-4 mr-2"/>}
                              View
                            </Button>
                          </div>
                        </CardContent>
                      </Card>)}

                    {/* Degree Document */}
                    {degreeCredential && (<Card className="border shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-4">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                              <Award className="h-6 w-6"/>
                            </div>
                            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                              Degree
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-1">Degree / Certificate</h3>
                          <p className="text-xs text-muted-foreground mb-2">{degreeCredential.file_name}</p>
                          <p className="text-xs text-muted-foreground mb-4">Uploaded document</p>
                          <div className="flex gap-2">
                            <Button variant="outline" className="flex-1 h-9 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border-indigo-200" onClick={() => {
                        handleViewDocument(degreeCredential.file_url, 'Degree / Certificate');
                    }} disabled={isSigningUrl}>
                              {isSigningUrl ? <Loader2 className="h-4 w-4 animate-spin"/> : <Eye className="h-4 w-4 mr-2"/>}
                              View
                            </Button>
                          </div>
                        </CardContent>
                      </Card>)}

                    {/* Certification Documents */}
                    {certificationCredentials.map((cred, index) => (<Card key={cred.id} className="border shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-4">
                            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                              <Award className="h-6 w-6"/>
                            </div>
                            <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">
                              Certification
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-1">Certification {index + 1}</h3>
                          <p className="text-xs text-muted-foreground mb-2">{cred.file_name}</p>
                          <p className="text-xs text-muted-foreground mb-4">Uploaded document</p>
                          <div className="flex gap-2">
                            <Button variant="outline" className="flex-1 h-9 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border-indigo-200" onClick={() => {
                        handleViewDocument(cred.file_url, `Certification ${index + 1}`);
                    }} disabled={isSigningUrl}>
                              {isSigningUrl ? <Loader2 className="h-4 w-4 animate-spin"/> : <Eye className="h-4 w-4 mr-2"/>}
                              View
                            </Button>
                          </div>
                        </CardContent>
                      </Card>))}

                    {/* Additional Documents */}
                    {additionalCredentials.map((cred, index) => (<Card key={cred.id} className="border shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-4">
                            <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                              <Briefcase className="h-6 w-6"/>
                            </div>
                            <Badge variant="outline" className="text-slate-600 border-slate-200 bg-slate-50">
                              Additional
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-1">Supporting Document {index + 1}</h3>
                          <p className="text-xs text-muted-foreground mb-2">{cred.file_name}</p>
                          <p className="text-xs text-muted-foreground mb-4">Uploaded document</p>
                          <div className="flex gap-2">
                            <Button variant="outline" className="flex-1 h-9 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border-indigo-200" onClick={() => {
                        handleViewDocument(cred.file_url, `Supporting Document ${index + 1}`);
                    }} disabled={isSigningUrl}>
                              {isSigningUrl ? <Loader2 className="h-4 w-4 animate-spin"/> : <Eye className="h-4 w-4 mr-2"/>}
                              View
                            </Button>
                          </div>
                        </CardContent>
                      </Card>))}
                  </div>)}
              </CardContent>
            </Card>
          </TabsContent>)}

        {/* Document Viewer Dialog */}
        <Dialog open={!!viewingDoc} onOpenChange={(open) => !open && setViewingDoc(null)}>
          <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
            <DialogHeader className="p-4 border-b">
              <DialogTitle className="flex items-center justify-between">
                <span>{viewingDoc?.name}</span>
                {viewingDoc?.url && (<a href={viewingDoc.url} download target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                    <Download className="h-4 w-4"/>
                    Download Original
                  </a>)}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 bg-gray-100 overflow-hidden flex items-center justify-center relative">
              {viewingDoc?.type === 'image' ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={viewingDoc.url} alt={viewingDoc.name} className="w-full h-full object-contain"/>) : (<iframe src={viewingDoc?.url} className="w-full h-full" title={viewingDoc?.name}/>)}
            </div>
          </DialogContent>
        </Dialog>
      </Tabs>
    </div>);
}
function Brain(props) {
    return (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/>
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/>
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/>
      <path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/>
      <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/>
      <path d="M3.477 10.896a4 4 0 0 1 .585-.396"/>
      <path d="M19.938 10.5a4 4 0 0 1 .585.396"/>
      <path d="M6 18a4 4 0 0 1-1.97-3.484"/>
      <path d="M20 18a4 4 0 0 0-1.97-3.484"/>
    </svg>);
}
