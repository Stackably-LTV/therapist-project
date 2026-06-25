"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { LandingContainer } from "@/components/ed29acce9eae";
export function FAQ() {
    const [openIndex, setOpenIndex] = useState(null);
    const faqs = [
        {
            question: "How do I book a session?",
            answer: "Browse our therapist directory, select a therapist that fits your needs, and choose an available time slot to book your session. You can also use our matching system to find therapists based on your preferences.",
        },
        {
            question: "Is my information secure?",
            answer: "Yes, we use bank-level encryption and are HIPAA compliant. Your privacy and security are our top priorities. All sessions are encrypted end-to-end, and we never share your information with third parties.",
        },
        {
            question: "Do you accept insurance?",
            answer: "Many of our therapists accept various insurance plans. Check individual therapist profiles for specific insurance information. We also offer affordable self-pay rates for those without insurance.",
        },
        {
            question: "Can I cancel or reschedule?",
            answer: "Yes, you can cancel or reschedule sessions up to 24 hours before your appointment without any fees. Simply go to your dashboard and manage your appointments.",
        },
        {
            question: "What if I don't like my therapist?",
            answer: "We want you to find the right fit. If you're not satisfied with your therapist, you can easily switch to another therapist at any time. Our support team is here to help you find the perfect match.",
        },
        {
            question: "Are sessions confidential?",
            answer: "Absolutely. All sessions are completely confidential and protected by HIPAA regulations. Your therapist is bound by professional confidentiality standards, and we use secure, encrypted technology for all communications.",
        },
    ];
    return (<section className="py-20 bg-white">
      <LandingContainer>
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to know about Psychlink.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="space-y-4">
            {faqs.map((faq, index) => (<div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                <button onClick={() => setOpenIndex(openIndex === index ? null : index)} className="w-full px-6 py-4 text-center flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors">
                  <span className="font-semibold text-gray-900">{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform flex-shrink-0 ${openIndex === index ? "rotate-180" : ""}`}/>
                </button>
                {openIndex === index && (<div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <p className="text-gray-700 text-center">{faq.answer}</p>
                  </div>)}
              </div>))}
          </div>
        </div>
      </LandingContainer>
    </section>);
}
