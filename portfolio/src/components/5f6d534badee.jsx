'use client';
import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
const testimonials = [
    {
        id: 1,
        content: "I had the privilege of working alongside Dr. Philip Pellegrino for six years. He was a trusted colleague to consult with on the most difficult of treatment cases. To both colleagues and patients, he provides compassionate and non-judgmental feedback. His sense of humor makes him incredibly approachable and a pleasure to work with. His high degree of intelligence was evident in consultation, as he maintained a remarkable balance of his own professional insight and research driven decisions. I have, and will continue, to refer any patient to him as I am fully confident he will provide the highest quality of care.",
        author: "Dr. Joanne Morth",
        credentials: "Psy.D.",
        rating: 5
    },
    {
        id: 2,
        content: "Dr. Pellegrino is an exceptionally professional and dedicated Psychologist with deep expertise in Cognitive-Behavioral Therapy. Their clinical work is grounded in research-based practice, and they consistently demonstrate strong ethical judgment, reliability, and attention to detail in every aspect of their work. Whether collaborating with colleagues or working with clients, Dr. Pellegrino brings a calm, organized, and focused presence that fosters trust and progress. I hold Dr. Pellegrino in the highest regard and would confidently recommend them to anyone seeking an effective and ethical Psychologist.",
        author: "Dr. Lauren Rudin",
        credentials: "Psy.D.",
        rating: 5
    },
    {
        id: 3,
        content: "Dr. Pellegrino is a highly professional and experienced Psychologist whose private practice reflects the highest standards of clinical care. Specializing in Cognitive-Behavioral Therapy, He provides a collaborative and structured, evidence-based treatment in a warm and focused environment where clients feel both validated and challenged. His practice is marked by strong professionalism, ethical integrity, and a deep respect for the therapeutic process. I confidently refer clients to his practice knowing they will receive focused, evidence-based care.",
        author: "Dr. Patrick R. Hoolahan",
        credentials: "Psy.D.",
        rating: 5
    }
];
export default function Testimonials() {
    const [particles, setParticles] = useState([]);
    useEffect(() => {
        // Generate random positions only on client side
        setParticles(Array.from({ length: 15 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            top: Math.random() * 100,
            delay: Math.random() * 10,
            duration: 20 + Math.random() * 15
        })));
    }, []);
    return (<section className="py-20 bg-gradient-to-br from-slate-50 to-purple-50 relative overflow-hidden">
      {/* Background Floating Particles */}
      {particles.length > 0 && (<div className="absolute inset-0 pointer-events-none z-0">
          {particles.map((particle) => (<div key={particle.id} className="absolute animate-float-particles-slow opacity-10" style={{
                    left: `${particle.left}%`,
                    top: `${particle.top}%`,
                    animationDelay: `${particle.delay}s`,
                    animationDuration: `${particle.duration}s`
                }}>
              <div className="w-1 h-1 bg-purple-400 rounded-full particle-glow-subtle"></div>
            </div>))}
        </div>)}

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-16">
          <div className="inline-flex items-center justify-center px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-6">
            <Quote className="w-4 h-4 mr-2"/>
            Professional Endorsements
          </div>

          <motion.h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
            What Fellow Professionals Say
          </motion.h2>
          
          <motion.p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Trusted recommendations from respected colleagues in the field of psychology
          </motion.p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (<motion.div key={testimonial.id} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: index * 0.2 }} className="relative group">
              {/* Testimonial Card */}
              <div className="relative bg-white rounded-2xl p-8 shadow-xl border border-purple-100 hover:shadow-purple-500/20 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-full">
                
                {/* Quote Icon */}
                <div className="absolute -top-4 left-8">
                  <div className="bg-purple-600 rounded-full p-3 shadow-lg">
                    <Quote className="h-6 w-6 text-white icon-3d icon-glow-enhanced"/>
                  </div>
                </div>

                {/* Rating Stars */}
                <div className="flex items-center space-x-1 mb-6 pt-4">
                  {[...Array(testimonial.rating)].map((_, i) => (<Star key={i} className="h-5 w-5 text-yellow-400 fill-current icon-3d icon-glow-enhanced"/>))}
                </div>

                {/* Testimonial Content */}
                <blockquote className="text-slate-700 text-lg leading-relaxed mb-8 italic">
                  "{testimonial.content}"
                </blockquote>

                {/* Author Info */}
                <div className="border-t border-purple-100 pt-6">
                  <div className="font-bold text-[hsl(var(--midnight))] text-lg">
                    {testimonial.author}
                  </div>
                  <div className="text-purple-600 font-semibold">
                    {testimonial.credentials}
                  </div>
                </div>

                {/* Subtle Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/5 to-purple-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              </div>
            </motion.div>))}
        </div>

        {/* Bottom CTA */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }} className="text-center mt-16">
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-purple-100 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-[hsl(var(--midnight))] mb-4">
              Skip the Waitlist for weekly therapy
            </h3>
            <p className="text-slate-600 mb-6">
              Learn more about therapy intensives with Dr. Phillip Pellegrino
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => window.open('https://api.leadconnectorhq.com/widget/bookings/phillip-pellegrino-personal-calendar--nwkqht7c', '_blank')} className="bg-emerald-600 text-white px-8 py-4 rounded-full text-lg font-bold glow-on-hover shadow-xl border-2 border-emerald-600 hover:bg-emerald-700 hover:border-emerald-700 transform hover:scale-105 transition-all duration-300 cursor-pointer">
                Schedule A Consult
              </button>
              <Link href="/Therapist-Allentown-PA">
                <button className="border-2 border-emerald-600 text-emerald-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-emerald-600 hover:text-white transition-all duration-300 cursor-pointer">
                  Learn More
                </button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>);
}
