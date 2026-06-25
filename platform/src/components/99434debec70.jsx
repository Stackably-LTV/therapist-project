import { Suspense } from 'react';
import { createClient } from '@/components/9a6b39502e62';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/2795b661f080';
import { Card, CardContent } from '@/components/c0ebd3fbafc6';
import { Badge } from '@/components/30348591d689';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/2318256b5648';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/93bde5168d2a';
import { Calendar, Clock, Video, FileText, ArrowRight, User } from 'lucide-react';
import { Separator } from '@/components/19cc3f2900f4';
import { CheckoutStatusHandler } from '@/components/70874a17c466';
import { LocalDateCard, LocalTimeRange } from '@/components/0ccac75fc96c';
export default async function ClientBookingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }
    // Fetch all bookings (therapist details fetched separately)
    const { data: rawBookings, error: bookingsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('seeker_id', user.id)
        .order('scheduled_at', { ascending: false });
    const bookingTherapistIds = Array.from(new Set((rawBookings ?? []).map((b) => b.therapist_id).filter(Boolean)));
    const { data: bookingTherapistProfiles } = bookingTherapistIds.length
        ? await supabase
            .from('user_profiles')
            .select('user_id, full_name, profile_image_url')
            .in('user_id', bookingTherapistIds)
        : { data: [] };
    const therapistMap = new Map();
    bookingTherapistProfiles?.forEach((p) => therapistMap.set(p.user_id, { full_name: p.full_name, profile_image_url: p.profile_image_url }));
    const bookings = (rawBookings ?? []).map((b) => {
        const tp = therapistMap.get(b.therapist_id);
        return {
            ...b,
            therapist: {
                name: tp?.full_name ?? '',
                email: '',
                profile_json: tp?.profile_image_url ? { profile_image_url: tp.profile_image_url } : {},
            },
        };
    });
    const upcomingBookings = bookings?.filter(b => b.status === 'pending_payment' || b.status === 'in_progress' || new Date(b.scheduled_at) > new Date()) || [];
    const pastBookings = bookings?.filter(b => new Date(b.scheduled_at) <= new Date()) || [];
    const BookingCard = ({ booking, isPast }) => {
        const therapist = booking.therapist;
        const profileData = therapist?.profile_json || {};
        const sessionData = booking.session_data_json || {};
        const checkoutUrl = typeof sessionData.stripe_checkout_url === 'string' ? sessionData.stripe_checkout_url : null;
        const profilePic = profileData.profile_image_url;
        const initials = therapist?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
        return (<Card className="group hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Date Column */}
            <LocalDateCard dateStr={booking.scheduled_at} className="flex-shrink-0 flex flex-col items-center justify-center bg-blue-50 rounded-xl p-4 min-w-[100px] text-center"/>

            {/* Main Content */}
            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 ring-2 ring-purple-100">
                    {profilePic && <AvatarImage src={profilePic} alt={therapist?.name}/>}
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{therapist?.name}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <User className="w-3 h-3"/>
                      Psychotherapy Session
                    </p>
                  </div>
                </div>
                <Badge className={`capitalize ${booking.status === 'pending_payment' ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' :
                booking.status === 'scheduled' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                    booking.status === 'completed' ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' :
                        booking.status === 'cancelled' ? 'bg-red-100 text-red-800 hover:bg-red-200' :
                            'bg-blue-100 text-blue-800 hover:bg-blue-200'}`} variant="secondary">
                  {booking.status === 'pending_payment' ? 'Payment Processing' : booking.status.replace('_', ' ')}
                </Badge>
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4 text-blue-500"/>
                  <LocalTimeRange dateStr={booking.scheduled_at} durationMinutes={booking.duration_minutes}/>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Video className="w-4 h-4 text-purple-500"/>
                  Online Video Call
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4 text-orange-500"/>
                  {booking.duration_minutes} Minutes
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                {!isPast && booking.status === 'pending_payment' && checkoutUrl && (<Link href={checkoutUrl}>
                    <Button size="sm" className="bg-amber-600 text-white hover:bg-amber-700">
                      Pay with Stripe
                    </Button>
                  </Link>)}
                {!isPast && (booking.status === 'scheduled' || booking.status === 'in_progress') && (<>
                    {booking.status === 'scheduled' && (<Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" disabled title="Cancellation from this page is coming soon. Use session details for now.">
                        Cancel (Soon)
                      </Button>)}
                    <Link href={`/seeker/sessions/${booking.id}`}>
                      <Button size="sm" className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700">
                        <Video className="w-4 h-4 mr-2"/>
                        {booking.status === 'in_progress' ? 'Join Live Session' : 'Join Session'}
                      </Button>
                    </Link>
                  </>)}
                {isPast && booking.status === 'completed' && (<Button variant="outline" size="sm">
                    <FileText className="w-4 h-4 mr-2"/>
                    View Summary
                  </Button>)}
                {isPast && (<Link href={`/seeker/therapists/${booking.therapist_id}`}>
                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                      Book Again <ArrowRight className="w-4 h-4 ml-1"/>
                    </Button>
                  </Link>)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>);
    };
    return (<div className="space-y-8 max-w-5xl mx-auto">
      <Suspense fallback={null}>
        <CheckoutStatusHandler />
      </Suspense>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600 mt-1">
            Manage your upcoming sessions and view past history
          </p>
        </div>
        <Link href="/seeker/therapists">
          <Button size="lg" className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg">
            <Calendar className="w-5 h-5 mr-2"/>
            Book New Session
          </Button>
        </Link>
      </div>

      {bookingsError && (<Card className="border-red-200 bg-red-50">
          <CardContent className="py-5">
            <p className="text-sm font-semibold text-red-900">We could not load your bookings.</p>
            <p className="mt-1 text-sm text-red-700">Please refresh and try again.</p>
            <Button asChild variant="outline" className="mt-3 border-red-200 bg-white text-red-700 hover:bg-red-100">
              <Link href="/seeker/bookings">Retry</Link>
            </Button>
          </CardContent>
        </Card>)}

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-6">
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingBookings.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-6">
          {upcomingBookings.length === 0 ? (<Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <Calendar className="w-10 h-10 text-blue-500"/>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No upcoming sessions</h3>
                <p className="text-gray-500 max-w-sm mb-6">
                  You don't have any sessions scheduled. Ready to start your journey?
                </p>
                <Link href="/seeker/therapists">
                  <Button>Find a Therapist</Button>
                </Link>
              </CardContent>
            </Card>) : (upcomingBookings.map((booking) => (<BookingCard key={booking.id} booking={booking}/>)))}
        </TabsContent>

        <TabsContent value="past" className="space-y-6">
          {pastBookings.length === 0 ? (<Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Clock className="w-10 h-10 text-gray-400"/>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No past sessions</h3>
                <p className="text-gray-500">
                  Your completed sessions will appear here.
                </p>
                <Link href="/seeker/therapists" className="mt-6">
                  <Button variant="outline">Book Your First Session</Button>
                </Link>
              </CardContent>
            </Card>) : (pastBookings.map((booking) => (<BookingCard key={booking.id} booking={booking} isPast/>)))}
        </TabsContent>
      </Tabs>
    </div>);
}
