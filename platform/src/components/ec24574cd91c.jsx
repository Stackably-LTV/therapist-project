import { Shield, Lock, Award, CheckCircle2 } from "lucide-react";
import { LandingContainer } from "@/components/ed29acce9eae";
export function TrustIndicators() {
    const items = [
        {
            icon: Shield,
            title: "HIPAA Compliant",
            description: "Fully compliant with healthcare privacy regulations",
        },
        {
            icon: Lock,
            title: "End-to-End Encryption",
            description: "Bank-level security for all communications",
        },
        {
            icon: Award,
            title: "Licensed Professionals",
            description: "Licensed clinicians with years of specialized experience.",
        },
        {
            icon: CheckCircle2,
            title: "Verified Platform",
            description: "Regularly audited and certified for security",
        },
    ];
    return (<section className="py-16 bg-gray-50">
      <LandingContainer>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Trusted & Secure
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Your privacy and security are our top priorities.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          {items.map((item) => {
            const Icon = item.icon;
            return (<div key={item.title} className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Icon className="text-gray-700 w-6 h-6"/>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>);
        })}
        </div>
      </LandingContainer>
    </section>);
}
