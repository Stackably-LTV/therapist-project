import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CalendarCheck, ClipboardList, ShieldCheck, Sparkles, Stethoscope, Users, CheckCircle2, Quote } from "lucide-react";
import { Button } from "@/components/2795b661f080";
import { LandingContainer } from "@/components/ed29acce9eae";
const highlights = [
    {
        title: "Qualified Referrals",
        description: "Connect with clients who are actively seeking care and match your specific expertise.",
        icon: Users,
        color: "bg-blue-50 text-blue-600",
    },
    {
        title: "Secure Workflow",
        description: "HIPAA-compliant messaging, notes, and documentation in one secure dashboard.",
        icon: ShieldCheck,
        color: "bg-green-50 text-green-600",
    },
    {
        title: "Practice Growth",
        description: "Showcase your specialization and availability to build a thriving, sustainable practice.",
        icon: BriefcaseBusiness,
        color: "bg-emerald-50 text-emerald-600",
    },
];
const processSteps = [
    {
        title: "Create Profile",
        description: "Share your credentials, modalities, and approach to care.",
        icon: ClipboardList,
    },
    {
        title: "Verification",
        description: "We review your details to ensure the highest quality of care.",
        icon: CalendarCheck,
    },
    {
        title: "Start Connecting",
        description: "Receive referrals and manage your sessions effortlessly.",
        icon: Stethoscope,
    },
];
const stats = [
    { label: "Active Therapists", value: "2,000+" },
    { label: "Client Matches", value: "15k+" },
    { label: "Hours Saved/Wk", value: "5+" },
];
export default function TherapistsLandingPage() {
    return (<div className="bg-[#FAFAF9] font-sans text-stone-900 selection:bg-green-100 selection:text-green-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-20 lg:pt-32 lg:pb-28">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-green-100/50 blur-3xl mix-blend-multiply"/>
          <div className="absolute top-1/2 -left-24 h-72 w-72 rounded-full bg-stone-200/50 blur-3xl mix-blend-multiply"/>
        </div>
        
        <LandingContainer>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-medium text-stone-600 shadow-sm ring-1 ring-stone-200/50 mb-8">
                <Sparkles className="h-4 w-4 text-green-500"/>
                <span>Reimagining private practice</span>
              </div>
              
              <h1 className="text-5xl font-bold tracking-tight text-stone-900 sm:text-6xl lg:text-7xl lg:leading-[1.1]">
                Focus on care, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">we'll handle the rest</span>
              </h1>
              
              <p className="mt-8 text-lg leading-relaxed text-stone-600 sm:text-xl">
                Join a community designed for modern therapists. Get matched with more clients while we streamline referrals, scheduling, and admin — so you can focus on care.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Button size="lg" className="h-14 rounded-2xl bg-stone-900 px-8 text-base font-semibold text-white shadow-xl shadow-stone-900/10 transition-all hover:bg-stone-800 hover:shadow-2xl hover:shadow-stone-900/20 hover:-translate-y-0.5">
                  <Link href="/login?mode=signup&" className="flex items-center gap-2">
                    Join as a Therapist
                    <ArrowRight className="h-4 w-4"/>
                  </Link>
                </Button>
              </div>

              <div className="mt-12 flex items-center gap-8 border-t border-stone-200/60 pt-8">
                {stats.map((stat) => (<div key={stat.label}>
                    <p className="text-2xl font-bold text-stone-900">{stat.value}</p>
                    <p className="text-sm font-medium text-stone-500">{stat.label}</p>
                  </div>))}
              </div>
            </div>

            <div className="relative lg:h-[600px] w-full hidden lg:block">
               {/* Abstract Visual Representation of "Balance" */}
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative h-[500px] w-[400px]">
                    <div className="absolute top-0 right-0 h-64 w-64 rounded-[2rem] bg-white p-6 shadow-2xl shadow-stone-200/50 rotate-3 z-20 border border-stone-100">
                        <div className="h-full w-full rounded-xl bg-stone-50 p-4 flex flex-col gap-3">
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-2">
                                <Users className="h-4 w-4"/>
                            </div>
                            <div className="h-2 w-24 rounded-full bg-stone-200"/>
                            <div className="h-2 w-16 rounded-full bg-stone-200"/>
                            <div className="mt-auto flex gap-2">
                                <div className="h-8 w-full rounded-lg bg-white border border-stone-100"/>
                                <div className="h-8 w-full rounded-lg bg-stone-900"/>
                            </div>
                        </div>
                    </div>
                    <div className="absolute bottom-10 left-0 h-72 w-64 rounded-[2rem] bg-white p-6 shadow-2xl shadow-stone-200/50 -rotate-2 z-10 border border-stone-100">
                         <div className="h-full w-full rounded-xl bg-stone-50 p-4 flex flex-col gap-3">
                            <div className="flex items-center justify-between mb-2">
                                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                    <ShieldCheck className="h-4 w-4"/>
                                </div>
                                <div className="h-6 w-12 rounded-full bg-green-100/50"/>
                            </div>
                            <div className="space-y-2">
                                <div className="h-12 w-full rounded-lg bg-white border border-stone-100"/>
                                <div className="h-12 w-full rounded-lg bg-white border border-stone-100"/>
                                <div className="h-12 w-full rounded-lg bg-white border border-stone-100"/>
                            </div>
                        </div>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </LandingContainer>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-white rounded-t-[3rem] shadow-[0_-20px_40px_-20px_rgba(0,0,0,0.05)] relative z-20">
        <LandingContainer>
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
              Everything you need to thrive
            </h2>
            <p className="mt-4 text-lg text-stone-600">
              We've built a platform that handles the complexities of private practice, so you can focus on what you do best.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {highlights.map((item) => (<div key={item.title} className="group relative rounded-3xl border border-stone-100 bg-stone-50/50 p-8 transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-stone-200/40">
                <div className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${item.color} bg-opacity-20`}>
                  <item.icon className="h-7 w-7"/>
                </div>
                <h3 className="text-xl font-bold text-stone-900">{item.title}</h3>
                <p className="mt-3 text-base leading-relaxed text-stone-600">
                  {item.description}
                </p>
              </div>))}
          </div>
        </LandingContainer>
      </section>

      {/* How it Works / Steps */}
      <section className="py-24 bg-stone-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay"/>
        <LandingContainer>
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
                Simple onboarding, <br />
                <span className="text-stone-400">meaningful outcomes</span>
              </h2>
              <p className="text-lg text-stone-300 mb-8 max-w-md">
                Getting started is straightforward. We'll guide you through every step of setting up your digital practice.
              </p>
              
              <div className="space-y-4">
                {[
            "Verified client matches",
            "Automated scheduling",
            "Secure documentation",
            "Guaranteed payment processing"
        ].map((feature) => (<div key={feature} className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500"/>
                        <span className="text-stone-200">{feature}</span>
                    </div>))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-stone-800"/>
              <div className="space-y-12">
                {processSteps.map((step, index) => (<div key={step.title} className="relative flex items-start gap-6">
                    <div className="relative z-10 flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-stone-800 border border-stone-700 shadow-lg">
                      <step.icon className="h-7 w-7 text-green-500"/>
                    </div>
                    <div className="pt-2">
                      <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                      <p className="text-stone-400 leading-relaxed">{step.description}</p>
                    </div>
                  </div>))}
              </div>
            </div>
          </div>
        </LandingContainer>
      </section>

      {/* Testimonial / Social Proof */}
      <section className="py-24 bg-[#FAFAF9]">
        <LandingContainer>
            <div className="mx-auto max-w-4xl text-center">
                <Quote className="h-12 w-12 text-green-200 mx-auto mb-8"/>
                <blockquote className="text-2xl font-medium leading-relaxed text-stone-900 sm:text-3xl">
                    "This platform has completely transformed how I manage my practice. The quality of referrals is outstanding, and the tools are intuitive and helpful."
                </blockquote>
                <div className="mt-8 flex items-center justify-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-stone-200"/>
                    <div className="text-left">
                        <div className="font-bold text-stone-900">Dr. Sarah Chen</div>
                        <div className="text-sm text-stone-500">Clinical Psychologist</div>
                    </div>
                </div>
            </div>
        </LandingContainer>
      </section>

      {/* CTA */}
      <section className="py-24 bg-white border-t border-stone-100">
        <LandingContainer>
          <div className="rounded-[3rem] bg-stone-900 px-6 py-20 text-center shadow-2xl shadow-stone-900/20 sm:px-12 lg:px-20 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                 <div className="absolute -top-[50%] -left-[20%] w-[80%] h-[100%] bg-green-500/10 blur-[100px] rounded-full"/>
                 <div className="absolute -bottom-[50%] -right-[20%] w-[80%] h-[100%] bg-blue-500/10 blur-[100px] rounded-full"/>
             </div>
            
            <div className="relative z-10 mx-auto max-w-3xl">
              <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl mb-6">
                Ready to launch your practice?
              </h2>
              <p className="text-xl text-stone-300 mb-10">
                Join a network that values your expertise and supports your growth.
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Button size="lg" className="h-14 rounded-2xl bg-white px-8 text-base font-bold text-stone-900 hover:bg-stone-100">
                  <Link href="/login?mode=signup&">Start Onboarding</Link>
                </Button>
                <Button size="lg" variant="outline" className="h-14 rounded-2xl border-stone-700 bg-transparent px-8 text-base font-bold text-white hover:bg-stone-800 hover:text-white">
                  <Link href="/marketplace">View Marketplace</Link>
                </Button>
              </div>
            </div>
          </div>
        </LandingContainer>
      </section>
    </div>);
}
