'use client';
import { motion } from "framer-motion";
import Link from "next/link";
export default function TermsOfService() {
    return (<div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 py-20">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Link href="/" className="text-[hsl(var(--lavender))] hover:text-[hsl(var(--lavender))]/80 mb-8 transition-colors inline-block">
            ← Back to Home
          </Link>

          <h1 className="text-4xl md:text-5xl font-bold text-[hsl(var(--midnight))] mb-8">
            Terms of Service
          </h1>

          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-[hsl(var(--midnight))] mb-4">
                Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Please read these Terms of Service ("Terms") carefully before using the services provided by Dr. Philip Pellegrino ("we," "our," or "us"). By accessing or using our services, you agree to be bound by these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[hsl(var(--midnight))] mb-4">
                1. Acceptance of Terms
              </h2>
              <p className="text-slate-600 leading-relaxed">
                By accessing this website and using our therapy services, you acknowledge that you have read, understood, and agree to be bound by these Terms and all applicable laws and regulations. If you do not agree with any of these Terms, you are prohibited from using our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[hsl(var(--midnight))] mb-4">
                2. Services Description
              </h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Dr. Philip Pellegrino provides professional psychological therapy services, including but not limited to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-600 leading-relaxed">
                <li>Trauma-focused intensive therapy (CPT, PE)</li>
                <li>OCD treatment using ERP</li>
                <li>Anxiety and depression therapy</li>
                <li>CRAFT family therapy</li>
                <li>Traditional weekly therapy sessions</li>
                <li>Concierge care services</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[hsl(var(--midnight))] mb-4">
                3. Professional Services
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Our therapy services are provided by licensed professionals. While we strive to provide the highest quality care, therapy outcomes may vary. Our services do not constitute a guarantee of specific results. Therapy is a collaborative process that requires active participation from both the therapist and client.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[hsl(var(--midnight))] mb-4">
                4. Medical Emergency Disclaimer
              </h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                <strong>IMPORTANT:</strong> Our services are not intended for medical emergencies. If you are experiencing a mental health emergency, including thoughts of self-harm or harm to others, please:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-600 leading-relaxed">
                <li>Call 911 immediately</li>
                <li>Go to your nearest emergency room</li>
                <li>Contact the National Suicide Prevention Lifeline at 988</li>
                <li>Contact the Crisis Text Line by texting HOME to 741741</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[hsl(var(--midnight))] mb-4">
                5. Appointment Scheduling and Cancellation
              </h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Appointments are scheduled through our online booking system. You agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-600 leading-relaxed">
                <li>Provide accurate and complete information when scheduling</li>
                <li>Arrive on time for scheduled appointments</li>
                <li>Cancel appointments at least 24 hours in advance when possible</li>
                <li>Pay cancellation fees as outlined in our cancellation policy</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[hsl(var(--midnight))] mb-4">
                6. Payment Terms
              </h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Payment is due at the time of service unless other arrangements have been made. We accept:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-600 leading-relaxed">
                <li>Cash, check, or credit card</li>
                <li>Insurance (subject to verification and coverage)</li>
                <li>Payment plans may be available for intensive programs</li>
              </ul>
              <p className="text-slate-600 leading-relaxed mt-4">
                You are responsible for any fees not covered by insurance, including copays, deductibles, and coinsurance.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[hsl(var(--midnight))] mb-4">
                7. Confidentiality
              </h2>
              <p className="text-slate-600 leading-relaxed">
                All therapy sessions are confidential in accordance with HIPAA and professional ethical standards. We will not disclose your information except as required by law, with your written consent, or in situations involving imminent harm to yourself or others. Please see our Privacy Policy and HIPAA Notice for more details.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[hsl(var(--midnight))] mb-4">
                8. Intellectual Property
              </h2>
              <p className="text-slate-600 leading-relaxed">
                All content on this website, including text, graphics, logos, and images, is the property of Dr. Philip Pellegrino or its content suppliers and is protected by copyright and other intellectual property laws. You may not reproduce, distribute, or create derivative works without our written permission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[hsl(var(--midnight))] mb-4">
                9. Limitation of Liability
              </h2>
              <p className="text-slate-600 leading-relaxed">
                To the fullest extent permitted by law, Dr. Philip Pellegrino shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[hsl(var(--midnight))] mb-4">
                10. Indemnification
              </h2>
              <p className="text-slate-600 leading-relaxed">
                You agree to indemnify and hold harmless Dr. Philip Pellegrino, its employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from your use of our services or violation of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[hsl(var(--midnight))] mb-4">
                11. Modifications to Terms
              </h2>
              <p className="text-slate-600 leading-relaxed">
                We reserve the right to modify these Terms at any time. We will notify you of any material changes by posting the updated Terms on this page. Your continued use of our services after such modifications constitutes acceptance of the updated Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[hsl(var(--midnight))] mb-4">
                12. Governing Law
              </h2>
              <p className="text-slate-600 leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the Commonwealth of Pennsylvania, without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[hsl(var(--midnight))] mb-4">
                13. Contact Information
              </h2>
              <p className="text-slate-600 leading-relaxed">
                If you have questions about these Terms of Service, please contact us:
              </p>
              <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                <p className="text-slate-700 font-medium">Dr. Philip Pellegrino</p>
                <p className="text-slate-600">Phone: (610) 936-8470</p>
                <p className="text-slate-600">Email: [Contact email]</p>
                <p className="text-slate-600">Address: Bethlehem, PA</p>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </div>);
}
