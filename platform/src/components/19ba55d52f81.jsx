import { UserCheck, Heart, Clock } from "lucide-react";
import { LandingContainer } from "@/components/ed29acce9eae";
export function HelpingBalance() {
    const benefits = [
        {
            icon: UserCheck,
            title: "Licensed Professionals",
            description: "Licensed clinicians with years of specialized experience.",
        },
        {
            icon: Heart,
            title: "Personalized Care",
            description: "Plans align therapy, medication management, and healthy habits for lasting change.",
        },
        {
            icon: Clock,
            title: "Flexible Scheduling",
            description: "Evening and weekend availability makes it easier to stay consistent.",
        },
    ];
    return (<section className="py-20 bg-gray-50">
      <LandingContainer>
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Helping you get back to balance
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Each care plan is intentionally crafted—whether the focus is
            anxiety, mood disorders, neurodivergence, or rebuilding daily
            routines.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (<div key={benefit.title} className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Icon className="text-gray-700 w-6 h-6"/>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">
                  {benefit.description}
                </p>
              </div>);
        })}
        </div>
      </LandingContainer>
    </section>);
}
