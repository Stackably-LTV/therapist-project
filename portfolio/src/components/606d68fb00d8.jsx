import { motion } from "framer-motion";
import { Button } from "@/components/2795b661f080";
import { Zap, Target, Award } from "lucide-react";
export default function IntensivesDetail() {
    const benefits = [
        {
            icon: Zap,
            title: "Accelerated Results",
            description: "Complete Trauma, OCD, or CRAFT treatment in 2-4 weeks instead of 6-8 months"
        },
        {
            icon: Target,
            title: "Focused Immersion",
            description: "Uninterrupted work without weeks between sessions"
        },
        {
            icon: Award,
            title: "Skill Building",
            description: "Learn skills and tools you can take with you for lasting transformation"
        }
    ];
    return (<section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
            <h2 className="text-4xl font-bold text-[hsl(var(--midnight))] mb-6">Why Intensives Work</h2>
            <p className="text-lg text-slate-600 mb-8">
              Traditional therapy can take months or years. Intensives accelerate progress by providing targeted, 
              evidence-based treatments in a condensed timeframe. No need to clear your schedule each week for therapy.
            </p>
            
            <div className="space-y-6">
              {benefits.map((benefit, index) => (<motion.div key={index} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: index * 0.2 }} className="flex items-start space-x-4">
                  <div className="bg-[hsl(var(--lavender))] w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <benefit.icon className="text-white" size={16}/>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[hsl(var(--midnight))] mb-2">{benefit.title}</h3>
                    <p className="text-slate-600">{benefit.description}</p>
                  </div>
                </motion.div>))}
            </div>
            
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }}>
              <Button className="mt-8 bg-[hsl(var(--midnight))] text-white px-8 py-4 rounded-full font-semibold glow-on-hover hover:bg-[hsl(var(--midnight))]">
                Schedule Consultation
              </Button>
            </motion.div>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="relative">
            <img src="https://images.unsplash.com/photo-1586880244406-556ebe35f282?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600" alt="Modern therapy office with comfortable seating" className="rounded-2xl shadow-xl w-full h-auto"/>
            

          </motion.div>
        </div>
      </div>
    </section>);
}
