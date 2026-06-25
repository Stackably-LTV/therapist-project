import Link from 'next/link';
import Image from 'next/image';
import { LandingContainer } from "@/components/ed29acce9eae";
import { SITE_LOGO_PATH } from "@/components/171b48435a24";
export function LandingFooter() {
    return (<footer className="bg-gray-900 text-gray-300 py-12" suppressHydrationWarning>
      <LandingContainer>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          <div className="text-left">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <Image src={SITE_LOGO_PATH} alt="Logo" width={36} height={36} className="object-contain"/>
              <span className="text-white text-xl font-bold">Psychlink.pro</span>
            </Link>
            <p className="text-sm leading-relaxed text-gray-400">
              Your trusted platform for online therapy and mental health support.
            </p>
          </div>
          
          {/* For Clients */}
          <div className="text-left">
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">For Clients</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/marketplace" className="hover:text-white transition-colors">Find Clinicians</Link></li>
              <li><Link href="/login?mode=signup&" className="hover:text-white transition-colors">Sign Up</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Login</Link></li>
            </ul>
          </div>
          
          {/* For Therapists */}
          <div className="text-left">
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">For Therapists</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/login" className="hover:text-white transition-colors">Join Platform</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Therapist Login</Link></li>
              <li><Link href="/therapists" className="hover:text-white transition-colors">For Therapists</Link></li>
            </ul>
          </div>
          
          {/* Support */}
          <div className="text-left">
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Support</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="mailto:support@psychlink.pro" className="hover:text-white transition-colors">Contact Us</a></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-8 text-sm text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
          <p>&copy; {new Date().getFullYear()} Psychlink.pro. All rights reserved.</p>
          <p className="text-xs text-gray-500">HIPAA Compliant | Secure & Confidential</p>
        </div>
      </LandingContainer>
    </footer>);
}
