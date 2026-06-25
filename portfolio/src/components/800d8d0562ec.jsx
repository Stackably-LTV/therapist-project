import { motion } from "framer-motion";
import { Brain, Crown, Heart } from "lucide-react";
import ServiceCard from "@/components/b8254bb26450";
export default function ServicesPreview() {
    return (<section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">

        
        <div className="grid md:grid-cols-3 gap-8">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}>
            <ServiceCard icon={Brain} title="Trauma Intensives" description="Accelerated healing with CPT & PE therapy. Complete treatment in days, not months." features={[
            "Cognitive Processing Therapy",
            "Prolonged Exposure Therapy",
            "Evidence-based treatment"
        ]} buttonText="Learn More" onButtonClick={() => window.location.href = '/Therapist-Allentown-PA'}/>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
            <ServiceCard icon={Crown} title="Concierge Care" description="Premium ongoing support with direct access to Dr. Pellegrino for continuous guidance and care." features={[
            "Two 15-minute consult calls per month",
            "24/7 access via messaging and email",
            "Direct communication with Dr. Pellegrino"
        ]} price="$500/month" buttonText="Start Concierge Care" buttonColor="bg-amber-600" iconBg="bg-amber-100" onButtonClick={() => window.open('https://buy.stripe.com/fZubJ26La7Asdbhe81fbq03', '_blank')}/>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}>
            <ServiceCard icon={Heart} title="Traditional Therapy" description="Weekly CBT sessions for anxiety, depression, and ongoing mental health support." features={[
            "Cognitive Behavioral Therapy",
            "Anxiety & depression treatment",
            "Weekly sessions"
        ]} buttonText="Get Started" buttonColor="bg-emerald-600" iconBg="bg-[hsl(var(--muted-rose))]/30" onButtonClick={() => window.open('https://api.leadconnectorhq.com/widget/bookings/phillip-pellegrino-personal-calendar--nwkqht7c', '_blank')}/>
          </motion.div>
        </div>
      </div>
    </section>);
}
