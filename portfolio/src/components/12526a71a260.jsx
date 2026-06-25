import { Facebook, Instagram, Linkedin, Lock, MapPin, Phone, Mail, } from "lucide-react";
import Link from "next/link";
import GoogleMaps from "@/components/57a4eb96e28f";
import NewsletterSignup from "@/components/12943ff5016e";
export default function Footer() {
    return (<>
      {/* Google Maps Section */}
      <GoogleMaps />

      {/* Separator */}
      <div className="border-t border-slate-200"></div>

      {/* Newsletter Signup */}
      <NewsletterSignup />

      {/* Footer */}
      <footer className="bg-gradient-to-br from-slate-900 via-[hsl(215,25%,27%)] to-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-12 gap-12 mb-12">
            {/* Brand Section - Takes more space */}
            <div className="md:col-span-5">
              <h3 className="text-3xl font-bold mb-5 text-white leading-tight">
                Not Your Traditional Therapist
              </h3>
              <p className="text-slate-300 mb-6 text-base leading-relaxed max-w-md">
                Expert Therapist in Bethlehem, PA serving Easton, Allentown, and
                the Lehigh Valley. Specializing in trauma intensives, OCD
                treatment, and anxiety therapy with evidence-based CPT, PE, and
                ERP approaches.
              </p>

              {/* Contact Info */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-slate-300">
                  <MapPin size={18} className="text-emerald-400 flex-shrink-0"/>
                  <span className="text-sm">
                    Bethlehem, PA | Serving Lehigh Valley
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <Phone size={18} className="text-emerald-400 flex-shrink-0"/>
                  <a href="tel:+1234567890" className="text-sm hover:text-emerald-400 transition-colors">
                    Schedule a Consultation
                  </a>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <Mail size={18} className="text-emerald-400 flex-shrink-0"/>
                  <a href="mailto:contact@example.com" className="text-sm hover:text-emerald-400 transition-colors">
                    Get in Touch
                  </a>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex items-center gap-4">
                <a href="https://www.facebook.com/DrPhilipPellegrino" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white rounded-full transition-all duration-300 transform hover:scale-110" aria-label="Facebook">
                  <Facebook size={20}/>
                </a>
                <a href="https://www.instagram.com/drpellegrino78/" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white rounded-full transition-all duration-300 transform hover:scale-110" aria-label="Instagram">
                  <Instagram size={20}/>
                </a>
                <a href="https://www.linkedin.com/in/dr-philip-pellegrino-psy-d-05aa99339/" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white rounded-full transition-all duration-300 transform hover:scale-110" aria-label="LinkedIn">
                  <Linkedin size={20}/>
                </a>

                {/* Admin Button */}
                <div className="ml-2 pl-4 border-l border-slate-700">
                  <Link href="/admin">
                    <button className="flex items-center gap-2 text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white px-4 py-2.5 rounded-full transition-all duration-300 transform hover:scale-105">
                      <Lock size={14}/>
                      <span className="font-medium">Admin</span>
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="md:col-span-3">
              <h4 className="text-lg font-bold mb-5 text-white">
                Our Services
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/Therapist-Allentown-PA" className="text-slate-300 hover:text-emerald-400 transition-colors text-sm flex items-start group">
                    <span className="mr-2 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      →
                    </span>
                    <span>Trauma Intensives</span>
                  </Link>
                </li>
                <li>
                  <Link href="/Therapist-Bethlehem-PA" className="text-slate-300 hover:text-emerald-400 transition-colors text-sm flex items-start group">
                    <span className="mr-2 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      →
                    </span>
                    <span>OCD Treatment</span>
                  </Link>
                </li>
                <li>
                  <Link href="/Therapist-Bethlehem-PA" className="text-slate-300 hover:text-emerald-400 transition-colors text-sm flex items-start group">
                    <span className="mr-2 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      →
                    </span>
                    <span>Anxiety Therapy</span>
                  </Link>
                </li>
                <li>
                  <Link href="/Therapist-LehighValley-PA" className="text-slate-300 hover:text-emerald-400 transition-colors text-sm flex items-start group">
                    <span className="mr-2 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      →
                    </span>
                    <span>CRAFT Therapy</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div className="md:col-span-2">
              <h4 className="text-lg font-bold mb-5 text-white">Resources</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/Therapist-Easton-PA" className="text-slate-300 hover:text-emerald-400 transition-colors text-sm flex items-start group">
                    <span className="mr-2 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      →
                    </span>
                    <span>Blog</span>
                  </Link>
                </li>
                <li>
                  <Link href="/Therapist-Bethlehem-PA" className="text-slate-300 hover:text-emerald-400 transition-colors text-sm flex items-start group">
                    <span className="mr-2 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      →
                    </span>
                    <span>About CPT</span>
                  </Link>
                </li>
                <li>
                  <Link href="/Therapist-Bethlehem-PA" className="text-slate-300 hover:text-emerald-400 transition-colors text-sm flex items-start group">
                    <span className="mr-2 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      →
                    </span>
                    <span>About ERP</span>
                  </Link>
                </li>
                <li>
                  <Link href="/Therapist-LehighValley-PA" className="text-slate-300 hover:text-emerald-400 transition-colors text-sm flex items-start group">
                    <span className="mr-2 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      →
                    </span>
                    <span>FAQ</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div className="md:col-span-2">
              <h4 className="text-lg font-bold mb-5 text-white">Legal</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/privacy-policy" className="text-slate-300 hover:text-emerald-400 transition-colors text-sm flex items-start group">
                    <span className="mr-2 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      →
                    </span>
                    <span>Privacy Policy</span>
                  </Link>
                </li>
                <li>
                  <Link href="/terms-of-service" className="text-slate-300 hover:text-emerald-400 transition-colors text-sm flex items-start group">
                    <span className="mr-2 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      →
                    </span>
                    <span>Terms of Service</span>
                  </Link>
                </li>
                <li>
                  <Link href="/hipaa-notice" className="text-slate-300 hover:text-emerald-400 transition-colors text-sm flex items-start group">
                    <span className="mr-2 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      →
                    </span>
                    <span>HIPAA Notice</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-slate-700/50 pt-8 mt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-slate-400 text-sm text-center md:text-left leading-relaxed">
                © 2026{" "}
                <span className="text-white font-medium">
                  Not Your Traditional Therapist
                </span>
                <span className="hidden md:inline"> · </span>
                <span className="block md:inline mt-1 md:mt-0">
                  Licensed Psychologist serving Bethlehem, Easton, Allentown &
                  Lehigh Valley, PA
                </span>
              </div>
              <div className="text-slate-400 text-xs">All rights reserved</div>
            </div>
          </div>
        </div>
      </footer>
    </>);
}
