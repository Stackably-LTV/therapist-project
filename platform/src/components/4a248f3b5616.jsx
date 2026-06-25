import { LandingContainer } from "@/components/ed29acce9eae";
export default function PrivacyPolicyPage() {
    return (<section className="bg-white">
      <LandingContainer className="py-12 lg:py-16">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="mt-3 text-sm text-gray-500">Effective date: Jan 12, 2026</p>

          <div className="mt-10 space-y-8 text-gray-700 leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900">Overview</h2>
              <p>
                This Privacy Policy explains how Psychlink.pro collects, uses, shares, and protects
                your information when you use our website and services.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900">Information we collect</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <span className="font-medium">Account information</span>: name, email, role, and
                  other details you provide.
                </li>
                <li>
                  <span className="font-medium">Profile information</span>: optional details such as
                  preferences and a profile image.
                </li>
                <li>
                  <span className="font-medium">Usage information</span>: basic analytics and
                  interaction data to operate and improve the service.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900">How we use information</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Provide and maintain the Psychlink.pro platform.</li>
                <li>Enable scheduling, billing, messaging, and account features.</li>
                <li>Improve reliability, security, and user experience.</li>
                <li>Communicate service-related updates and support responses.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900">Sharing</h2>
              <p>We may share information in limited cases, such as:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <span className="font-medium">Service providers</span> who help us run the platform
                  (e.g., hosting, payments).
                </li>
                <li>
                  <span className="font-medium">Legal and safety</span> requirements (to comply with
                  law, enforce our terms, or protect rights and safety).
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900">Security</h2>
              <p>
                We use reasonable administrative, technical, and physical safeguards designed to
                protect your information. No method of transmission or storage is 100% secure.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900">Your choices</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Update certain account and profile information from your dashboard.</li>
                <li>Contact us to request access, correction, or deletion where applicable.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900">Contact</h2>
              <p>
                Questions about this policy? Email{" "}
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
