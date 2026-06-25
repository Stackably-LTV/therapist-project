import { Shield, UserCheck, Clock } from "lucide-react";
import { LandingContainer } from "@/components/ed29acce9eae";
export function WhyPsycheconnect() {
    const features = [
        {
            icon: Shield,
            title: "Secure & Private",
            description: "End-to-end encrypted sessions with HIPAA-aligned safeguards.",
        },
        {
            icon: UserCheck,
            title: "Licensed Clinicians",
            description: "Licensed clinicians with specialized training across age groups and conditions.",
        },
        {
            icon: Clock,
            title: "Flexible Scheduling",
            description: "24/7 booking, quick rescheduling, and reminders that keep care consistent.",
        },
    ];
    return (<section className="py-20 bg-white">
      <LandingContainer>
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Why Psychlink?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A secure, modern care experience that connects you with the right
            clinician faster.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (<div key={feature.title} className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Icon className="text-gray-700 w-6 h-6"/>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>);
        })}
        </div>
      </LandingContainer>
    </section>);
}
