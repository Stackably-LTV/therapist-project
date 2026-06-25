import { motion } from "framer-motion";
import { Button } from "@/components/2795b661f080";
import { Check } from "lucide-react";
export default function ServiceCard({ icon: Icon, title, description, features, price, buttonText, buttonColor = "bg-[hsl(var(--lavender))]", iconBg = "bg-[hsl(var(--lavender))]/10", featured = false, onButtonClick, paymentOptions }) {
    return (<motion.div whileHover={{ y: -5 }} className={`glass-card rounded-2xl p-8 glow-on-hover cursor-pointer ${featured ? 'border-2 border-[hsl(var(--lavender))]/20' : ''}`}>
      <div className={`${iconBg} w-16 h-16 rounded-full flex items-center justify-center mb-6 icon-holographic`}>
        <Icon className="text-[hsl(var(--lavender))] text-2xl icon-3d icon-float icon-magnetic icon-particles icon-glow-enhanced icon-extruded" size={32}/>
      </div>
      
      <h3 className="text-2xl font-semibold text-[hsl(var(--midnight))] mb-4">{title}</h3>
      
      <p className="text-slate-600 mb-6">{description}</p>
      
      {price && (<div className="text-2xl font-bold text-[hsl(var(--lavender))] mb-4">{price}</div>)}
      
      <ul className="text-sm text-slate-500 mb-6 space-y-2">
        {features.map((feature, index) => (<li key={index} className="flex items-center">
            <Check className="text-[hsl(var(--lavender))] mr-2 h-4 w-4 icon-3d icon-glow-enhanced icon-extruded"/>
            {feature}
          </li>))}
      </ul>
      
      {paymentOptions ? (<div className="space-y-3">
          {paymentOptions.map((option, index) => (<Button key={index} onClick={() => window.open(option.link, '_blank')} className={`w-full ${buttonColor} text-white py-3 rounded-full font-medium hover:opacity-90 transition-opacity`}>
              {option.hours} - {option.price}
            </Button>))}
        </div>) : (<Button onClick={onButtonClick} className={`w-full ${buttonColor} text-white py-3 rounded-full font-medium hover:opacity-90 transition-opacity`}>
          {buttonText}
        </Button>)}
    </motion.div>);
}
