'use client';
import { motion } from "framer-motion";
import { Calendar, Star, Award, GraduationCap, Heart, Target } from "lucide-react";
import Image from "next/image";
export default function DoctorProfile() {
    return (<section className="py-24 bg-gradient-to-br from-slate-50 to-emerald-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-40 h-40 bg-emerald-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-blue-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Side - Doctor Image */}
          <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="relative">
            <div className="relative group">
              {/* Shadow layers */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-emerald-800/15 rounded-3xl transform translate-x-6 translate-y-6 blur-xl group-hover:translate-x-8 group-hover:translate-y-8 transition-all duration-500"></div>
              
              {/* Main Image Container */}
              <div className="relative bg-white p-3 rounded-3xl shadow-2xl group-hover:shadow-emerald-500/20 transition-all duration-500 transform group-hover:-translate-y-2">
                <Image src="/IMG_4107_1752582835546.jpeg" alt="Dr. Philip Pellegrino - Licensed Psychologist in Bethlehem PA" width={800} height={1000} className="w-full h-auto rounded-2xl object-cover" priority/>
              </div>
            </div>
          </motion.div>

          {/* Right Side - Content */}
          <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
            {/* Google Rating Badge */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 border-2 border-yellow-200 rounded-full mb-6">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (<Star key={i} className="h-4 w-4 text-yellow-500 fill-yellow-500"/>))}
              </div>
              <span className="text-yellow-800 font-bold text-sm">5.0 Google Rating</span>
            </motion.div>

            {/* Main Heading */}
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
              Meet Dr. Philip Pellegrino
            </motion.h2>

            {/* Subtitle */}
            <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="text-2xl md:text-3xl text-emerald-600 font-bold mb-8 leading-snug">
              Your Trusted Guide to Lasting Transformation
            </motion.p>

            {/* Credentials List */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="space-y-3 mb-8">
              <div className="flex items-start gap-3">
                <Award className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5"/>
                <p className="text-base text-slate-700 leading-relaxed">
                  <span className="font-semibold">Licensed Psychologist</span> in Pennsylvania
                </p>
              </div>
              <div className="flex items-start gap-3">
                <GraduationCap className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"/>
                <p className="text-base text-slate-700 leading-relaxed">
                  <span className="font-semibold">Psy.D.</span> from Philadelphia College of Osteopathic Medicine (2009)
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Award className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5"/>
                <p className="text-base text-slate-700 leading-relaxed">
                  <span className="font-semibold">American Board</span> of Professional Psychology (ABPP)
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5"/>
                <p className="text-base text-slate-700 leading-relaxed">
                  <span className="font-semibold">Specialist</span> in Trauma, OCD & CRAFT Therapy
                </p>
              </div>
            </motion.div>

            {/* Description */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="space-y-4 mb-8">
              <p className="text-lg text-slate-600 leading-relaxed">
                My approach to therapy is <span className="font-semibold text-slate-700">warm, collaborative, and focused</span> on 
                getting to the core of what's keeping you stuck. While I bring deep compassion and a non-judgmental space for you 
                to explore your experience, I'm not the kind of therapist who just nods and listens.
              </p>

              <p className="text-lg text-slate-600 leading-relaxed">
                Together, we'll identify what's working, what's not, and what needs to change. I take a <span className="font-semibold text-slate-700">practical, results-oriented approach</span>—offering 
                real strategies, tools, and feedback you can apply in your everyday life.
              </p>
            </motion.div>

            {/* Key Highlights */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="grid grid-cols-2 gap-4 mb-10">
              <div className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-emerald-100">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Heart className="w-5 h-5 text-emerald-600"/>
                </div>
                <span className="text-sm font-semibold text-slate-700">Compassionate Care</span>
              </div>

              <div className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-blue-100">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Target className="w-5 h-5 text-blue-600"/>
                </div>
                <span className="text-sm font-semibold text-slate-700">Results-Driven</span>
              </div>

              <div className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-purple-100">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Award className="w-5 h-5 text-purple-600"/>
                </div>
                <span className="text-sm font-semibold text-slate-700">Board Certified</span>
              </div>

              <div className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-emerald-100">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-5 h-5 text-emerald-600"/>
                </div>
                <span className="text-sm font-semibold text-slate-700">Doctoral Graduate</span>
              </div>
            </motion.div>

            {/* CTA Button */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
              <a href="https://api.leadconnectorhq.com/widget/bookings/phillip-pellegrino-personal-calendar--nwkqht7c" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-full text-lg font-bold shadow-lg hover:shadow-xl hover:from-emerald-700 hover:to-emerald-800 transform hover:scale-105 transition-all duration-300">
                <Calendar className="w-6 h-6"/>
                Schedule with Dr. Pellegrino
              </a>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>);
}
