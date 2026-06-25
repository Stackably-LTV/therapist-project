'use client';
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
export default function FloatingCTA() {
    return (<motion.button onClick={() => window.open('https://api.leadconnectorhq.com/widget/bookings/phillip-pellegrino-personal-calendar--nwkqht7c', '_blank')} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ delay: 1, type: "spring", stiffness: 260, damping: 20 }} className="fixed bottom-8 right-8 z-50 group cursor-pointer">
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-300 animate-pulse"></div>
        
        {/* Button */}
        <div className="relative flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white font-bold text-lg shadow-2xl">
          <Calendar className="h-5 w-5"/>
          <span>Book Now</span>
        </div>
      </div>
    </motion.button>);
}
