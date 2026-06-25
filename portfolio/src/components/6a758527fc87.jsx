'use client';
import { motion } from "framer-motion";
import { Brain, Crown, Target, Users } from "lucide-react";
import ServiceCard from "@/components/b8254bb26450";
import CTABanner from "@/components/1e8a37caa677";
import TherapyIntensivesModal from "@/components/47fed22e4cb0";
import { useState } from "react";
export default function Services() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    return (<div className="pt-20">
      <section className="py-20 bg-[hsl(var(--soft-white))]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center mb-16">
            <h1 className="text-5xl font-bold text-[hsl(var(--midnight))] mb-6">Our Services</h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Evidence-based intensive treatments for trauma, OCD, and family support
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}>
              <ServiceCard icon={Target} title="Therapy for OCD" description="Exposure and Response Prevention (ERP) therapy for OCD and related conditions." features={[
            "Flexible hours over 2-4 weeks",
            "Exposure and Response Prevention",
            "Hierarchy development",
            "Guided support and processing",
            "Skill building for long-term success"
        ]} buttonText="Book a Call" buttonColor="bg-pink-600" iconBg="bg-pink-100" onButtonClick={() => window.open('https://api.leadconnectorhq.com/widget/bookings/phillip-pellegrino-personal-calendar--nwkqht7c', '_blank')}/>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
              <ServiceCard icon={Brain} title="Therapy for Trauma" description="Evidence-based CPT and PE treatments to accelerate healing from trauma and PTSD." features={[
            "Flexible hours over 2-4 weeks",
            "Cognitive Processing Therapy (CPT)",
            "Prolonged Exposure Therapy (PE)",
            "Skill development and tools",
            "Individual sessions"
        ]} buttonText="Book a Call" buttonColor="bg-emerald-600" iconBg="bg-emerald-100" onButtonClick={() => window.open('https://api.leadconnectorhq.com/widget/bookings/phillip-pellegrino-personal-calendar--nwkqht7c', '_blank')}/>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}>
              <ServiceCard icon={Users} title="CRAFT therapy for families with Addiction" description="Evidence-based support for families affected by substance abuse, without confrontation or ultimatums." features={[
            "Flexible hours over 2-4 weeks",
            "Positive communication skills",
            "Natural consequence strategies",
            "Self-care and life enrichment",
            "Treatment invitation approaches"
        ]} buttonText="Book a Call" buttonColor="bg-blue-600" iconBg="bg-blue-100" onButtonClick={() => window.open('https://api.leadconnectorhq.com/widget/bookings/phillip-pellegrino-personal-calendar--nwkqht7c', '_blank')}/>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}>
              <ServiceCard icon={Crown} title="Concierge Care" description="Premium ongoing support with direct access to Dr. Pellegrino for continuous guidance and care." features={[
            "Two 15-minute consult calls per month",
            "24/7 access via messaging and email",
            "Personalized ongoing support",
            "Direct communication with Dr. Pellegrino",
            "Priority scheduling and response"
        ]} buttonText="Start Concierge Care" buttonColor="bg-amber-600" iconBg="bg-amber-100" onButtonClick={() => window.open('https://buy.stripe.com/fZubJ26La7Asdbhe81fbq03', '_blank')}/>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-3xl font-bold text-[hsl(var(--midnight))] mb-6">Why Choose Our Intensive Approach?</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4">Evidence-Based Treatment</h3>
                <p className="text-slate-600 mb-4">
                  All our intensive approaches are backed by rigorous scientific research and proven effective 
                  for trauma, OCD, and family support.
                </p>
                <ul className="space-y-2 text-slate-600">
                  <li>• CPT & PE: Gold-standard for PTSD by VA and DoD</li>
                  <li>• ERP: Considered gold-standard for OCD treatment</li>
                  <li>• CRAFT 64-74% treatment engagement rate</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4">Accelerated Results</h3>
                <p className="text-slate-600 mb-4">
                  Why spend months or years in traditional therapy when you can get results in weeks? 
                  Our intensive format provides focused, uninterrupted treatment.
                </p>
                <ul className="space-y-2 text-slate-600">
                  <li>• 2-4 weeks instead of 6-8 months</li>
                  <li>• Uninterrupted skill building</li>
                  <li>• Practical tools you can use immediately</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      
      <CTABanner />
      
      <TherapyIntensivesModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}/>
    </div>);
}
