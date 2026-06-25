import { createClient } from '@/components/9a6b39502e62';
import TherapistCard from '@/components/2faeb905717d';
import { Search, Filter } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/c2f62fb0cb5e';
import { Button } from '@/components/2795b661f080';
import { US_STATES } from '@/components/96fabadae962';
import { redirect } from 'next/navigation';
export default async function FindTherapistsPage({ searchParams, }) {
    const supabase = await createClient();
    const { data: { user }, } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }
    const { data: profile } = await supabase
        .from('user_roles')
        .select('role')
        .eq('id', user.id)
        .single();
    if (profile?.role !== 'seeker') {
        redirect(profile?.role ? `/${profile.role}` : '/login');
    }
    const params = await searchParams;
    // user_roles and user_profiles both FK to auth.users.id but aren't directly joined,
    // so the supabase embedded-join syntax doesn't work here. Fetch separately.
    const { data: roles, error } = await supabase
        .from('user_roles')
        .select('id')
        .eq('role', 'therapist')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
    const therapistIds = (roles ?? []).map((r) => r.id);
    const { data: profiles, error: profilesError } = therapistIds.length
        ? await supabase
            .from('user_profiles')
            .select('user_id, full_name, bio, profile_image_url, specialties, rate, license_number, licensed_states, show_rate_publicly')
            .in('user_id', therapistIds)
        : { data: [], error: null };
    const hasLoadError = Boolean(error || profilesError);
    const profileById = new Map();
    (profiles ?? []).forEach((p) => {
        if (p && typeof p.user_id === 'string')
            profileById.set(p.user_id, p);
    });
    const therapists = (roles ?? []).map((r) => {
        const p = profileById.get(r.id);
        return {
            id: r.id,
            name: p?.full_name ?? '',
            show_rate_publicly: p?.show_rate_publicly ?? null,
            profile_json: p
                ? {
                    bio: p.bio,
                    profile_image_url: p.profile_image_url,
                    specialties: p.specialties,
                    rate: p.rate,
                    license_number: p.license_number,
                    licensed_states: p.licensed_states,
                }
                : null,
        };
    });
    let filteredTherapists = therapists;
    if (params.search) {
        const searchTerm = params.search.toLowerCase();
        filteredTherapists = filteredTherapists.filter((t) => {
            const name = t.name?.toLowerCase() || '';
            const profileData = t.profile_json || {};
            const bio = (profileData.bio || '').toLowerCase();
            const specialties = profileData.specialties || [];
            const specialtiesText = specialties.join(' ').toLowerCase();
            return name.includes(searchTerm) || bio.includes(searchTerm) || specialtiesText.includes(searchTerm);
        });
    }
    if (params.specialty) {
        filteredTherapists = filteredTherapists.filter((t) => {
            const profileData = t.profile_json || {};
            const specialties = profileData.specialties || [];
            return specialties.includes(params.specialty);
        });
    }
    if (params.state) {
        filteredTherapists = filteredTherapists.filter((t) => {
            const profileData = t.profile_json || {};
            const licensedStates = Array.isArray(profileData.licensed_states)
                ? profileData.licensed_states
                : [];
            return licensedStates.includes(params.state);
        });
    }
    const allSpecialties = new Set();
    therapists.forEach((t) => {
        const profileData = t.profile_json || {};
        const specialties = profileData.specialties || [];
        specialties.forEach((s) => allSpecialties.add(s));
    });
    return (<div className="space-y-8">
      <div className="relative bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 rounded-2xl p-8 md:p-12 text-white shadow-lg overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"/>
        <div className="relative max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Find Your Perfect Therapist
          </h1>
          <p className="text-lg text-blue-100 opacity-90">
            Connect with licensed mental health professionals who understand your journey.
            Browse profiles, read reviews, and book your first session today.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form method="GET" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"/>
                <Input type="text" id="search" name="search" defaultValue={params.search} placeholder="Name, specialty..." className="pl-9 h-10"/>
              </div>
            </div>

            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                State
              </label>
              <select id="state" name="state" aria-label="Filter by state" defaultValue={params.state || ''} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                <option value="">All States</option>
                {US_STATES.map((state) => (<option key={state.value} value={state.value}>
                    {state.label}
                  </option>))}
              </select>
            </div>

            <div>
              <label htmlFor="specialty" className="block text-sm font-medium text-gray-700 mb-2">
                Specialty
              </label>
              <select id="specialty" name="specialty" aria-label="Filter by specialty" defaultValue={params.specialty || ''} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                <option value="">All Specialties</option>
                {Array.from(allSpecialties).sort().map((specialty) => (<option key={specialty} value={specialty}>
                    {specialty}
                  </option>))}
              </select>
            </div>

          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" className="gap-2 bg-indigo-600 hover:bg-indigo-700">
              <Filter className="w-4 h-4"/>
              Apply Filters
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/seeker/therapists">
                Clear All
              </Link>
            </Button>
          </div>
        </form>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          <span className="font-semibold text-gray-900">{filteredTherapists.length}</span> therapist{filteredTherapists.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {hasLoadError && (<div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">We could not load therapists right now.</p>
          <p className="mt-1">Please retry in a moment.</p>
          <Button asChild variant="outline" className="mt-3 border-red-200 bg-white text-red-700 hover:bg-red-100">
            <Link href="/seeker/therapists">Retry</Link>
          </Button>
        </div>)}

      {!filteredTherapists || filteredTherapists.length === 0 ? (<div className="text-center py-20 bg-white rounded-xl border border-gray-200 border-dashed">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400"/>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No therapists found
          </h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            {params.search || params.specialty || params.state
                ? 'Try adjusting your search filters to find more results.'
                : 'No therapists are currently available. Please check back soon!'}
          </p>
          {(params.search || params.specialty || params.state) && (<Button asChild variant="outline">
              <Link href="/seeker/therapists">
                Clear Filters
              </Link>
            </Button>)}
        </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTherapists.map((therapist) => (<TherapistCard key={therapist.id} therapist={therapist}/>))}
        </div>)}
    </div>);
}
