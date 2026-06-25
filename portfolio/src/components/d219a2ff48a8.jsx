'use client';
import { motion } from "framer-motion";
import Link from "next/link";
export default function HIPAANotice() {
    return (<div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 py-20">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Link href="/" className="text-[hsl(var(--lavender))] hover:text-[hsl(var(--lavender))]/80 mb-8 transition-colors inline-block">
            ← Back to Home
          </Link>

          <h1 className="text-4xl md:text-5xl font-bold text-[hsl(var(--midnight))] mb-8">
            Notice of Privacy Practices
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            This notice describes how medical information about you may be used and disclosed and how you can get access to this information. Please review it carefully.
          </p>

          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-[hsl(var(--midnight))] mb-4">
                Effective Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </h2>
              <p className="text-slate-600 leading-relaxed">
                This Notice of Privacy Practices describes how Dr. Philip Pellegrino ("we," "our," or "us") may use and disclose your Protected Health Information (PHI) to carry out treatment, payment, or health care operations and for other purposes that are permitted or required by law. It also describes your rights regarding your PHI.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[hsl(var(--midnight))] mb-4">
                Our Legal Duty
              </h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                We are required by law to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-600 leading-relaxed">
                <li>Maintain the privacy of your Protected Health Information (PHI)</li>
                <li>Provide you with this notice of our legal duties and privacy practices</li>
                <li>Notify you following a breach of unsecured PHI</li>
                <li>Follow the terms of this notice</li>
              </ul>
              <p className="text-slate-600 leading-relaxed mt-4">
                We reserve the right to change our privacy practices and the terms of this notice at any time. We will provide you with a revised notice if we make material changes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[hsl(var(--midnight))] mb-4">
                Uses and Disclosures of Protected Health Information
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-[hsl(var(--midnight))] mb-3">
                    Treatment
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    We may use and disclose your PHI to provide, coordinate, or manage your health care and related services. For example, we may share information with other healthcare providers involved in your care, such as your primary care physician or specialists.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[hsl(var(--midnight))] mb-3">
                    Payment
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    We may use and disclose your PHI to obtain payment for services we provide to you. For example, we may send your health insurance plan information about services you received so they will pay us or reimburse you.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[hsl(var(--midnight))] mb-3">
                    Health Care Operations
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    We may use and disclose your PHI for our health care operations. These uses and disclosures are necessary to run our practice and ensure quality care. For example, we may use PHI to review our treatment and services and evaluate the performance of our staff.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[hsl(var(--midnight))] mb-3">
                    Other Uses and Disclosures
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    We may also use or disclose your PHI without your authorization in the following situations:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-slate-600 leading-relaxed">
                    <li><strong>As Required By Law:</strong> When required by federal, state, or local law</li>
                    <li><strong>Public Health:</strong> To report public health activities, such as disease prevention or reporting abuse</li>
                    <li><strong>Health Oversight:</strong> To health oversight agencies for audits, investigations, and inspections</li>
                    <li><strong>Judicial Proceedings:</strong> In response to a court order or subpoena</li>
                    <li><strong>Law Enforcement:</strong> To law enforcement officials as required by law or court order</li>
                    <li><strong>Serious Threat to Health or Safety:</strong> To prevent a serious threat to your health or safety or the health or safety of others</li>
                    <li><strong>Workers' Compensation:</strong> As authorized by workers' compensation laws</li>
                    <li><strong>Military and Veterans:</strong> To military authorities if you are a member of the armed forces</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[hsl(var(--midnight))] mb-4">
                Uses and Disclosures Requiring Your Authorization
              </h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                We must obtain your written authorization for the following uses and disclosures:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-600 leading-relaxed">
                <li>Psychotherapy notes (separate from treatment records)</li>
                <li>Marketing purposes</li>
                <li>Sale of PHI</li>
                <li>Most uses and disclosures of substance use disorder treatment records</li>
              </ul>
              <p className="text-slate-600 leading-relaxed mt-4">
                You may revoke your authorization at any time by submitting a written request. However, we cannot take back any uses or disclosures already made with your authorization.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[hsl(var(--midnight))] mb-4">
                Your Rights Regarding Your Protected Health Information
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-[hsl(var(--midnight))] mb-3">
                    Right to Request Restrictions
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    You have the right to request restrictions on certain uses and disclosures of your PHI. We are not required to agree to your request, but if we do, we will comply with your restrictions except in emergency situations.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[hsl(var(--midnight))] mb-3">
                    Right to Request Confidential Communications
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    You have the right to request that we communicate with you about health matters in a certain way or at a certain location. For example, you may request that we contact you only at work or by mail.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[hsl(var(--midnight))] mb-3">
                    Right to Inspect and Copy
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    You have the right to inspect and obtain a copy of your PHI that we maintain in your designated record set. We may charge a reasonable fee for copying and postage.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[hsl(var(--midnight))] mb-3">
                    Right to Request Amendment
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    You have the right to request that we amend your PHI if you believe it is incorrect or incomplete. We may deny your request under certain circumstances.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[hsl(var(--midnight))] mb-3">
                    Right to an Accounting of Disclosures
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    You have the right to receive an accounting of certain disclosures of your PHI made by us in the six years prior to your request. This does not include disclosures for treatment, payment, or health care operations.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[hsl(var(--midnight))] mb-3">
                    Right to a Paper Copy of This Notice
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    You have the right to receive a paper copy of this notice at any time, even if you have agreed to receive it electronically.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[hsl(var(--midnight))] mb-4">
                Complaints
              </h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                If you believe your privacy rights have been violated, you may file a complaint with us or with the Secretary of the U.S. Department of Health and Human Services. To file a complaint with us, contact us at the information below. You will not be penalized for filing a complaint.
              </p>
              <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                <p className="text-slate-700 font-medium mb-2">File a complaint with:</p>
                <p className="text-slate-600">U.S. Department of Health and Human Services</p>
                <p className="text-slate-600">Office for Civil Rights</p>
                <p className="text-slate-600">200 Independence Avenue, S.W.</p>
                <p className="text-slate-600">Washington, D.C. 20201</p>
                <p className="text-slate-600 mt-2">Phone: 1-877-696-6775</p>
                <p className="text-slate-600">Website: <a href="https://www.hhs.gov/hipaa" target="_blank" rel="noopener noreferrer" className="text-[hsl(var(--lavender))] hover:underline">www.hhs.gov/hipaa</a></p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[hsl(var(--midnight))] mb-4">
                Contact Information
              </h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                If you have questions about this notice or wish to exercise any of your rights, please contact:
              </p>
              <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                <p className="text-slate-700 font-medium">Dr. Philip Pellegrino</p>
                <p className="text-slate-600">Privacy Officer</p>
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
