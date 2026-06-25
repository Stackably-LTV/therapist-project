import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, Heart, Shield, Award, CheckCircle } from "lucide-react";
import { Button } from "@/components/2795b661f080";
export default function TherapyIntensivesModal({ isOpen, onClose }) {
    console.log('Modal render:', isOpen);
    return (<AnimatePresence>
      {isOpen && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.3 }} className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button onClick={onClose} className="absolute top-6 right-6 z-10 p-2 rounded-full bg-white/80 hover:bg-white transition-colors shadow-lg">
              <X className="h-5 w-5 text-slate-600"/>
            </button>

            {/* Header */}
            <div className="relative bg-gradient-to-br from-emerald-600 to-blue-700 text-white p-8 rounded-t-2xl overflow-hidden">
              {/* Background decorative elements */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse"></div>
                <div className="absolute bottom-10 right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
              </div>
              
              <div className="relative z-10">
                <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-3xl md:text-4xl font-bold mb-4">
                  Therapy Intensives
                </motion.h2>
                <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-xl text-emerald-100 max-w-2xl">
                  Transform your healing journey with concentrated, evidence-based therapy sessions designed for breakthrough results.
                </motion.p>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 space-y-8">
              {/* What Are Therapy Intensives? */}
              <motion.section initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <h3 className="text-2xl font-bold text-slate-900 mb-4 flex items-center">
                  <Heart className="h-6 w-6 text-emerald-600 mr-3"/>
                  What Are Therapy Intensives?
                </h3>
                <p className="text-lg text-slate-600 leading-relaxed mb-6">
                  Therapy intensives are concentrated therapy sessions that allow for deeper, more focused work than traditional weekly sessions. 
                  Instead of spreading treatment over months or years, intensives condense your healing journey into days or weeks of 
                  comprehensive, evidence-based therapy.
                </p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-100">
                    <Clock className="h-8 w-8 text-emerald-600 mb-4"/>
                    <h4 className="text-lg font-semibold text-slate-900 mb-3">Accelerated Healing</h4>
                    <p className="text-slate-600">
                      Experience breakthrough moments faster with concentrated sessions that maintain momentum and focus.
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                    <Shield className="h-8 w-8 text-blue-600 mb-4"/>
                    <h4 className="text-lg font-semibold text-slate-900 mb-3">Evidence-Based</h4>
                    <p className="text-slate-600">
                      Utilizing proven therapies like CPT and PE that are specifically designed for intensive formats.
                    </p>
                  </div>
                </div>
              </motion.section>

              {/* Treatment Types */}
              <motion.section initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                  <Award className="h-6 w-6 text-emerald-600 mr-3"/>
                  Our Intensive Programs
                </h3>
                
                <div className="grid gap-6">
                  {/* CPT */}
                  <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-6 border border-emerald-100">
                    <h4 className="text-xl font-semibold text-slate-900 mb-3">Cognitive Processing Therapy (CPT)</h4>
                    <p className="text-slate-600 mb-4">
                      Gold-standard treatment for PTSD that helps you identify and challenge unhelpful beliefs related to trauma.
                      6-12 hours over 2-4 weeks.
                    </p>
                    <ul className="text-slate-600 space-y-1">
                      <li>• Education about PTSD and trauma recovery</li>
                      <li>• Identifying "stuck points" - unhelpful trauma-related beliefs</li>
                      <li>• Cognitive restructuring for balanced thinking</li>
                      <li>• Long-term skill development</li>
                    </ul>
                  </div>

                  {/* PE */}
                  <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl p-6 border border-blue-100">
                    <h4 className="text-xl font-semibold text-slate-900 mb-3">Prolonged Exposure (PE)</h4>
                    <p className="text-slate-600 mb-4">
                      Helps you gradually confront trauma-related memories and situations you've been avoiding.
                      6-12 hours over 2-4 weeks.
                    </p>
                    <ul className="text-slate-600 space-y-1">
                      <li>• Psychoeducation about trauma and avoidance</li>
                      <li>• Imaginal exposure: safely recounting trauma memories</li>
                      <li>• In vivo exposure: confronting avoided situations</li>
                      <li>• Processing and reflection exercises</li>
                    </ul>
                  </div>

                  {/* ERP */}
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100">
                    <h4 className="text-xl font-semibold text-slate-900 mb-3">Exposure & Response Prevention (ERP)</h4>
                    <p className="text-slate-600 mb-4">
                      Gold-standard for OCD treatment that involves facing feared thoughts while resisting compulsions.
                      6-12 hours over 2-4 weeks.
                    </p>
                    <ul className="text-slate-600 space-y-1">
                      <li>• Exposure to feared thoughts/situations</li>
                      <li>• Response prevention (resisting compulsions)</li>
                      <li>• Hierarchy development and gradual progression</li>
                      <li>• Building tolerance and reducing anxiety</li>
                    </ul>
                  </div>

                  {/* CRAFT */}
                  <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-6 border border-orange-100">
                    <h4 className="text-xl font-semibold text-slate-900 mb-3">CRAFT for Families</h4>
                    <p className="text-slate-600 mb-4">
                      Evidence-based support for families affected by substance abuse, without confrontation or ultimatums.
                      6-12 hours over 2-4 weeks.
                    </p>
                    <ul className="text-slate-600 space-y-1">
                      <li>• Positive communication skills</li>
                      <li>• Natural consequence strategies</li>
                      <li>• Self-care and life enrichment</li>
                      <li>• Treatment invitation approaches (64-74% success rate)</li>
                    </ul>
                  </div>
                </div>
              </motion.section>

              {/* Benefits */}
              <motion.section initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                  <CheckCircle className="h-6 w-6 text-emerald-600 mr-3"/>
                  Why Choose Intensives?
                </h3>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="bg-emerald-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <Clock className="h-8 w-8 text-emerald-600"/>
                    </div>
                    <h4 className="text-lg font-semibold text-slate-900 mb-2">Faster Results</h4>
                    <p className="text-slate-600">2-4 weeks instead of 6-8 months of traditional therapy</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <Shield className="h-8 w-8 text-blue-600"/>
                    </div>
                    <h4 className="text-lg font-semibold text-slate-900 mb-2">Research-Backed</h4>
                    <p className="text-slate-600">Evidence-based approaches proven effective in intensive formats</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <Award className="h-8 w-8 text-purple-600"/>
                    </div>
                    <h4 className="text-lg font-semibold text-slate-900 mb-2">Focused Healing</h4>
                    <p className="text-slate-600">Uninterrupted progress without weekly gaps</p>
                  </div>
                </div>
              </motion.section>

              {/* CTA */}
              <motion.section initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-gradient-to-r from-emerald-600 to-blue-700 rounded-xl p-8 text-white text-center">
                <h3 className="text-2xl font-bold mb-4">Ready to Transform Your Healing Journey?</h3>
                <p className="text-emerald-100 mb-6 max-w-2xl mx-auto">
                  Begin with a 15-minute consultation to determine if therapy intensives are right for you.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button className="bg-white text-emerald-600 px-8 py-3 rounded-full font-semibold hover:bg-emerald-50">
                    <Calendar className="mr-2 h-5 w-5"/>
                    Schedule Consultation
                  </Button>
                  <Button variant="outline" className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-emerald-600 bg-transparent" onClick={onClose}>
                    <span className="text-white hover:text-emerald-600">View All Intensives</span>
                  </Button>
                </div>
              </motion.section>
            </div>
          </motion.div>
        </motion.div>)}
    </AnimatePresence>);
}
