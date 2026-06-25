import Link from 'next/link';
import { Button } from '@/components/2795b661f080';
import { Badge } from '@/components/30348591d689';
import { Card, CardContent, CardFooter } from '@/components/c0ebd3fbafc6';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/2318256b5648';
import { Clock, CheckCircle2, MapPin, MessageSquare } from 'lucide-react';
import { US_STATES } from '@/components/96fabadae962';
export default function TherapistCard({ therapist, publicView = false }) {
    const profile = (therapist.profile_json ?? {});
    const specialties = profile.specialties || [];
    const rate = Number(profile.rate ?? 0);
    const showRatePublicly = Boolean(therapist.show_rate_publicly);
    const bio = profile.bio ||
        'Experienced mental health professional dedicated to compassionate, evidence-based care.';
    const approach = profile.approach || '';
    const yearsExperience = Number(profile.years_experience ?? 0);
    const profileImageUrl = profile.profile_image_url || '';
    const licenseNumber = profile.license_number || '';
    const licensedStates = Array.isArray(profile.licensed_states)
        ? profile.licensed_states
        : [];
    const stateCode = licensedStates[0] || '';
    const stateName = US_STATES.find((s) => s.value === stateCode)?.label || stateCode;
    const initials = therapist.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'T';
    const profileHref = publicView
        ? `/login?mode=signup&?intent=connect&therapist=${therapist.id}`
        : `/seeker/therapists/${therapist.id}`;
    const messageHref = publicView
        ? `/login?mode=signup&?intent=message&therapist=${therapist.id}`
        : `/chat?with=${therapist.id}`;
    return (<Card className="flex flex-col h-full group hover:shadow-xl transition-all duration-300 border hover:border-blue-300 bg-white">
      <CardContent className="p-6 flex-1 flex flex-col">
        <div className="flex items-start gap-4 mb-4">
          <Avatar className="h-16 w-16 ring-2 ring-gray-100 group-hover:ring-blue-200 transition-all flex-shrink-0">
            {profileImageUrl ? (<AvatarImage src={profileImageUrl} alt={therapist.name}/>) : (<AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white text-lg font-bold">
                {initials}
              </AvatarFallback>)}
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">{therapist.name}</h3>
            <p className="text-xs text-gray-500 mb-2">Licensed Mental Health Professional</p>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600 mb-2">
              {yearsExperience > 0 && (<div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-600" aria-hidden="true"/>
                  <span>{yearsExperience}+ yrs</span>
                </div>)}
              {licenseNumber && (<div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" aria-hidden="true"/>
                  <span className="text-green-700 font-medium">Licensed</span>
                </div>)}
              {stateName && (<div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true"/>
                  <span>{licensedStates.length > 1 ? `${stateName} +${licensedStates.length - 1}` : stateName}</span>
                </div>)}
            </div>

            {showRatePublicly && rate > 0 ? (<div className="inline-flex items-baseline gap-0.5 bg-blue-50 px-2.5 py-1 rounded-md">
                <span className="text-xl font-bold text-blue-600">${rate}</span>
                <span className="text-xs text-blue-600 font-medium">/ session</span>
              </div>) : (<div className="inline-flex items-baseline gap-0.5 bg-slate-50 px-2.5 py-1 rounded-md">
                <span className="text-xs font-semibold text-slate-600">
                  Rate shared after first message
                </span>
              </div>)}
          </div>
        </div>

        {specialties.length > 0 && (<div className="mb-3">
            <div className="flex flex-wrap gap-1.5">
              {specialties.slice(0, 3).map((specialty) => (<Badge key={specialty} variant="secondary" className="text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-100">
                  {specialty}
                </Badge>))}
              {specialties.length > 3 && (<Badge variant="outline" className="text-xs font-medium border">
                  +{specialties.length - 3}
                </Badge>)}
            </div>
          </div>)}

        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mb-1 flex-1">{bio}</p>
        {approach && (<p className="text-xs text-gray-500 italic line-clamp-1 mt-1">Approach: {approach}</p>)}
      </CardContent>

      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button asChild size="sm" variant="outline" className="flex-1">
          <Link href={profileHref}>View Profile</Link>
        </Button>
        <Button asChild size="sm" className="flex-1 bg-indigo-600 hover:bg-indigo-700">
          <Link href={messageHref}>
            <MessageSquare className="w-3.5 h-3.5 mr-1.5"/>
            Message
          </Link>
        </Button>
      </CardFooter>
    </Card>);
}
