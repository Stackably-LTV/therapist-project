'use client';
import { motion } from "framer-motion";
import { Button } from "@/components/2795b661f080";
import { Target, CheckCircle, Award, Phone, Zap } from "lucide-react";
import TherapyIntensivesModal from "@/components/47fed22e4cb0";
import { useState, useEffect } from "react";
import Image from "next/image";
export default function Intensives() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [particles, setParticles] = useState([]);
    useEffect(() => {
        // Generate random positions only on client side
        setParticles(Array.from({ length: 20 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            top: Math.random() * 100,
            delay: Math.random() * 10,
            duration: 20 + Math.random() * 15
        })));
    }, []);
    const treatments = [
        {
            name: "PTSD Intensives",
            subtitle: "Cognitive Processing Therapy (CPT)",
            duration: "6-12 hours over 2-4 weeks",
            description: "Evidence-based treatment for PTSD that helps individuals identify and challenge unhelpful beliefs related to their trauma. Through structured writing and cognitive exercises, CPT supports people in understanding how the trauma has affected their thoughts, emotions, and behaviors—so they can begin to heal and regain a sense of safety and control.",
            features: [
                "Education about PTSD and how thoughts influence recovery",
                "Identifying \"Stuck Points\"—unhelpful or inaccurate beliefs related to the trauma",
                "Cognitive Restructuring to develop more balanced realistic thinking pattern",
                "Skill Development to support long-term emotional and behavioral change",
                "Homework assignments- To practice cognitive skills and reinforce progress between sessions"
            ],
            research: "CPT is one of the most effective treatments for PTSD, with extensive research support from the VA and Department of Defense showing significant symptom reduction.",
            eligibility: "Most people with PTSD benefit from CPT. May not be effective if currently struggling with significant addiction or on 4+ psychiatric medications."
        },
        {
            name: "Trauma Intensives",
            subtitle: "Prolonged Exposure (PE)",
            duration: "6-12 hours over 2-4 weeks",
            description: "PE helps individuals gradually confront trauma-related memories, feelings, and situations they've been avoiding, so distress decreases over time.",
            features: [
                "Psychoeducation about trauma, PTSD, and avoidance",
                "Imaginal Exposure: Repeatedly recounting trauma memory safely",
                "In Vivo Exposure: Gradually confronting avoided situations",
                "Processing: Reflecting on exposure experience",
                "Homework Assignments to practice exposures"
            ],
            research: "PE is one of the most thoroughly researched treatments for PTSD, recognized by major organizations like the APA and Department of Veterans Affairs.",
            eligibility: "Most people struggling with trauma benefit from PE. May not be effective if currently struggling with significant addiction or on 4+ psychiatric medications."
        },
        {
            name: "OCD Intensives",
            subtitle: "Exposure and Response Prevention (ERP)",
            duration: "6-12 hours over 2-4 weeks",
            description: "ERP involves gradually facing feared thoughts or situations while resisting compulsive behaviors, helping reduce anxiety over time.",
            features: [
                "Exposure to feared thoughts/situations in structured way",
                "Response Prevention by resisting compulsions",
                "Hierarchy Development ranking triggers from least to most distressing",
                "Repetition and Practice to build tolerance",
                "Guided Support to process emotions and progress"
            ],
            research: "ERP is widely considered the gold-standard treatment for OCD, with decades of research showing significant symptom reduction.",
            eligibility: "Most people struggling with OCD benefit from ERP. May not be effective if currently struggling with significant addiction or on 4+ psychiatric medications."
        },
        {
            name: "CRAFT Intensives",
            subtitle: "For Families Affected by Addiction",
            duration: "6-12 hours over 2-4 weeks",
            description: "CRAFT helps family members support someone with substance use issues without confrontation, while improving their own well-being.",
            features: [
                "Positive Communication Skills to reduce conflict",
                "Reinforcement of Sober Behavior through natural rewards",
                "Allowing Natural Consequences instead of enabling",
                "Self-Care and Life Enrichment for family members",
                "Treatment Invitation Strategies without pressure"
            ],
            research: "CRAFT is well-researched and endorsed by NIDA, with 64-74% of individuals entering treatment when family members use CRAFT.",
            eligibility: "Right for you if struggling with how to respond to a loved one abusing substances and need guidance on being more effective."
        }
    ];
    const pricing = [
        { hours: 6, price: "$1,500", description: "6 hour Intensive", recommended: false },
        { hours: 9, price: "$2,250", description: "9 hour Intensive", recommended: false },
        { hours: 12, price: "$3,000", description: "12 hour Intensive", recommended: true, note: "Recommended for maximum benefit for trauma" }
    ];
    const faqs = [
        {
            question: "How does Intensive Therapy work?",
            answer: "We start with a Pre-Intensive Interview to determine goals and understand your history. During the Intensive, we engage in targeted, skill-based solutions you'll practice in daily life. At the end, we address aftercare and help you become your own therapist."
        },
        {
            question: "How long are intensives?",
            answer: "Intensive sessions are typically 3 hours long. Therapy lasts 2-4 intensive sessions spanned across 1-4 weeks, with 2 weeks being the recommendation."
        },
        {
            question: "What is the cost?",
            answer: "We offer three intensive options: 6-hour intensive for $1,500, 9-hour intensive for $2,250, and 12-hour intensive for $3,000 (recommended). All sessions are $250 per hour and include comprehensive evidence-based treatment. $300 per hour for after hours."
        },
        {
            question: "Can I use insurance?",
            answer: "Therapy Intensives are not covered by insurance. However, we can help you utilize your out-of-network benefits to obtain reimbursement for a portion of the intensive. We also have different payment plans through partners like Affirm, CareCredit, and Fanbasis to fit your individual needs."
        },
        {
            question: "Can intensives be done online?",
            answer: "Yes. We offer telehealth services for those unable to come into the office, available for PsyPact states."
        },
        {
            question: "What if I already have a therapist?",
            answer: "Of course. Once the intensives are completed, you can return to your regular therapy."
        },
        {
            question: "What if I am not sure about intensives?",
            answer: "No problem. We can schedule a 15-minute consultation to determine if they are right for you."
        },
        {
            question: "Where do the intensives take place?",
            answer: "Intensives can take place in our office in Bethlehem, PA or online if you live in a PsyPact state."
        }
    ];
    return (<div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-white to-slate-50 relative overflow-hidden">
        {/* Background Particles */}
        {particles.length > 0 && (<div className="absolute inset-0 pointer-events-none z-0">
            {particles.map((particle) => (<div key={particle.id} className="absolute animate-float-particles-slow opacity-10" style={{
                    left: `${particle.left}%`,
                    top: `${particle.top}%`,
                    animationDelay: `${particle.delay}s`,
                    animationDuration: `${particle.duration}s`
                }}>
                <div className="w-1 h-1 bg-emerald-400 rounded-full particle-glow-subtle"></div>
              </div>))}
          </div>)}
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-[hsl(var(--midnight))] mb-6">
              Therapy Intensives
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
              You've spent enough time going over the same problems, stuck in the same patterns—and nothing changes. 
              You're ready for something different.
            </p>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Not months of theory, but practical tools you can use now—to feel better, connect more deeply, and finally move forward.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Why Intensives Work */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
              <h2 className="text-4xl font-bold text-[hsl(var(--midnight))] mb-6">Why Intensives Work</h2>
              <p className="text-lg text-slate-600 mb-8">
                Traditional therapy can take months or years. Intensives accelerate progress by providing targeted, 
                evidence-based treatments in a condensed timeframe. No need to clear your schedule each week for therapy.
              </p>
              
              <div className="space-y-6">
                <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0 }} className="flex items-start space-x-4">
                  <div className="bg-[hsl(var(--lavender))] w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Zap className="text-white" size={16}/>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[hsl(var(--midnight))] mb-2">Accelerated Results</h3>
                    <p className="text-slate-600">Complete Trauma, OCD, or CRAFT treatment in 2-4 weeks instead of 6-8 months</p>
                  </div>
                </motion.div>
                
                <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="flex items-start space-x-4">
                  <div className="bg-[hsl(var(--lavender))] w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Target className="text-white" size={16}/>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[hsl(var(--midnight))] mb-2">Focused Immersion</h3>
                    <p className="text-slate-600">Uninterrupted work without weeks between sessions</p>
                  </div>
                </motion.div>
                
                <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="flex items-start space-x-4">
                  <div className="bg-[hsl(var(--lavender))] w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Award className="text-white" size={16}/>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[hsl(var(--midnight))] mb-2">Skill Building</h3>
                    <p className="text-slate-600">Learn skills and tools you can take with you for lasting transformation</p>
                  </div>
                </motion.div>
              </div>
              
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }}>
                <Button onClick={() => window.open('https://api.leadconnectorhq.com/widget/bookings/phillip-pellegrino-personal-calendar--nwkqht7c', '_blank')} className="mt-8 bg-[hsl(var(--midnight))] text-white px-8 py-4 rounded-full font-semibold glow-on-hover hover:bg-[hsl(var(--midnight))]">
                  Schedule Consultation
                </Button>
              </motion.div>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="relative">
              <Image src="https://images.unsplash.com/photo-1586880244406-556ebe35f282?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600" alt="Modern therapy office with comfortable seating" className="rounded-2xl shadow-xl w-full h-auto" width={800} height={600}/>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Treatment Options */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[hsl(var(--midnight))] mb-6">
              Treatment Options
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Evidence-based intensive treatments for trauma, OCD, and family support
            </p>
          </motion.div>

          <div className="space-y-12">
            {treatments.map((treatment, index) => (<motion.div key={index} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: index * 0.2 }} className="bg-white rounded-2xl p-8 shadow-lg border border-emerald-100">
                <div className="grid lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-2xl font-bold text-[hsl(var(--midnight))] mb-2">{treatment.name}</h3>
                    <h4 className="text-xl text-emerald-600 font-semibold mb-4">{treatment.subtitle}</h4>
                    <p className="text-slate-600 mb-6">{treatment.description}</p>
                    
                    <div className="mb-6">
                      <h5 className="font-semibold text-[hsl(var(--midnight))] mb-3">Core Components:</h5>
                      <ul className="space-y-2">
                        {treatment.features.map((feature, featureIndex) => (<li key={featureIndex} className="flex items-start space-x-3">
                            <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0"/>
                            <span className="text-slate-600">{feature}</span>
                          </li>))}
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl">
                      <h5 className="font-semibold text-[hsl(var(--midnight))] mb-2">Duration</h5>
                      <p className="text-slate-600">{treatment.duration}</p>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-xl">
                      <h5 className="font-semibold text-[hsl(var(--midnight))] mb-2">Research Support</h5>
                      <p className="text-slate-600 text-sm">{treatment.research}</p>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-xl">
                      <h5 className="font-semibold text-[hsl(var(--midnight))] mb-2">Is This Right for Me?</h5>
                      <p className="text-slate-600 text-sm">{treatment.eligibility}</p>
                    </div>
                  </div>
                </div>
              </motion.div>))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[hsl(var(--midnight))] mb-6">
              Investment in Your Healing
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Intensive sessions are $250 per session hour
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {pricing.map((option, index) => (<motion.div key={index} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: index * 0.1 }} className={`bg-white border-2 rounded-2xl p-8 text-center relative ${option.recommended ? 'border-emerald-600 shadow-lg scale-105' : 'border-slate-200'}`}>
                {option.recommended && (<div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                      Recommended
                    </span>
                  </div>)}
                
                <h3 className="text-2xl font-bold text-[hsl(var(--midnight))] mb-2">{option.description}</h3>
                <div className="text-4xl font-bold text-emerald-600 mb-4">{option.price}</div>
                <p className="text-slate-600 mb-6">{option.hours} hours of intensive therapy</p>
                {option.note && <p className="text-sm text-emerald-600 font-medium">{option.note}</p>}
              </motion.div>))}
          </div>

          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="text-center">
            <h3 className="text-2xl md:text-3xl font-bold text-[hsl(var(--midnight))] mb-8">
              Ask about our financing options
            </h3>
            
            <div className="flex justify-center items-center space-x-8 md:space-x-12">
              <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.5 }} className="grayscale hover:grayscale-0 transition-all duration-300">
                <Image src="/affirm_logo-transparent_bg_1753221198610.png" alt="Affirm Payment Plans" className="h-12 md:h-16 object-contain" width={200} height={64}/>
              </motion.div>
              
              <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.6 }} className="grayscale hover:grayscale-0 transition-all duration-300">
                <Image src="/fanbasis-logo_1753221202553.png" alt="FanBasis Payment Plans" className="h-12 md:h-16 object-contain" width={200} height={64}/>
              </motion.div>
              
              <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.7 }} className="grayscale hover:grayscale-0 transition-all duration-300">
                <Image src="/carecredit-logo_1753221422608.png" alt="CareCredit Payment Plans" className="h-40 md:h-48 object-contain" width={200} height={192}/>
              </motion.div>
            </div>
          </motion.div>


        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[hsl(var(--midnight))] mb-6">
              Frequently Asked Questions
            </h2>
          </motion.div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (<motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: index * 0.1 }} className="bg-white rounded-xl p-6 shadow-lg border border-emerald-100">
                <h3 className="text-lg font-semibold text-[hsl(var(--midnight))] mb-3">{faq.question}</h3>
                <p className="text-slate-600">{faq.answer}</p>
              </motion.div>))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-emerald-600">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Start Your Healing Journey?
            </h2>
            <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
              Begin with a 15-minute consultation to determine if intensives are right for you
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => window.open('https://api.leadconnectorhq.com/widget/bookings/phillip-pellegrino-personal-calendar--nwkqht7c', '_blank')} className="bg-white text-emerald-600 px-8 py-4 rounded-full text-lg font-bold hover:bg-emerald-50 transform hover:scale-105 transition-all duration-300 cursor-pointer">
                <Phone className="mr-2 h-5 w-5"/>
                Schedule Consultation
              </Button>
              <Button variant="outline" onClick={() => setIsModalOpen(true)} className="border-2 border-white text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white hover:text-emerald-600 transition-all duration-300 bg-transparent">
                Learn More
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
      
      <TherapyIntensivesModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}/>
    </div>);
}
