'use client';
import { motion } from "framer-motion";
import { Phone, Mail, MessageCircle, Calendar } from "lucide-react";
export default function ContactSection() {
    return (<section className="py-24 bg-gradient-to-br from-white via-slate-50 to-emerald-50/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 right-20 w-40 h-40 bg-emerald-200/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-40 h-40 bg-blue-200/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-6xl mx-auto px-6 lg:px-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center mb-16">
          <div className="inline-flex items-center justify-center px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-6">
            <MessageCircle className="w-4 h-4 mr-2"/>
            Let's Connect
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
            Get In Touch
          </h2>
          
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Ready to start your healing journey? Contact us to learn more about our services 
            and schedule your consultation.
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Phone Card */}
          <motion.a href="tel:610-936-8470" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-blue-100 hover:border-blue-300">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center bg-blue-100 group-hover:bg-blue-200 rounded-2xl transition-colors">
                <Phone className="w-8 h-8 text-blue-600"/>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Dr. Philip Pellegrino</h3>
                <p className="text-3xl font-bold text-blue-600 group-hover:text-blue-700 mb-2 transition-colors">
                  610-936-8470
                </p>
                <p className="text-base text-slate-600 leading-relaxed">
                  Call to schedule your appointment or discuss treatment options
                </p>
              </div>
            </div>
          </motion.a>

          {/* Email Card */}
          <motion.a href="mailto:Dr.Pellegrino@DrPhilipPellegrino.com" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-purple-100 hover:border-purple-300">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center bg-purple-100 group-hover:bg-purple-200 rounded-2xl transition-colors">
                <Mail className="w-8 h-8 text-purple-600"/>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Email</h3>
                <p className="text-lg font-semibold text-purple-600 group-hover:text-purple-700 mb-2 break-all transition-colors">
                  Dr.Pellegrino@DrPhilipPellegrino.com
                </p>
                <p className="text-base text-slate-600 leading-relaxed">
                  Send us an email for inquiries and scheduling
                </p>
              </div>
            </div>
          </motion.a>
        </div>

        {/* CTA Button */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="text-center">
          <a href="https://api.leadconnectorhq.com/widget/bookings/phillip-pellegrino-personal-calendar--nwkqht7c" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-full hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-emerald-500/30 font-bold text-lg">
            <Calendar className="w-6 h-6"/>
            Schedule Your Consultation
          </a>
        </motion.div>
      </div>
    </section>);
}
