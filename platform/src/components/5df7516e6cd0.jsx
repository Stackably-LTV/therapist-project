import { LandingContainer } from "@/components/ed29acce9eae";
export default function TermsOfServicePage() {
    return (<section className="bg-white">
      <LandingContainer className="py-12 lg:py-16">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold text-gray-900">Terms of Service</h1>
          <p className="mt-3 text-sm text-gray-500">Effective date: Jan 12, 2026</p>

          <div className="mt-10 space-y-8 text-gray-700 leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900">Acceptance of terms</h2>
              <p>
                By accessing or using Psychlink.pro, you agree to these Terms. If you do not agree,
                do not use the service.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900">Using the service</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>You must provide accurate account information.</li>
                <li>You are responsible for maintaining the confidentiality of your login.</li>
                <li>You agree not to misuse the service or attempt unauthorized access.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900">No emergency services</h2>
              <p>
                Psychlink.pro is not an emergency service. If you are experiencing an emergency,
                call local emergency services immediately.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900">Payments</h2>
              <p>
                If you purchase paid services, you agree to pay applicable fees and taxes. Payment
                processing may be handled by third-party providers.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900">Content and communications</h2>
              <p>
                You retain rights to content you submit, but you grant Psychlink.pro a limited
                license to process it to operate the service. You are responsible for what you
                submit and communicate.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900">Termination</h2>
              <p>
                We may suspend or terminate access if we reasonably believe you violated these Terms
                or if needed to protect the service, users, or the public.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900">Disclaimers</h2>
              <p>
                The service is provided “as is” and “as available”. To the maximum extent permitted
                by law, Psychlink.pro disclaims warranties of any kind.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900">Limitation of liability</h2>
              <p>
                To the maximum extent permitted by law, Psychlink.pro will not be liable for any
                indirect, incidental, special, consequential, or punitive damages.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900">Changes</h2>
              <p>
                We may update these Terms from time to time. Continued use of the service after
                changes become effective constitutes acceptance of the updated Terms.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900">Contact</h2>
              <p>
                Questions about these Terms? Email{" "}
                <a className="text-primary underline underline-offset-4" href="mailto:support@psychlink.pro">
                  support@psychlink.pro
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </LandingContainer>
    </section>);
}
