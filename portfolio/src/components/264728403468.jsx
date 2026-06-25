'use client';
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Calendar } from "lucide-react";
import { BOOKING_SECTION_HREF } from "@/components/cc961f797299";
export default function Navbar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const navItems = [
        { href: "/", label: "Home" },
        { href: "/Therapist-Bethlehem-PA", label: "Services" },
        { href: "/Therapist-Allentown-PA", label: "Intensives" },
        { href: "/Therapist-Easton-PA", label: "Blog" },
        { href: "/Therapist-LehighValley-PA", label: "Contact" },
    ];
    return (<nav className="fixed top-0 w-full bg-white/95 backdrop-blur-lg border-b border-slate-200 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="font-bold text-xl text-slate-900 hover:text-emerald-600 transition-colors cursor-pointer">
            Dr. Philip Pellegrino
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (<Link key={item.href} href={item.href} className={`font-medium text-base transition-colors cursor-pointer relative group ${pathname === item.href
                ? 'text-emerald-600'
                : 'text-slate-700 hover:text-emerald-600'}`}>
                {item.label}
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-emerald-600 transition-all ${pathname === item.href ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
              </Link>))}
          </div>
          
          {/* CTA Button */}
          <div className="hidden md:block">
            <Link href={BOOKING_SECTION_HREF} className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-full font-semibold shadow-lg hover:shadow-xl hover:from-emerald-700 hover:to-emerald-800 transform hover:scale-105 transition-all duration-300">
              <Calendar className="w-5 h-5"/>
              Book Now
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 text-slate-700 hover:text-emerald-600 transition-colors" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
            {isOpen ? <X size={28}/> : <Menu size={28}/>}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (<div className="md:hidden pb-6 pt-2 border-t border-slate-200">
            <div className="flex flex-col gap-2 py-4">
              {navItems.map((item) => (<Link key={item.href} href={item.href} className={`block py-3 px-4 rounded-xl font-medium transition-all cursor-pointer ${pathname === item.href
                    ? 'text-emerald-600 bg-emerald-50'
                    : 'text-slate-700 hover:text-emerald-600 hover:bg-slate-50'}`} onClick={() => setIsOpen(false)}>
                  {item.label}
                </Link>))}
              <div className="pt-4 px-2">
                <Link href={BOOKING_SECTION_HREF} onClick={() => setIsOpen(false)} className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-full font-semibold shadow-lg">
                  <Calendar className="w-5 h-5"/>
                  Book Now
                </Link>
              </div>
            </div>
          </div>)}
      </div>
    </nav>);
}
