import { motion } from "framer-motion";
export function FloatingShape({ className = "", delay = 0 }) {
    return (<motion.div className={`floating-shape absolute pointer-events-none ${className}`} animate={{
            y: [-20, 0, -20],
            rotate: [0, 5, 0],
        }} transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay,
        }}/>);
}
export default function FloatingShapes() {
    return (<div className="absolute inset-0 overflow-hidden pointer-events-none">
      <FloatingShape className="top-20 left-10 w-32 h-32 rounded-full opacity-60" delay={0}/>
      <FloatingShape className="top-40 right-20 w-24 h-24 rounded-lg rotate-45 opacity-40" delay={-2}/>
      <FloatingShape className="bottom-40 left-1/4 w-20 h-20 rounded-full opacity-50" delay={-4}/>
      <FloatingShape className="bottom-20 right-1/3 w-28 h-28 rounded-lg opacity-30" delay={-1}/>
    </div>);
}
