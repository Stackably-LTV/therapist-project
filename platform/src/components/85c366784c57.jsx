import { Hero } from '@/components/da7c2f115a49';
import { HelpingBalance } from '@/components/19ba55d52f81';
import { WhyPsycheconnect } from '@/components/b6aa1180365b';
import { Stats } from '@/components/fc34abe91e66';
import { HowItWorks } from '@/components/69b5c5b475b5';
import { Testimonials } from '@/components/2602ab1468a3';
import { TrustIndicators } from '@/components/ec24574cd91c';
import { FAQ } from '@/components/91a66708f281';
import { FinalCta } from '@/components/5b7afff1e2a6';
export const metadata = {
    title: 'For Seekers | Psychlink',
    description: 'Find a licensed therapist, book sessions, and track your wellbeing journey on Psychlink.',
};
export default function ForSeekersPage() {
    return (<div className="min-h-screen">
      <Hero />
      <HelpingBalance />
      <WhyPsycheconnect />
      <Stats />
      <HowItWorks />
      <Testimonials />
      <TrustIndicators />
      <FAQ />
      <FinalCta />
    </div>);
}
