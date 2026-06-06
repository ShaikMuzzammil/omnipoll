import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { BarChart3, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="w-24 h-24 rounded-2xl bg-terracotta/10 flex items-center justify-center mx-auto mb-6"
          animate={{ rotate: [0, -5, 5, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <BarChart3 className="w-12 h-12 text-terracotta" />
        </motion.div>
        <h1 className="font-playfair text-6xl font-bold text-charcoal mb-2">404</h1>
        <p className="text-xl text-slate mb-2">Page not found</p>
        <p className="text-slate max-w-sm mx-auto mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/">
          <Button className="bg-terracotta hover:bg-terracotta/90 text-white">
            <ArrowLeft size={16} className="mr-2" /> Go Home
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
