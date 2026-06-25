'use client';
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock, Navigation } from "lucide-react";
export default function GoogleMaps() {
    const address = "623 W. Union Blvd Suite 1-C, Bethlehem, PA 18018";
    const encodedAddress = encodeURIComponent(address);
    return (<motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="py-20 bg-gradient-to-br from-slate-50 via-emerald-50/30 to-blue-50/30 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-emerald-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-blue-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="inline-flex items-center justify-center px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-4">
            <MapPin className="w-4 h-4 mr-2"/>
            Conveniently Located
          </motion.div>
          
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
            Visit Our Office
          </motion.h2>
          
          <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Located in the heart of <span className="font-semibold text-slate-700">Bethlehem, PA</span>, our office provides a comfortable, 
            private, and welcoming space for your healing journey.
          </motion.p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Information Cards - 4 Cards Same Size */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
              {/* Address Card */}
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-emerald-100/50 h-full">
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-emerald-100 rounded-xl">
                      <MapPin className="w-6 h-6 text-emerald-600"/>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Office Address</h3>
                  </div>
                  <div className="flex-1">
                    <p className="text-base text-slate-700 leading-relaxed mb-4">
                      <span className="block font-semibold">623 W. Union Blvd</span>
                      <span className="block">Suite 1-C</span>
                      <span className="block">Bethlehem, PA 18018</span>
                    </p>
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium text-sm transition-colors">
                      <Navigation className="w-4 h-4"/>
                      Get Directions
                    </a>
                  </div>
                </div>
              </div>

              {/* Phone Card */}
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-100/50 h-full">
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-blue-100 rounded-xl">
                      <Phone className="w-6 h-6 text-blue-600"/>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Contact</h3>
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-700 mb-4">
                      <a href="tel:610-936-8470" className="block text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors mb-2">
                        610-936-8470
                      </a>
                      <span className="block text-sm text-slate-600 leading-relaxed">
                        Dr. Philip Pellegrino
                      </span>
                    </p>
                    <p className="text-sm text-slate-600">
                      Call to schedule your appointment
                    </p>
                  </div>
                </div>
              </div>

              {/* Email Card */}
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-purple-100/50 h-full">
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-purple-100 rounded-xl">
                      <Mail className="w-6 h-6 text-purple-600"/>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Email Us</h3>
                  </div>
                  <div className="flex-1">
                    <a href="mailto:Dr.Pellegrino@DrPhilipPellegrino.com" className="block text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors mb-2 break-all">
                      Dr.Pellegrino@DrPhilipPellegrino.com
                    </a>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Email for inquiries and scheduling
                    </p>
                  </div>
                </div>
              </div>

              {/* Office Hours Card */}
              <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-2xl p-6 shadow-lg border border-emerald-200/50 h-full">
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-white rounded-xl shadow-sm">
                      <Clock className="w-6 h-6 text-emerald-600"/>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Office Hours</h3>
                  </div>
                  <div className="flex-1">
                    <p className="text-base text-slate-700 mb-2">
                      <span className="block font-semibold">By Appointment Only</span>
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Flexible scheduling available to accommodate your needs
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Google Maps Embed */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }} className="lg:col-span-3">
            <div className="bg-white rounded-2xl p-2 shadow-xl border border-slate-200 h-full">
              <div className="relative overflow-hidden rounded-xl h-full">
                <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3048.7!2d-75.3709!3d40.6123!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2s623+W+Union+Blvd+Suite+1-C+Bethlehem+PA+18018!5e0!3m2!1sen!2sus!4v1641234567890" width="100%" height="100%" style={{ border: 0, minHeight: '500px' }} allowFullScreen={true} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="w-full h-full" title="Bethlehem Psychologist Office Location - Dr. Philip Pellegrino"/>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Info Banner */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }} className="mt-8 p-6 bg-white rounded-2xl shadow-lg border border-slate-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1 text-center md:text-left">
              <p className="text-base text-slate-700 leading-relaxed">
                <span className="font-bold text-slate-900 block md:inline">Serving the Lehigh Valley</span>
                <span className="hidden md:inline mx-3">•</span>
                <span className="block md:inline mt-1 md:mt-0">Bethlehem • Easton • Allentown & Surrounding Areas</span>
              </p>
            </div>
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-full hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-emerald-500/30 font-semibold">
              <Navigation className="w-5 h-5"/>
              Get Directions
            </a>
          </div>
        </motion.div>
      </div>
    </motion.section>);
}
