import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import hupLogo from "@/assets/hup-logo.png";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute inset-0 bg-radial-glow" />

      {/* Animated Orbs */}
      <motion.div
        className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-[120px]"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-accent/5 blur-[100px]"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 text-center px-4"
      >
        {/* Logo */}
        <Link to="/" className="inline-flex items-center gap-3 mb-8">
          <img src={hupLogo} alt="Hup" className="h-12 w-12 rounded-xl" />
          <span className="font-display text-2xl font-bold text-gradient">Hup</span>
        </Link>

        {/* 404 Display */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <h1 className="font-display text-8xl sm:text-9xl font-bold text-gradient mb-4">
            404
          </h1>
          <div className="w-24 h-1 mx-auto bg-gradient-primary rounded-full" />
        </motion.div>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-10"
        >
          <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">
            Page Not Found
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Oops! The page you're looking for doesn't exist or has been moved.
            Let's get you back on track.
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link to="/">
            <Button size="lg" className="bg-gradient-primary hover:opacity-90">
              <Home className="mr-2 w-5 h-5" />
              Back to Home
            </Button>
          </Link>
          <Link to="/docs">
            <Button size="lg" variant="outline">
              <Search className="mr-2 w-5 h-5" />
              View Docs
            </Button>
          </Link>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 pt-8 border-t border-border/50"
        >
          <p className="text-sm text-muted-foreground mb-4">Quick Links</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {[
              { href: "/dashboard", label: "Dashboard" },
              { href: "/login", label: "Sign In" },
              { href: "/signup", label: "Sign Up" },
              { href: "/docs", label: "Documentation" },
            ].map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
