import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, MapPin, Phone, Mail, Award, GraduationCap, Heart, Star, ExternalLink } from "lucide-react";
import { Button } from "@/components/2795b661f080";
import Image from "next/image";
export default function DoctorProfileModal({ isOpen, onClose }) {
    return (<AnimatePresence>
      {isOpen && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.3 }} className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Close button clicked');
                onClose();
            }} className="absolute top-4 right-4 z-20 p-3 rounded-full bg-white hover:bg-slate-100 transition-all duration-200 shadow-lg hover:shadow-xl border border-slate-200" aria-label="Close modal" type="button">
              <X className="h-6 w-6 text-slate-700 hover:text-slate-900"/>
            </button>

            {/* Header with Background */}
            <div className="relative bg-gradient-to-br from-emerald-600 to-blue-700 text-white p-8 rounded-t-2xl overflow-hidden">
              {/* Background decorative elements */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse"></div>
                <div className="absolute bottom-10 right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
              </div>
              
              <div className="relative z-10 text-center">
                <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-3xl md:text-4xl font-bold mb-4">
                  Meet Dr. Philip Pellegrino
                </motion.h2>
                
                <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
                  Trauma-Informed Therapist & Founder of Not Your Traditional Therapist
                </motion.p>
              </div>
            </div>

            {/* Main Content */}
            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Left Column - Image and Basic Info */}
                <div className="space-y-6">
                  {/* Doctor Image */}
                  <div className="relative mx-auto w-fit">
                    <div className="relative bg-white p-4 rounded-2xl shadow-xl">
                      <Image src="/IMG_4107_1752582835546.jpeg" alt="Dr. Philip Pellegrino" width={256} height={256} className="w-64 h-64 object-cover rounded-xl"/>
                      <div className="absolute inset-0 bg-gradient-to-t from-emerald-600/10 to-transparent rounded-xl"></div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="bg-slate-50 rounded-xl p-6 space-y-4">
                    <h3 className="text-xl font-bold text-slate-800 mb-4">Contact Information</h3>
                    
                    <div className="flex items-center space-x-3 text-slate-600">
                      <MapPin className="h-5 w-5 text-emerald-600"/>
                      <span>Bethlehem, Pennsylvania</span>
                    </div>
                    
                    <div className="flex items-center space-x-3 text-slate-600">
                      <Mail className="h-5 w-5 text-emerald-600"/>
                      <a href="mailto:Dr.Pellegrino@DrPhilipPellegrino.com" className="hover:text-emerald-600 transition-colors cursor-pointer">Dr.Pellegrino@DrPhilipPellegrino.com</a>
                    </div>
                    
                    <div className="flex items-center space-x-3 text-slate-600">
                      <Phone className="h-5 w-5 text-emerald-600"/>
                      <a href="tel:610-936-8470" className="hover:text-emerald-600 transition-colors cursor-pointer">610-936-8470</a>
                    </div>

                  </div>
                </div>

                {/* Right Column - Professional Info */}
                <div className="space-y-6">
                  {/* Credentials */}
                  <div className="bg-blue-50 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                      <Award className="h-6 w-6 text-blue-600 mr-2"/>
                      Professional Credentials
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <GraduationCap className="h-5 w-5 text-blue-600 mt-1"/>
                        <div>
                          <p className="font-semibold text-slate-800">Licensed Clinical Psychologist</p>
                          <p className="text-slate-600 text-sm">State of Pennsylvania</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Heart className="h-5 w-5 text-blue-600 mt-1"/>
                        <div>
                          <p className="font-semibold text-slate-800">Trauma Specialist</p>
                          <p className="text-slate-600 text-sm">Board Certified</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Approach */}
                  <div className="bg-emerald-50 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-slate-800 mb-4">Treatment Approach</h3>
                    <p className="text-slate-700 leading-relaxed mb-4">
                      Dr. Pellegrino specializes in evidence-based trauma therapies, offering both traditional sessions and intensive treatment formats. His approach combines cutting-edge research with compassionate care.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-emerald-600"/>
                        <span className="text-slate-700">Cognitive Processing Therapy (CPT)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-emerald-600"/>
                        <span className="text-slate-700">Prolonged Exposure Therapy (PE)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-emerald-600"/>
                        <span className="text-slate-700">Intensive Treatment Programs</span>
                      </div>
                    </div>
                  </div>

                  {/* Social Media */}
                  <div className="bg-slate-50 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-slate-800 mb-4">Connect Online</h3>
                    <div className="space-y-3">
                      <a href="#" className="flex items-center space-x-3 text-slate-600 hover:text-emerald-600 transition-colors">
                        <ExternalLink className="h-5 w-5"/>
                        <span>Professional LinkedIn</span>
                      </a>
                      <a href="#" className="flex items-center space-x-3 text-slate-600 hover:text-emerald-600 transition-colors">
                        <ExternalLink className="h-5 w-5"/>
                        <span>Psychology Today Profile</span>
                      </a>
                      <a href="#" className="flex items-center space-x-3 text-slate-600 hover:text-emerald-600 transition-colors">
                        <ExternalLink className="h-5 w-5"/>
                        <span>Research Publications</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Section */}
              <div className="mt-8 bg-gradient-to-r from-emerald-600 to-blue-700 rounded-xl p-8 text-white text-center">
                <h3 className="text-2xl font-bold mb-4">Ready to Begin Your Healing Journey?</h3>
                <p className="text-white/90 mb-6 max-w-2xl mx-auto">
                  Take the first step toward recovery with personalized, evidence-based trauma therapy. 
                  Schedule a consultation to discuss your treatment options.
                </p>
                
                <Button onClick={() => window.open('https://api.leadconnectorhq.com/widget/bookings/phillip-pellegrino-personal-calendar--nwkqht7c', '_blank')} className="bg-white text-emerald-600 px-8 py-4 rounded-full text-lg font-bold hover:bg-slate-100 hover:scale-105 transition-all duration-300 shadow-lg cursor-pointer">
                  <Calendar className="mr-2 h-5 w-5"/>
                  Schedule Consultation
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>)}
    </AnimatePresence>);
}
