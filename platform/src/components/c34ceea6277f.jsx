import { listPublicTherapists } from '@/components/0a3968f8c351';
import TherapistCard from '@/components/2faeb905717d';
import { Search, Filter, ShieldCheck, Heart } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/c2f62fb0cb5e';
import { Button } from '@/components/2795b661f080';
import { US_STATES } from '@/components/96fabadae962';
export const metadata = {
    title: 'Browse Therapists | Psychlink',
    description: 'Browse licensed mental health professionals. Filter by specialty, state, and approach. Find the right therapist for you.',
};
export default async function PublicTherapistBrowsePage({ searchParams, }) {
    const params = await searchParams;
    const rows = await listPublicTherapists();
    let therapists = rows.map((p) => ({
        id: p.id,
        name: p.full_name,
        show_rate_publicly: p.show_rate_publicly,
        profile_json: {
            bio: p.bio,
            profile_image_url: p.profile_image_url,
            specialties: p.specialties,
            rate: p.rate,
            license_number: p.license_number,
            licensed_states: p.licensed_states,
            years_experience: p.years_experience,
            approach: p.approach,
        },
    }));
    if (params.search) {
        const q = params.search.toLowerCase();
        therapists = therapists.filter((t) => {
            const name = t.name.toLowerCase();
            const p = (t.profile_json ?? {});
            const bio = (p.bio || '').toLowerCase();
            const approach = (p.approach || '').toLowerCase();
            const specs = (p.specialties || []).join(' ').toLowerCase();
            return name.includes(q) || bio.includes(q) || approach.includes(q) || specs.includes(q);
        });
    }
    if (params.specialty) {
        therapists = therapists.filter((t) => {
            const p = (t.profile_json ?? {});
            return (p.specialties || []).includes(params.specialty);
        });
    }
    if (params.state) {
        therapists = therapists.filter((t) => {
            const p = (t.profile_json ?? {});
            const s = Array.isArray(p.licensed_states) ? p.licensed_states : [];
            return s.includes(params.state);
        });
    }
    const allSpecialties = new Set();
    rows.forEach((p) => {
        (p.specialties ?? []).forEach((s) => allSpecialties.add(s));
    });
    return (<div className="bg-gray-50/60 min-h-screen pb-16">
      <section className="bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium mb-4">
              <ShieldCheck className="w-4 h-4"/>
              Every clinician is license-verified
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Find a therapist who fits your life
            </h1>
            <p className="text-lg text-blue-100 max-w-2xl">
              Browse licensed mental health professionals by specialty, state, and approach. Reach
              out for free; create your free account to message or book.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-white text-indigo-700 hover:bg-blue-50">
                <Link href="/login?mode=signup&">Create free account</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 hover:text-white">
                <Link href="/marketplace">
                  <Heart className="w-4 h-4 mr-2"/>
                  Try the swipe view
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10 space-y-8">
        <div className="bg-white rounded-xl shadow-md ring-1 ring-black/5 p-6">
          <form method="GET" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"/>
                  <Input type="text" id="search" name="search" defaultValue={params.search} placeholder="Name, specialty, approach..." className="pl-9 h-10"/>
                </div>
              </div>
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <select id="state" name="state" defaultValue={params.state || ''} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="">All States</option>
                  {US_STATES.map((s) => (<option key={s.value} value={s.value}>
                      {s.label}
                    </option>))}
                </select>
              </div>
              <div>
                <label htmlFor="specialty" className="block text-sm font-medium text-gray-700 mb-2">
                  Specialty
                </label>
                <select id="specialty" name="specialty" defaultValue={params.specialty || ''} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="">All Specialties</option>
                  {Array.from(allSpecialties)
            .sort()
            .map((s) => (<option key={s} value={s}>
                        {s}
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
                <Link href="/marketplace/browse">Clear All</Link>
              </Button>
            </div>
          </form>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-gray-600">
            <span className="font-semibold text-gray-900">{therapists.length}</span> therapist
            {therapists.length !== 1 ? 's' : ''} listed
          </p>
        </div>

        {therapists.length === 0 ? (<div className="text-center py-20 bg-white rounded-xl border border-gray-200 border-dashed">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400"/>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No therapists found</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Try adjusting your search filters to find more results.
            </p>
            <Button asChild variant="outline">
              <Link href="/marketplace/browse">Clear Filters</Link>
            </Button>
          </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {therapists.map((t) => (<TherapistCard key={t.id} therapist={t} publicView/>))}
          </div>)}
      </div>
    </div>);
}
