import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Stethoscope, HeartHandshake, ArrowRight } from 'lucide-react';
import { createClient } from '@/components/9a6b39502e62';
import { getPostAuthRedirectPath } from '@/components/b85c08c50439';
import { Button } from '@/components/2795b661f080';
export default async function LandingPage() {
    const supabase = await createClient();
    const { data: { user }, } = await supabase.auth.getUser();
    // Authenticated visitors never see the chooser — send them straight to
    // their canonical destination.
    if (user) {
        const [{ data: roleRow }, { data: profileRow }] = await Promise.all([
            supabase
                .from('user_roles')
                .select('role, status')
                .eq('id', user.id)
                .maybeSingle(),
            supabase
                .from('user_profiles')
                .select('onboarding_completed, license_number, licensed_states, specialties, rate')
                .eq('user_id', user.id)
                .maybeSingle(),
        ]);
        redirect(getPostAuthRedirectPath(roleRow, profileRow));
    }
    return (<div className="relative min-h-screen overflow-hidden bg-[#FAFAF9] px-4 py-12 sm:py-20 lg:py-24">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-[10%] top-0 h-[600px] w-[600px] rounded-full bg-stone-200/40 blur-[120px] mix-blend-multiply"/>
        <div className="absolute -right-[10%] bottom-0 h-[600px] w-[600px] rounded-full bg-blue-100/40 blur-[120px] mix-blend-multiply"/>
        <div className="absolute left-[20%] top-[30%] h-[400px] w-[400px] rounded-full bg-green-50/60 blur-[100px] mix-blend-multiply"/>
      </div>

      <div className="relative mx-auto flex w-full max-w-5xl items-center justify-center">
        <div className="w-full overflow-hidden rounded-[2.5rem] border border-white/50 bg-white/60 p-8 shadow-2xl shadow-stone-200/50 backdrop-blur-xl sm:p-12 lg:p-16">
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-stone-100/80 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-stone-600 shadow-sm backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-green-500"/>
              Welcome to Psychlink
            </div>

            <h1 className="mt-8 text-4xl font-bold tracking-tight text-stone-800 sm:text-5xl lg:text-6xl">
              Find your path to{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">
                healing
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-stone-600">
              We&apos;re here to support you on your journey. Select the option that best describes
              you to get started.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:gap-8">
            {/* Therapist card */}
            <div className="group relative overflow-hidden rounded-3xl border border-green-200 bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:border-green-300 hover:shadow-xl hover:shadow-green-200/40">
              <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"/>

              <div className="relative z-10">
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-600 ring-1 ring-green-100 transition-colors group-hover:bg-green-500 group-hover:text-white group-hover:ring-green-500">
                  <Stethoscope className="h-7 w-7" aria-hidden="true"/>
                </div>

                <h2 className="text-2xl font-bold text-stone-800">I am a therapist</h2>
                <p className="mt-3 text-base leading-relaxed text-stone-600">
                  Join our community of care professionals. Manage your practice, connect with
                  clients, and focus on care.
                </p>

                <ul className="mt-6 space-y-3 text-sm font-medium text-stone-600">
                  <li className="flex items-center gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-400"/>
                    Connect with clients seeking care
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-400"/>
                    Manage sessions and notes
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-400"/>
                    Grow your practice
                  </li>
                </ul>

                <Button asChild className="mt-8 w-full rounded-xl bg-green-600 py-6 text-base font-semibold text-white shadow-lg transition-all hover:bg-green-700 hover:shadow-xl hover:shadow-green-600/20">
                  <Link href="/therapists" className="flex items-center justify-center gap-2">
                    View Therapist Space
                    <ArrowRight className="h-4 w-4"/>
                  </Link>
                </Button>
              </div>
            </div>

            {/* Seeker card */}
            <div className="group relative overflow-hidden rounded-3xl border border-blue-100 bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/40">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"/>

              <div className="relative z-10">
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100 transition-colors group-hover:bg-blue-500 group-hover:text-white group-hover:ring-blue-500">
                  <HeartHandshake className="h-7 w-7" aria-hidden="true"/>
                </div>

                <h2 className="text-2xl font-bold text-stone-800">I need support</h2>
                <p className="mt-3 text-base leading-relaxed text-stone-600">
                  Begin your journey to wellness. Find the right therapist for you in a safe,
                  supportive environment.
                </p>

                <ul className="mt-6 space-y-3 text-sm font-medium text-stone-600">
                  <li className="flex items-center gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-400"/>
                    Browse compassionate therapists
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-400"/>
                    Book sessions easily
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-400"/>
                    Track your personal growth
                  </li>
                </ul>

                <Button asChild variant="outline" className="mt-8 w-full rounded-xl border-blue-200 bg-transparent py-6 text-base font-semibold text-blue-700 shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800 hover:shadow-md">
                  <Link href="/for-seekers" className="flex items-center justify-center gap-2">
                    Enter Client Space
                    <ArrowRight className="h-4 w-4"/>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>);
}
