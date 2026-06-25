import { LandingContainer } from "@/components/ed29acce9eae";
export function Stats() {
    return (<section className="py-16 bg-gray-900 text-white">
      <LandingContainer>
        <div className="grid md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold mb-2">500+</div>
            <div className="text-gray-300">Licensed Therapists</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">10,000+</div>
            <div className="text-gray-300">Successful Sessions</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">98%</div>
            <div className="text-gray-300">Client Satisfaction</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">24/7</div>
            <div className="text-gray-300">Support Available</div>
          </div>
        </div>
      </LandingContainer>
    </section>);
}
