import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useEffect } from "react";
// Uses public/logo.png directly

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const { requestPermission } = usePushNotifications();

  useEffect(() => {
    // Subtle prompt for notifications on auth pages to prime the user
    // In a real flow, this might be better on Dashboard, but this ensures early capture
    // We only log if it fails, no blocking UI
    requestPermission().catch(console.error);
  }, [requestPermission]);

  return (
    <div className="min-h-screen w-full flex bg-black overflow-hidden relative selection:bg-primary/30">
      {/* Left Side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-hero">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute inset-0 bg-radial-glow" />

        {/* Animated Orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-[120px]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-accent/10 blur-[100px]"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link to="/" className="flex items-center gap-3 mb-12">
              <img src="/logo.png" alt="Hup" className="h-12 w-12 rounded-xl border border-white/20 shadow-lg shadow-primary/20" />
              <span className="font-display text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Hup</span>
            </Link>

            <h1 className="font-display text-4xl lg:text-5xl font-black mb-6 leading-tight text-white tracking-tight">
              Ascend to the<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-pink-500 animate-pulse">Social OS</span>
            </h1>
            <p className="text-lg text-gray-400 max-w-md font-light leading-relaxed">
              Sovereign identity. AI-powered connection. Real-world virality. <br />
              Welcome to the post-platform era.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="Hup" className="h-10 w-10 rounded-lg" />
              <span className="font-display text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Hup</span>
            </Link>
          </div>

          <div className="text-center mb-8">
            <h2 className="font-display text-2xl font-bold mb-2">{title}</h2>
            <p className="text-muted-foreground">{subtitle}</p>
          </div>

          {children}
        </motion.div>
      </div>
    </div>
  );
}
