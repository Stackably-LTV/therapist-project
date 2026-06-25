import { Star } from "lucide-react";
import { LandingContainer } from "@/components/ed29acce9eae";
export function Testimonials() {
    const testimonials = [
        {
            name: "Sarah M.",
            role: "Client",
            rating: 5,
            text: "Psychlink made finding the right therapist so easy. My therapist truly understands me and I've made incredible progress in just a few months.",
        },
        {
            name: "Michael R.",
            role: "Client",
            rating: 5,
            text: "The flexibility to have sessions from home has been life-changing. The platform is secure and my therapist is professional and caring.",
        },
        {
            name: "Emily T.",
            role: "Client",
            rating: 5,
            text: "I was hesitant about online therapy, but Psychlink exceeded my expectations. The matching process found me the perfect therapist.",
        },
    ];
    return (<section className="py-20 bg-white">
      <LandingContainer>
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            What Our Clients Say
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Real stories from people who found support through Psychlink.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (<div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (<Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400"/>))}
              </div>
              <p className="text-gray-700 mb-4 italic">
                &quot;{testimonial.text}&quot;
              </p>
              <div>
                <div className="font-semibold text-gray-900">
                  {testimonial.name}
                </div>
                <div className="text-sm text-gray-600">{testimonial.role}</div>
              </div>
            </div>))}
        </div>
      </LandingContainer>
    </section>);
}
