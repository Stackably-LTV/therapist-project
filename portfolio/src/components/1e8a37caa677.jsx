'use client';
import { motion } from "framer-motion";
import { Calendar, Phone, Zap } from "lucide-react";
export default function CTABanner() {
    return (<section className="py-20 bg-gradient-to-r from-emerald-600 via-emerald-700 to-blue-700 text-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-white/5 rounded-full blur-xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      </div>

      <div className="max-w-5xl mx-auto text-center px-6 relative z-10">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="inline-flex items-center justify-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium mb-6">
          <Zap className="w-4 h-4 mr-2"/>
          Fast-Track Your Recovery
        </motion.div>

        <motion.h2 initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
          Ready to fast-track your healing?
        </motion.h2>
        
        <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="text-2xl md:text-3xl mb-12 text-white/95 font-medium leading-relaxed">
          Experience <span className="font-bold text-white underline decoration-white/30">Months of Therapy in 1-3 weeks</span>
        </motion.p>
        
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a href="https://api.leadconnectorhq.com/widget/bookings/phillip-pellegrino-personal-calendar--nwkqht7c" target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-3 px-8 py-5 bg-white text-emerald-700 rounded-full text-lg font-bold shadow-2xl hover:shadow-white/20 hover:scale-105 transition-all duration-300">
            <Calendar className="w-6 h-6 group-hover:rotate-12 transition-transform"/>
            Schedule A Consultation
          </a>
          
          <a href="tel:610-936-8470" className="group inline-flex items-center gap-3 px-8 py-5 bg-emerald-500/30 backdrop-blur-sm border-2 border-white/50 text-white rounded-full text-lg font-bold hover:bg-white/20 hover:border-white hover:scale-105 transition-all duration-300">
            <Phone className="w-6 h-6 group-hover:rotate-12 transition-transform"/>
            Call Now
          </a>
        </motion.div>

        {/* Trust indicators */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.4 }} className="mt-12 flex flex-wrap justify-center items-center gap-8 text-white/80 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <span>Licensed Psychologist</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <span>Evidence-Based Treatment</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <span>Personalized Care</span>
          </div>
        </motion.div>
      </div>
    </section>);
}
