"use client";
import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";
import { Button } from "@/components/2795b661f080";
import { LandingContainer } from "@/components/ed29acce9eae";
export function Hero() {
    return (<section className="py-12 lg:py-24 bg-white overflow-hidden">
      <LandingContainer>
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20">
          
          {/* Text Content */}
          <div className="flex-1 w-full max-w-2xl text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
              Connect with Professionals
              <br className="hidden lg:block"/>
              <span className="text-primary block mt-2">Who Truly Listen</span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl lg:mx-0 mx-auto leading-relaxed">
              In person and secure telehealth sessions designed to meet clients where they are. Every interaction is private, supported and led by verified licensed clinicians.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/marketplace" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto px-8 py-6 text-lg font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <Search className="w-5 h-5"/>
                  <span>Find Support</span>
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 py-6 text-lg font-semibold border-2 hover:bg-gray-50 transition-colors">
                Learn More
              </Button>
            </div>
          </div>

          {/* Image Content */}
          <div className="flex-1 w-full relative flex justify-center lg:justify-end">
            <div className="relative w-full aspect-square max-w-[500px] lg:max-w-[550px]">
                {/* Decorative background elements */}
                <div className="absolute inset-4 bg-primary/10 rounded-[2rem] transform rotate-6 scale-95 z-0 blur-sm"></div>
                <div className="absolute inset-4 bg-blue-100 rounded-[2rem] transform -rotate-3 scale-95 z-0 blur-sm"></div>
                
                <Image src="/therapist-hero.png" alt="Professional Therapist" fill className="object-cover rounded-[2rem] shadow-2xl relative z-10" priority sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 550px"/>
            </div>
          </div>

        </div>
      </LandingContainer>
    </section>);
}
