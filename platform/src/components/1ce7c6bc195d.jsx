import { createClient } from '@/components/9a6b39502e62';
import { notFound, redirect } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/2318256b5648';
import { Badge } from '@/components/30348591d689';
import { Button } from '@/components/2795b661f080';
import { Card, CardContent } from '@/components/c0ebd3fbafc6';
import { Separator } from '@/components/19cc3f2900f4';
import { Clock, Award, CheckCircle2, ArrowLeft, MapPin, MessageSquare, GraduationCap, Stethoscope, Globe2, ShieldCheck, } from 'lucide-react';
import Link from 'next/link';
import { US_STATES } from '@/components/96fabadae962';
import BookingEntrypoint from '@/components/3dd7b9931a1a';
import { resolveBookingPayoutGate } from '@/components/73ba0fd5210e';
import { RemoveTherapistButton } from '@/components/9ce734f517a1';
export default async function TherapistProfilePage({ params, searchParams, }) {
    const supabase = await createClient();
    const sp = await searchParams;
    const { data: { user }, } = await supabase.auth.getUser();
    if (!user)
        redirect('/login');
    const { data: currentUserProfile } = await supabase
        .from('user_roles')
        .select('role')
        .eq('id', user.id)
        .single();
    if (currentUserProfile?.role !== 'seeker')
        redirect('/login');
    const { therapistId } = await params;
    const [{ data: therapistRole, error }, { data: therapistProfileRow }] = await Promise.all([
        supabase
            .from('user_roles')
            .select('id, role, status')
            .eq('id', therapistId)
            .eq('role', 'therapist')
            .eq('status', 'active')
            .single(),
        supabase.from('user_profiles').select('*').eq('user_id', therapistId).single(),
    ]);
    if (error || !therapistRole)
        notFound();
    const profile = (therapistProfileRow ?? {});
    const fullName = profile.full_name || '';
    const preferredName = profile.preferred_name || '';
    const displayName = preferredName || fullName;
    const pronouns = profile.pronouns || '';
    const bio = profile.bio || '';
    const approach = profile.approach || '';
    const educationRaw = profile.education;
    const education = Array.isArray(educationRaw)
        ? educationRaw
        : educationRaw
            ? [educationRaw]
            : [];
    const specialties = profile.specialties || [];
    const rate = Number(profile.rate ?? 0);
    const showRatePublicly = Boolean(profile.show_rate_publicly);
    const yearsExperience = Number(profile.years_experience ?? 0);
    const profileImageUrl = profile.profile_image_url || '';
    const licenseNumber = profile.license_number || '';
    const licensedStates = profile.licensed_states || [];
    const licensedStateLabels = licensedStates
        .map((code) => US_STATES.find((s) => s.value === code)?.label || code)
        .filter(Boolean);
    const sessionDuration = Number(profile.session_duration ?? 60);
    const timeZone = profile.time_zone || '';
    const allowSelfBooking = typeof profile.allow_self_booking === 'boolean' ? profile.allow_self_booking : true;
    const calendarVisible = typeof profile.calendar_visible === 'boolean' ? profile.calendar_visible : true;
    const { data: acceptedRequest } = await supabase
        .from('connection_requests')
        .select('id')
        .eq('seeker_id', user.id)
        .eq('therapist_id', therapistId)
        .eq('status', 'accepted')
        .maybeSingle();
    // Payout setup only blocks therapists who actually charge (billing tier + rate).
    const payoutGate = await resolveBookingPayoutGate(therapistId, rate);
    const payoutReady = !payoutGate.blocked;
    const baseBookingEnabled = calendarVisible && (allowSelfBooking || Boolean(acceptedRequest));
    const bookingEnabled = baseBookingEnabled && payoutReady;
    const bookingDisabledReason = !calendarVisible
        ? 'This therapist is not offering self-scheduling right now.'
        : payoutGate.blocked
            ? payoutGate.message
            : baseBookingEnabled
                ? ''
                : 'This therapist prefers a quick consultation first. Send a message to introduce yourself and they will schedule with you.';
    const shouldAutoOpenBooking = bookingEnabled && sp.book === '1';
    const initials = displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'T';
    const credentialBlocks = [];
    if (licenseNumber) {
        credentialBlocks.push({
            title: `License #${licenseNumber}`,
            subtitle: licensedStateLabels.length
                ? `Licensed to practice in ${licensedStateLabels.join(', ')}`
                : 'Verified clinical license on file',
            icon: 'license',
        });
    }
    else if (licensedStateLabels.length) {
        credentialBlocks.push({
            title: `Licensed in ${licensedStateLabels.join(', ')}`,
            subtitle: 'Verified state licensure',
            icon: 'states',
        });
    }
    education.forEach((edu) => credentialBlocks.push({ title: edu, subtitle: 'Education & training', icon: 'edu' }));
    return (<div className="min-h-screen bg-gray-50/50 pb-12">
      <div className="relative bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 pb-32 pt-12 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"/>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button asChild variant="ghost" className="text-white/90 hover:text-white hover:bg-white/10 mb-8 pl-0 hover:pl-2 transition-all">
            <Link href="/seeker/therapists">
              <ArrowLeft className="w-4 h-4 mr-2"/>
              Back to All Therapists
            </Link>
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="overflow-hidden shadow-xl border-0 ring-1 ring-black/5 relative z-10">
              <CardContent className="p-0">
                <div className="p-8 flex flex-col sm:flex-row gap-8 items-start">
                  <Avatar className="h-32 w-32 sm:h-40 sm:w-40 rounded-2xl ring-4 ring-white shadow-lg overflow-hidden bg-white">
                    {profileImageUrl && (<AvatarImage src={profileImageUrl} alt={displayName} className="object-cover w-full h-full"/>)}
                    <AvatarFallback className="w-full h-full bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center rounded-2xl">
                      <span className="text-4xl font-bold text-indigo-600">{initials}</span>
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-4 pt-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-2">
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                          {displayName}
                        </h1>
                        {pronouns && (<span className="text-sm text-gray-500 font-medium">({pronouns})</span>)}
                        {licenseNumber && (<Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 gap-1">
                            <CheckCircle2 className="w-3 h-3 fill-blue-600 text-white"/>
                            Licensed Clinician
                          </Badge>)}
                      </div>
                      <p className="text-base text-gray-600 font-medium">
                        Licensed Mental Health Professional
                      </p>
                      {preferredName && fullName && preferredName !== fullName && (<p className="text-sm text-gray-400 mt-1">Legal name: {fullName}</p>)}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {yearsExperience > 0 && (<Pill icon={<Clock className="w-4 h-4 text-indigo-500"/>} text={`${yearsExperience}+ years experience`}/>)}
                      {licensedStateLabels.length > 0 && (<Pill icon={<MapPin className="w-4 h-4 text-emerald-500"/>} text={licensedStateLabels.length === 1
                ? licensedStateLabels[0]
                : `${licensedStateLabels.length} states`}/>)}
                      <Pill icon={<Clock className="w-4 h-4 text-blue-500"/>} text={`${sessionDuration} min sessions`}/>
                      {timeZone && (<Pill icon={<Globe2 className="w-4 h-4 text-purple-500"/>} text={timeZone}/>)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {bio && (<Section icon={<Stethoscope className="w-5 h-5 text-indigo-600"/>} title={`About ${displayName.split(' ')[0]}`}>
                <p className="text-gray-700 leading-relaxed text-base whitespace-pre-line">{bio}</p>
              </Section>)}

            {approach && (<Section icon={<Award className="w-5 h-5 text-indigo-600"/>} title="Therapeutic Approach">
                <p className="text-gray-700 leading-relaxed text-base whitespace-pre-line">{approach}</p>
              </Section>)}

            {specialties.length > 0 && (<Section icon={<Award className="w-5 h-5 text-indigo-600"/>} title="Specialties & Focus Areas">
                <div className="flex flex-wrap gap-2">
                  {specialties.map((specialty) => (<Badge key={specialty} variant="secondary" className="px-4 py-2 text-sm bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-100 transition-colors">
                      {specialty}
                    </Badge>))}
                </div>
              </Section>)}

            {credentialBlocks.length > 0 && (<Section icon={<ShieldCheck className="w-5 h-5 text-indigo-600"/>} title="Credentials & Licensure">
                <div className="space-y-4">
                  {credentialBlocks.map((c, idx) => (<div key={idx} className="flex gap-4 items-start">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${c.icon === 'license'
                    ? 'bg-green-50'
                    : c.icon === 'edu'
                        ? 'bg-purple-50'
                        : 'bg-emerald-50'}`}>
                        {c.icon === 'license' && <CheckCircle2 className="w-5 h-5 text-green-600"/>}
                        {c.icon === 'edu' && <GraduationCap className="w-5 h-5 text-purple-600"/>}
                        {c.icon === 'states' && <MapPin className="w-5 h-5 text-emerald-600"/>}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{c.title}</h4>
                        <p className="text-sm text-gray-500">{c.subtitle}</p>
                      </div>
                    </div>))}
                </div>
              </Section>)}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <Card className="border-0 shadow-xl ring-1 ring-black/5 overflow-hidden">
                <div className="bg-gradient-to-br from-indigo-600 to-blue-600 p-6 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      {showRatePublicly && rate > 0 ? (<>
                          <p className="text-indigo-100 text-sm font-medium mb-1">Session Rate</p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold">${rate}</span>
                            <span className="text-indigo-100">/ session</span>
                          </div>
                        </>) : (<>
                          <p className="text-indigo-100 text-sm font-medium mb-1">Session Pricing</p>
                          <div className="text-sm font-semibold text-white/95">
                            Shared privately after your first message.
                          </div>
                        </>)}
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                      <Clock className="w-6 h-6 text-white"/>
                    </div>
                  </div>
                </div>

                <CardContent className="p-6 space-y-6">
                  <div className="space-y-3">
                    <RowKV label="Duration" value={`${sessionDuration} minutes`}/>
                    <Separator />
                    <RowKV label="Format" value="Secure video call"/>
                    <Separator />
                    <RowKV label="Scheduling" value={allowSelfBooking ? 'Self-book available times' : 'Message to coordinate'}/>
                  </div>

                  <div className="space-y-3 pt-2">
                    {bookingEnabled ? (<BookingEntrypoint seekerId={user.id} therapistId={therapistId} therapistName={displayName || 'Therapist'} therapistImage={profileImageUrl} rate={rate} sessionDuration={sessionDuration} initialBookingEnabled={bookingEnabled} initialBookingDisabledReason={bookingDisabledReason} defaultOpen={shouldAutoOpenBooking}/>) : (<Button asChild size="lg" className="w-full bg-indigo-600 hover:bg-indigo-700">
                        <Link href={`/chat?with=${therapistId}`}>
                          <MessageSquare className="w-4 h-4 mr-2"/>
                          Message to Schedule
                        </Link>
                      </Button>)}

                    {bookingEnabled ? (<Button asChild variant="outline" size="lg" className="w-full border-2 border-gray-200 hover:bg-gray-50 hover:text-indigo-600 transition-colors">
                        <Link href={`/chat?with=${therapistId}`}>
                          <MessageSquare className="w-4 h-4 mr-2"/>
                          Send a Message First
                        </Link>
                      </Button>) : (bookingDisabledReason && (<div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                          <p className="font-medium">Why booking is closed</p>
                          <p className="text-amber-800 mt-1">{bookingDisabledReason}</p>
                        </div>))}

                    {acceptedRequest ? <RemoveTherapistButton therapistId={therapistId}/> : null}
                  </div>

                  <p className="text-xs text-center text-gray-500">
                    Free cancellation up to 24h before your session.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md ring-1 ring-black/5 bg-white">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600"/>
                    How we keep you safe
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0"/>
                      Every clinician is license-verified before listing.
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0"/>
                      Sessions and messages are encrypted and HIPAA-handled.
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0"/>
                      You are only charged after a session completes.
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>);
}
function Pill({ icon, text }) {
    return (<div className="flex items-center gap-1.5 text-sm text-gray-700 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
      {icon}
      <span className="font-medium">{text}</span>
    </div>);
}
function Section({ icon, title, children, }) {
    return (<div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        {icon}
        {title}
      </h2>
      <Card className="border-0 shadow-sm ring-1 ring-gray-100">
        <CardContent className="p-6">{children}</CardContent>
      </Card>
    </div>);
}
function RowKV({ label, value }) {
    return (<div className="flex justify-between text-sm">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium text-gray-900 text-right">{value}</span>
    </div>);
}
