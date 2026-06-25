import { CommunityGroupsFacebook } from '@/components/398dd2998dbf';
export default function TherapistCommunityPage() {
    return (<div className="relative min-h-[calc(100vh-4rem)] w-full bg-slate-50/50 dark:bg-black/5">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"/>

      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Community</h1>
            <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
              Connect with fellow therapists, join groups, and share resources in a private, professional space.
            </p>
          </div>
        </div>

        <CommunityGroupsFacebook />
      </div>
    </div>);
}
