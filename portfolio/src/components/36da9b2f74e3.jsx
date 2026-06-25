'use client';
import { motion } from "framer-motion";
import CTABanner from "@/components/1e8a37caa677";
import { MapPin, Phone, Mail } from "lucide-react";
export default function Contact() {
    return (<div className="pt-20">
      {/* Hero Section */}
      <section className="py-20 hero-glow">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-5xl font-bold text-[hsl(var(--midnight))] mb-6">
            Get In Touch
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="text-xl text-slate-600 max-w-3xl mx-auto">
            Ready to start your healing journey? We're here to help you take the first step 
            toward lasting change and recovery.
          </motion.p>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }} className="text-center">
              <div className="bg-[hsl(var(--lavender))]/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 icon-holographic">
                <Phone className="text-[hsl(var(--lavender))] icon-3d icon-float icon-magnetic icon-particles icon-glow-enhanced icon-extruded" size={32}/>
              </div>
              <h3 className="text-xl font-semibold text-[hsl(var(--midnight))] mb-2">Phone</h3>
              <a href="tel:610-936-8470" className="text-slate-600 hover:text-[hsl(var(--lavender))] transition-colors cursor-pointer">610-936-8470</a>

            </motion.div>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="text-center">
              <div className="bg-[hsl(var(--lavender))]/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 icon-holographic">
                <Mail className="text-[hsl(var(--lavender))] icon-3d icon-float icon-magnetic icon-particles icon-glow-enhanced icon-extruded" size={32}/>
              </div>
              <h3 className="text-xl font-semibold text-[hsl(var(--midnight))] mb-2">Email</h3>
              <p className="text-slate-600">Dr.Pellegrino@DrPhilipPellegrino.com</p>

            </motion.div>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="text-center">
              <div className="bg-[hsl(var(--lavender))]/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 icon-holographic">
                <MapPin className="text-[hsl(var(--lavender))] icon-3d icon-float icon-magnetic icon-particles icon-glow-enhanced icon-extruded" size={32}/>
              </div>
              <h3 className="text-xl font-semibold text-[hsl(var(--midnight))] mb-2">Location</h3>
              <p className="text-slate-600">Bethlehem, PA</p>
              <p className="text-slate-600">Serving Lehigh Valley</p>
            </motion.div>


          </div>

          {/* Booking Calendar */}
          <motion.div id="booking" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-[hsl(var(--midnight))] mb-6 text-center">Schedule a Consultation</h2>
            <div className="w-full h-[800px] md:h-[900px]">
              <iframe title="Book an appointment" src="https://api.leadconnectorhq.com/widget/bookings/phillip-pellegrino-personal-calendar--nwkqht7c" className="rounded-xl w-full h-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
            </div>
          </motion.div>
        </div>
      </section>

      <CTABanner />
    </div>);
}
