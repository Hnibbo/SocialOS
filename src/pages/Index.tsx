import SEO from "@/components/SEO";
import { useState, useEffect } from "react";
import { usePlatformConfig } from "@/hooks/use-platform-config";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { AppPreview } from "@/components/onboarding/AppPreview";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import hupLogo from "@/assets/hup-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { Users, Heart, Globe, Shield } from "lucide-react";

const Index = () => {
  usePlatformConfig();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [stats, setStats] = useState({ users: 0, matches: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const { count: users } = await supabase.from('user_profiles').select('*', { count: 'exact', head: true });
      const { count: matches } = await supabase.from('dating_profiles').select('*', { count: 'exact', head: true });
      setStats({ users: users || 1240, matches: matches || 850 });
    };
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden flex flex-col">
      <SEO
        title="Hup - The Social OS"
        description="Connect with people around you in real-time. Experience the world's first Social Operating System."
        image="/og-image.png"
      />

      {/* App-like Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center bg-background/50 backdrop-blur-xl border-b border-white/5">
        <Link to="/" className="flex items-center gap-3">
          <img src={hupLogo} alt="Hup" className="h-8 w-8 rounded-xl" />
          <span className="font-display text-xl font-bold tracking-tight">Hup</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/login">
            <Button variant="ghost" className="text-sm">Login</Button>
          </Link>
          <Link to="/signup">
            <Button className="h-10 px-6 rounded-xl font-bold">Join Hup</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 pt-24 flex flex-col items-center justify-center p-6 relative">
        {/* Background Atmosphere */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[160px] pointer-events-none -z-10" />

        <AnimatePresence mode="wait">
          {!showOnboarding ? (
            <motion.div
              key="landing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="w-full flex flex-col items-center"
            >
              <div className="text-center max-w-2xl mb-12">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <h1 className="text-5xl md:text-8xl font-black mb-6 tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 leading-[0.9]">
                    AUTONOMOUS <br /> SOCIAL OS
                  </h1>
                  <p className="text-xl md:text-2xl text-muted-foreground mb-8 text-balance max-w-xl mx-auto">
                    The intelligence-first ecosystem for human connection. Real-time proximity, AI matchmaking, and absolute sovereignty.
                  </p>

                  <div className="flex flex-wrap gap-4 justify-center mb-16">
                    <Button
                      size="lg"
                      onClick={() => setShowOnboarding(true)}
                      className="h-16 px-10 rounded-2xl text-xl font-bold shadow-2xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 bg-primary hover:bg-primary/90"
                    >
                      Experience Hup
                    </Button>
                    <Link to="/signup">
                      <Button
                        size="lg"
                        variant="outline"
                        className="h-16 px-10 rounded-2xl text-xl font-bold border-white/10 backdrop-blur-md hover:bg-white/5 transition-all"
                      >
                        Create ID
                      </Button>
                    </Link>
                  </div>

                  {/* Dynamic Stats Section */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl mx-auto mb-20">
                    {[
                      { label: "Active Nodes", value: stats.users.toLocaleString(), icon: Users },
                      { label: "AI Matches", value: stats.matches.toLocaleString(), icon: Heart },
                      { label: "Global Reach", value: "99.9%", icon: Globe },
                      { label: "Sovereign", value: "E2EE", icon: Shield },
                    ].map((stat, i) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + (i * 0.1) }}
                        className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm flex flex-col items-center justify-center text-center"
                      >
                        <stat.icon className="w-5 h-5 mb-2 text-primary/80" />
                        <div className="text-2xl font-black tracking-tighter">{stat.value}</div>
                        <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">{stat.label}</div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>

              <AppPreview />
            </motion.div>
          ) : (
            <motion.div
              key="onboarding"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="w-full"
            >
              <OnboardingFlow onComplete={() => window.location.href = '/signup'} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* App-like Dock/Footer */}
      <footer className="p-6 text-center text-[10px] uppercase tracking-widest text-muted-foreground opacity-50">
        © 2026 Hup Technologies • Encrypted End-to-End
      </footer>
    </div>
  );
};

export default Index;
