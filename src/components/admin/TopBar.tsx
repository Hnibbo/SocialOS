import React from "react";
import {
    Menu,
    Bell,
    Search,
    LogOut,
    RefreshCw
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export function TopBar() {
    const { user } = useAuth();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = "/login";
    };

    return (
        <header className="h-16 bg-slate-900/50 border-b border-slate-700/50 flex items-center justify-between px-6 sticky top-0 z-50 backdrop-blur-md bg-slate-900/80">
            <div className="flex items-center gap-4">
                <button className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all">
                    <Menu className="w-5 h-5" />
                </button>
                <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                    Social OS <span className="text-slate-400">Admin Panel</span>
                </h1>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>System Online</span>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <button className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:bg-slate-800 hover:text-white transition-all hover:border-slate-600">
                    <Search className="w-4 h-4" />
                </button>
                <button className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:bg-slate-800 hover:text-white transition-all hover:border-slate-600">
                    <Bell className="w-4 h-4" />
                </button>
                <button className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:bg-slate-800 hover:text-white transition-all hover:border-slate-600">
                    <RefreshCw className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-3 pl-4 border-l border-slate-700/50">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs">
                        {user?.user_metadata?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "A"}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-white">
                            {user?.user_metadata?.display_name || user?.email?.split('@')[0] || "Admin User"}
                        </span>
                        <span className="text-[11px] text-slate-400 uppercase tracking-widest font-bold">
                            Super Admin
                        </span>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                >
                    <LogOut className="w-4 h-4" />
                </button>
            </div>
        </header>
    );
}
