'use client';
import { motion } from "framer-motion";
import Link from "next/link";
export default function PrivacyPolicy() {
    return (<div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 py-20">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Link href="/" className="text-[hsl(var(--lavender))] hover:text-[hsl(var(--lavender))]/80 mb-8 transition-colors inline-block">
            ← Back to Home
          </Link>

          <h1 className="text-4xl md:text-5xl font-bold text-[hsl(var(--midnight))] mb-8">
            Privacy Policy
          </h1>

          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-[hsl(var(--midnight))] mb-4">
                Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Dr. Philip Pellegrino ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our therapy services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[hsl(var(--midnight))] mb-4">
                1. Information We Collect
              </h2>
              <div className="text-slate-600 leading-relaxed space-y-4">
                <p><strong>Personal Information:</strong> We may collect personal information that you voluntarily provide to us, including but not limited to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Name, email address, phone number, and mailing address</li>
                  <li>Medical and mental health history</li>
                  <li>Insurance information</li>
                  <li>Payment information</li>
                  <li>Emergency contact information</li>
                </ul>
                <p><strong>Automatically Collected Information:</strong> When you visit our website, we may automatically collect certain information about your device, including IP address, browser type, and usage patterns.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[hsl(var(--midnight))] mb-4">
                2. How We Use Your Information
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-slate-600 leading-relaxed">
                <li>To provide, maintain, and improve our therapy services</li>
                <li>To schedule and manage appointments</li>
                <li>To process payments and insurance claims</li>
                <li>To communicate with you about your treatment</li>
                <li>To comply with legal and regulatory requirements</li>
                <li>To improve our website and user experience</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[hsl(var(--midnight))] mb-4">
                3. Health Information Protection
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Your health information is protected under the Health Insurance Portability and Accountability Act (HIPAA). We maintain strict confidentiality and security measures to protect your Protected Health Information (PHI). Please see our HIPAA Notice for more details about how we handle your health information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[hsl(var(--midnight))] mb-4">
                4. Information Sharing and Disclosure
              </h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-600 leading-relaxed">
                <li>With your explicit written consent</li>
                <li>To comply with legal obligations or court orders</li>
                <li>To prevent harm to yourself or others</li>
                <li>With service providers who assist in our operations (under strict confidentiality agreements)</li>
                <li>For treatment, payment, or healthcare operations as permitted by HIPAA</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[hsl(var(--midnight))] mb-4">
                5. Data Security
              </h2>
              <p className="text-slate-600 leading-relaxed">
                We implement appropriate technical and organizational security measures to protect your information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[hsl(var(--midnight))] mb-4">
                6. Your Rights
              </h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-600 leading-relaxed">
                <li>Access and receive a copy of your health records</li>
                <li>Request amendments to your records</li>
                <li>Request restrictions on how we use or disclose your information</li>
                <li>Request confidential communications</li>
                <li>File a complaint if you believe your privacy rights have been violated</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[hsl(var(--midnight))] mb-4">
                7. Cookies and Tracking Technologies
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Our website may use cookies and similar tracking technologies to enhance your experience. You can control cookie preferences through your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[hsl(var(--midnight))] mb-4">
                8. Children's Privacy
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Our services are not directed to individuals under 18 years of age. We do not knowingly collect personal information from children without parental consent.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[hsl(var(--midnight))] mb-4">
                9. Changes to This Privacy Policy
              </h2>
              <p className="text-slate-600 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[hsl(var(--midnight))] mb-4">
                10. Contact Us
              </h2>
              <p className="text-slate-600 leading-relaxed">
                If you have questions or concerns about this Privacy Policy, please contact us at:
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
