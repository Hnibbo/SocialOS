import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, EyeOff, ShieldCheck, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function SafetyPanic() {
    const { user, refreshProfile } = useAuth();
    const [isPanic, setIsPanic] = useState(false);

    const handlePanic = async () => {
        if (!user) return;
        setIsPanic(true);

        try {
            // 1. Go invisible (visibility matrix)
            // 2. Set intent to quiet
            const { error } = await supabase
                .from("user_profiles")
                .update({
                    intent_signal: 'quiet',
                    visibility_matrix: { map: false, swipe: false, dating: false, nearby_chat: false }
                })
                .eq("id", user.id);

            if (error) throw error;
            await refreshProfile();
            toast.error("PANIC MODE ACTIVE", {
                description: "You are now invisible to all nearby nodes. Signal terminated."
            });
        } catch (err) {
            toast.error("Failed to engage panic mode");
            setIsPanic(false);
        }
    };

    const handleReset = async () => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from("user_profiles")
                .update({
                    visibility_matrix: { map: true, swipe: true, dating: true, nearby_chat: true }
                })
                .eq("id", user.id);

            if (error) throw error;
            await refreshProfile();
            setIsPanic(false);
            toast.success("Signal Restored", { description: "You are visible again." });
        } catch (err) {
            toast.error("Failed to restore signal");
        }
    };

    return (
        <div className="fixed bottom-24 right-6 z-[100] flex flex-col items-end gap-3">
            <AnimatePresence>
                {isPanic && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        className="bg-red-500/10 backdrop-blur-2xl border border-red-500/50 p-6 rounded-[2.5rem] shadow-2xl max-w-[280px] text-right"
                    >
                        <h4 className="text-red-500 font-black italic tracking-tighter text-lg mb-2">CLOAK ENGAGED</h4>
                        <p className="text-[10px] text-white/70 uppercase tracking-widest leading-relaxed mb-4">
                            You are hidden from the proximity grid. Report an incident?
                        </p>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={handleReset} className="rounded-full text-[10px] font-bold uppercase py-0 h-8">Cancel</Button>
                            <Button variant="destructive" size="sm" className="rounded-full text-[10px] font-bold uppercase py-0 h-8 gap-2">
                                <Flag className="w-3 h-3" /> Report
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={isPanic ? handleReset : handlePanic}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-500 ${isPanic
                        ? 'bg-red-500 text-white animate-pulse scale-110 rotate-12'
                        : 'bg-black/60 backdrop-blur-xl border border-white/10 text-red-500 hover:bg-red-500/20 hover:scale-105'
                    }`}
            >
                {isPanic ? <ShieldCheck className="w-7 h-7" /> : <ShieldAlert className="w-7 h-7" />}
            </button>
        </div>
    );
}
