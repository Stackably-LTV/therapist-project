"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ba221113eac7";
import { Button } from "@/components/2795b661f080";
import { Badge } from "@/components/30348591d689";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/2318256b5648";
import { Calendar, Clock, DollarSign, Heart, Sparkles, ArrowRight, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/components/e7335a071b71";
export function BookingMatchDialog({ therapist, open, onOpenChange }) {
    const router = useRouter();
    const [isBooking, setIsBooking] = useState(false);
    if (!therapist)
        return null;
    const profile = therapist.profile_json;
    const specialties = profile?.specialties || [];
    const rate = profile?.rate || 0;
    const yearsExperience = profile?.years_experience || 0;
    const profileImageUrl = profile?.profile_image_url || '';
    const initials = therapist.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    const targetPath = `/seeker/therapists/${therapist.id}?book=1`;
    const navigateToDashboardTherapist = async () => {
        setIsBooking(true);
        try {
            const supabase = createClient();
            const { data: auth } = await supabase.auth.getUser();
            // Not logged in → go to signup and come back
            if (!auth?.user) {
                onOpenChange(false);
                router.push(`/login?mode=signup&?redirect=${encodeURIComponent(targetPath)}`);
                return;
            }
            const { data: profile } = await supabase
                .from("user_roles")
                .select("role")
                .eq("id", auth.user.id)
                .maybeSingle();
            // Logged in but no role row → send to /login?mode=signup& to pick one
            if (!profile?.role) {
                onOpenChange(false);
                router.push(`/login?mode=signup&?redirect=${encodeURIComponent(targetPath)}`);
                return;
            }
            if (profile.role !== "seeker" && profile.role !== "admin") {
                onOpenChange(false);
                router.push(`/${profile.role}`);
                return;
            }
            onOpenChange(false);
            router.push(targetPath);
        }
        finally {
            // If navigation fails for some reason, ensure the button isn't stuck.
            setIsBooking(false);
        }
    };
    return (<Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
              <Heart className="w-12 h-12 text-white fill-white"/>
            </div>
            <div className="absolute -top-2 -right-2">
              <Sparkles className="w-8 h-8 text-yellow-400 fill-yellow-400"/>
            </div>
          </div>
        </div>

        <DialogHeader className="mt-16">
          <DialogTitle className="text-center text-2xl">It's a Match!</DialogTitle>
          <DialogDescription className="text-center text-base">
            You've connected with a great therapist. Ready to start your journey?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
            <Avatar className="h-20 w-20 ring-4 ring-white shadow-lg">
              {profileImageUrl ? (<AvatarImage src={profileImageUrl} alt={therapist.name}/>) : (<AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white text-2xl font-bold">
                  {initials}
                </AvatarFallback>)}
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900">{therapist.name}</h3>
              {yearsExperience > 0 && (<div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                  <Clock className="w-4 h-4"/>
                  <span>{yearsExperience}+ years experience</span>
                </div>)}
              {rate > 0 && (<div className="flex items-center gap-2 text-sm font-semibold text-blue-600 mt-1">
                  <DollarSign className="w-4 h-4"/>
                  <span>${rate}/hour</span>
                </div>)}
            </div>
          </div>

          {specialties.length > 0 && (<div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Specialties</p>
              <div className="flex flex-wrap gap-2">
                {specialties.slice(0, 4).map((specialty, idx) => (<Badge key={specialty} className={`${idx === 0 ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' :
                    idx === 1 ? 'bg-purple-100 text-purple-700 hover:bg-purple-100' :
                        idx === 2 ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' :
                            'bg-orange-100 text-orange-700 hover:bg-orange-100'}`}>
                    {specialty}
                  </Badge>))}
              </div>
            </div>)}

          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5"/>
              <span className="font-semibold">Next Steps</span>
            </div>
            <p className="text-sm text-white/90">
              Create an account to book your first session and start your mental health journey with {therapist.name.split(' ')[0]}.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button onClick={navigateToDashboardTherapist} disabled={isBooking} className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold text-base shadow-lg">
            {isBooking ? (<>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"/>
                Redirecting...
              </>) : (<>
                <Calendar className="w-5 h-5 mr-2"/>
                Book Your First Session
                <ArrowRight className="w-5 h-5 ml-2"/>
              </>)}
          </Button>
          <Button onClick={navigateToDashboardTherapist} variant="outline" className="w-full h-12 border-2 font-semibold">
            <User className="w-5 h-5 mr-2"/>
            View Full Profile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);
}
