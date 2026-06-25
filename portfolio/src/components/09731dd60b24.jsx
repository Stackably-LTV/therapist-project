'use client';
import { motion } from "framer-motion";
import { Button } from "@/components/2795b661f080";
import { Calendar, ChevronDown } from "lucide-react";
import FloatingShapes from "@/components/50963499f999";
import { useState, useEffect } from "react";
export default function Hero() {
    const [particles, setParticles] = useState([]);
    const [stars, setStars] = useState([]);
    useEffect(() => {
        // Generate random positions only on client side
        setParticles(Array.from({ length: 40 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            top: Math.random() * 100,
            delay: Math.random() * 3,
            duration: 15 + Math.random() * 10
        })));
        setStars(Array.from({ length: 25 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            top: Math.random() * 100,
            delay: Math.random() * 2,
            duration: 20 + Math.random() * 15
        })));
    }, []);
    return (<section className="relative min-h-screen flex items-center justify-center hero-glow overflow-hidden">
      <FloatingShapes />
      
      {/* Floating Particles Background */}
      {particles.length > 0 && (<div className="absolute inset-0 pointer-events-none z-0">
          {particles.map((particle) => (<div key={particle.id} className="absolute animate-float-particles opacity-30" style={{
                    left: `${particle.left}%`,
                    top: `${particle.top}%`,
                    animationDelay: `${particle.delay}s`,
                    animationDuration: `${particle.duration}s`
                }}>
              <div className="w-1 h-1 bg-emerald-400 rounded-full particle-glow"></div>
            </div>))}
          
          {stars.map((star) => (<div key={`star-${star.id}`} className="absolute animate-float-particles-slow opacity-20" style={{
                    left: `${star.left}%`,
                    top: `${star.top}%`,
                    animationDelay: `${star.delay}s`,
                    animationDuration: `${star.duration}s`
                }}>
              <div className="w-0.5 h-0.5 bg-emerald-400 rounded-full particle-glow-subtle"></div>
            </div>))}
        </div>)}
      
      <div className="text-center max-w-5xl mx-auto px-6 relative z-10">
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-5xl md:text-7xl lg:text-8xl font-bold text-slate-900 mb-8 leading-[1.1]">
          Not Your{" "}
          <span className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-blue-600 bg-clip-text text-transparent animate-glow-sweep">
            Traditional Therapist
          </span>
        </motion.h1>
        
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="text-2xl md:text-3xl text-slate-700 mb-6 font-semibold">
          You want real solutions.
        </motion.p>
        
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="text-lg md:text-xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed">
          Licensed Psychologist in <span className="font-semibold text-slate-700">Bethlehem, PA</span> specializing in 
          trauma, OCD, and CRAFT intensives. Also serving Easton, PA, Allentown, PA, and the entire Lehigh Valley.
        </motion.p>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }} className="flex justify-center">
          <Button onClick={() => window.open('https://api.leadconnectorhq.com/widget/bookings/phillip-pellegrino-personal-calendar--nwkqht7c', '_blank')} className="bg-emerald-600 text-white px-8 py-4 rounded-full text-lg font-bold glow-on-hover shadow-xl border-2 border-emerald-600 hover:bg-emerald-700 hover:border-emerald-700 transform hover:scale-105 transition-all duration-300 cursor-pointer">
            <Calendar className="mr-2 h-5 w-5 icon-3d icon-float icon-holographic icon-glow-enhanced icon-extruded"/>
            Book Your Session
          </Button>
        </motion.div>
      </div>
      
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <ChevronDown className="text-[hsl(var(--forest-green))] text-2xl"/>
      </motion.div>
    </section>);
}
