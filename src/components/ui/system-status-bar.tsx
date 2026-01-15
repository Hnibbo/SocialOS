import React, { useState, useEffect } from 'react';
import {
    Wifi,
    Battery,
    Clock,
    Zap,
    Sparkles,
    Activity,
    User,
    Bell,
    Search,
    Settings,
    MessageSquare
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSocialOS } from '@/contexts/SocialOSContext';
import { cn } from '@/lib/utils';

export const SystemStatusBar: React.FC = () => {
    const [time, setTime] = useState(new Date());
    const { energy, xp, level, setIsAIOpen } = useSocialOS();
    const { user } = useAuth();

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-between px-6 py-2 bg-black/20 backdrop-blur-md border-b border-white/5 select-none pointer-events-auto">
            {/* Left side: branding and status */}
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 group cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-dark font-black tracking-tighter text-sm group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                        HUP
                    </div>
                    <span className="font-black text-xs tracking-widest hidden sm:block">SOCIAL OS <span className="text-primary font-normal opacity-50">v2.1</span></span>
                </div>

                <div className="hidden md:flex items-center gap-4 text-xs font-bold text-muted-foreground">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                        <Activity className="w-3 h-3 text-green-400" />
                        <span>SYSTEM STABLE</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                        <Wifi className="w-3 h-3 text-primary" />
                        <span>124ms</span>
                    </div>
                </div>
            </div>

            {/* Center: System Clock (Visual anchor) */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
                <div className="flex flex-col items-center">
                    <span className="text-sm font-black tracking-widest leading-none">
                        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[8px] font-bold opacity-30 uppercase tracking-[0.2em]">
                        {time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                </div>
            </div>

            {/* Right side: User stats and system controls */}
            <div className="flex items-center gap-4">
                {/* Energy Bar */}
                <div className="hidden lg:flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold opacity-50 uppercase tracking-tighter">Energy</span>
                        <span className="text-xs font-black text-primary">{energy}%</span>
                    </div>
                    <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                            style={{ width: `${energy}%` }}
                        />
                    </div>
                    <Zap className="w-4 h-4 text-primary animate-pulse" />
                </div>

                {/* XP / Level */}
                <div className="hidden sm:flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <div className="flex flex-col">
                        <span className="text-[8px] font-bold opacity-50 uppercase tracking-tighter leading-none">Level {level}</span>
                        <span className="text-xs font-black text-white leading-none mt-0.5">{xp} XP</span>
                    </div>
                </div>

                {/* System Icons */}
                <div className="flex items-center gap-1 sm:gap-2">
                    <div className="p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer relative">
                        <Bell className="w-4 h-4" />
                        <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-dark" />
                    </div>
                    <div
                        className="p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer text-primary"
                        onClick={() => setIsAIOpen(true)}
                    >
                        <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer sm:flex hidden">
                        <Settings className="w-4 h-4" />
                    </div>
                </div>

                {/* Profile */}
                <div className="flex items-center gap-2 ml-2 pl-4 border-l border-white/10 group cursor-pointer">
                    <div className="w-8 h-8 rounded-full border-2 border-primary/30 p-0.5 group-hover:border-primary transition-colors overflow-hidden">
                        {user?.user_metadata?.avatar_url ? (
                            <img src={user.user_metadata.avatar_url} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <div className="w-full h-full rounded-full bg-gradient-to-br from-primary/50 to-secondary/50 flex items-center justify-center text-[10px] font-bold">
                                {user?.email?.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
