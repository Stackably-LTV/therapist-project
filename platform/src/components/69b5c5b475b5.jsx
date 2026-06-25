import { LandingContainer } from "@/components/ed29acce9eae";
export function HowItWorks() {
    const steps = [
        {
            step: "1",
            title: "Sign Up",
            description: "Create your account in minutes with a few simple steps.",
        },
        {
            step: "2",
            title: "Find Your Match",
            description: "Browse therapists or use our matching system to find the right fit.",
        },
        {
            step: "3",
            title: "Book a Session",
            description: "Schedule your first session at a time that works for you.",
        },
        {
            step: "4",
            title: "Start Your Journey",
            description: "Connect with your therapist and begin your path to wellness.",
        },
    ];
    return (<section className="py-20 bg-gray-50">
      <LandingContainer>
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Getting started with Psychlink is simple and straightforward.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {steps.map((item) => (<div key={item.step} className="text-center">
              <div className="w-16 h-16 bg-gray-900 text-white rounded-lg flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                {item.step}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {item.title}
              </h3>
              <p className="text-gray-600 text-sm">{item.description}</p>
            </div>))}
        </div>
      </LandingContainer>
    </section>);
}
