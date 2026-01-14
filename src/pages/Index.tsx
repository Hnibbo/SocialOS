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
    <div className="min-h-screen bg-black text-foreground overflow-hidden flex flex-col relative">
      <SEO
        title="Hup - The Social OS"
        description="Connect with people around you in real-time. Experience the world's first Social Operating System."
        image="/og-image.png"
      />

      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.2),transparent_70%)]" />
        <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_100%,rgba(236,72,153,0.1),transparent_70%)]" />
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] bg-center" />
      </div>

      <main className="flex-1 flex flex-col items-center justify-between p-6 z-10 relative h-full">

        {/* Top: Logo & Branding */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-12 flex flex-col items-center"
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-accent p-0.5 shadow-2xl shadow-primary/20 mb-6">
            <div className="w-full h-full bg-black rounded-[22px] flex items-center justify-center">
              <img src={hupLogo} alt="Hup" className="w-12 h-12" />
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white mb-2">Social OS</h1>
          <p className="text-sm font-medium text-white/50 uppercase tracking-widest">Autonomous • Sovereign • Real</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!showOnboarding ? (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full flex-1 flex flex-col justify-end pb-12 items-center"
            >
              {/* Stats ticker */}
              <div className="mb-12 flex gap-8">
                <div className="text-center">
                  <div className="text-2xl font-black text-white">{stats.users.toLocaleString()}</div>
                  <div className="text-[10px] uppercase text-white/40 font-bold tracking-widest">Active Nodes</div>
                </div>
                <div className="w-px bg-white/10" />
                <div className="text-center">
                  <div className="text-2xl font-black text-white">{stats.matches.toLocaleString()}</div>
                  <div className="text-[10px] uppercase text-white/40 font-bold tracking-widest">Connections</div>
                </div>
              </div>

              <div className="w-full max-w-sm space-y-4">
                <Button
                  size="lg"
                  onClick={() => setShowOnboarding(true)}
                  className="w-full h-14 rounded-2xl text-lg font-bold bg-white text-black hover:bg-white/90 shadow-xl shadow-white/10"
                >
                  Create Identity
                </Button>

                <Link to="/login" className="block w-full">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full h-14 rounded-2xl text-lg font-bold border-white/10 hover:bg-white/5 bg-transparent"
                  >
                    Login
                  </Button>
                </Link>
              </div>

              <p className="mt-8 text-[10px] text-white/30 text-center max-w-xs leading-relaxed">
                By entering, you accept off-grid protocols and sovereign data ownership.
                <Link to="/terms" className="underline hover:text-white/50 ml-1">Terms</Link>
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="onboarding"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full flex-1 flex flex-col"
            >
              <div className="absolute top-6 left-0">
                <Button variant="ghost" onClick={() => setShowOnboarding(false)} className="text-white/50 hover:text-white">Back</Button>
              </div>
              <OnboardingFlow onComplete={() => window.location.href = '/signup'} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Index;
