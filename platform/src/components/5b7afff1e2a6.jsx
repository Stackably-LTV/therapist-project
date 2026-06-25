import Link from "next/link";
import { LandingContainer } from "@/components/ed29acce9eae";
export function FinalCta() {
    return (<section className="py-16 bg-gray-900 text-white">
      <LandingContainer>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Join thousands of individuals who have found support through our platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login?mode=signup&">
              <button className="inline-flex items-center justify-center px-8 py-3 h-12 text-base font-semibold bg-white text-gray-900 hover:bg-gray-100 rounded-md transition-all">
                Get Started Today
              </button>
            </Link>
            <Link href="/marketplace">
              <button className="inline-flex items-center justify-center px-8 py-3 h-12 text-base font-semibold border-2 border-white bg-transparent text-white hover:bg-white hover:text-gray-900 rounded-md transition-all">
                Browse Therapists
              </button>
            </Link>
          </div>
        </div>
      </LandingContainer>
    </section>);
}
