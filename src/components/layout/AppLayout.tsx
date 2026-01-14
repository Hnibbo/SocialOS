import { useState, useEffect } from "react";
import { Outlet, useLocation, Link, useNavigate } from "react-router-dom";
import BottomDock from "./BottomDock";
import { PersonaSwitcher } from "@/components/identity/PersonaSwitcher";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import hupLogo from "@/assets/hup-logo.png";
import { CommandPalette } from "@/components/admin/shared/CommandPalette";
import { Search as SearchIcon } from "lucide-react";
import { toast } from "sonner";
import {
    Menu, X, LayoutDashboard, Activity, RefreshCw,
    Settings, Shield, DollarSign,
    BarChart3, Users, Building2, Bot, CreditCard,
    MessageSquare, ChevronDown, ShieldCheck, LogOut, User, Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUserRole } from "@/hooks/useUserRole";
import { useHaptics } from "@/hooks/use-haptics";
import { Button } from "@/components/ui/button";
import { useSocialIntelligence } from "@/hooks/useSocialIntelligence";
import { SafetyPanic } from "@/components/safety/SafetyPanic";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
    { href: "/map", label: "Map", icon: Activity },
    { href: "/dating", label: "Dating", icon: RefreshCw },
    { href: "/chat", label: "Chat", icon: MessageSquare },
    { href: "/dashboard", label: "Space", icon: LayoutDashboard },
];

const sidebarItems = [
    { href: "/map", label: "Live Map", icon: Activity },
    { href: "/social", label: "Social Grid", icon: MessageSquare },
    { href: "/dating", label: "Connections", icon: RefreshCw },
    { href: "/chat", label: "Random Solo", icon: Zap },
    { href: "/live", label: "Live Streams", icon: Zap },
    { href: "/dashboard", label: "HQ", icon: LayoutDashboard },
    { href: "/wallet", label: "Wallet", icon: DollarSign },
    { href: "/profile", label: "Identity", icon: User },
];

const adminSidebarItems = [
    { href: "/admin", label: "Admin Core", icon: LayoutDashboard },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/admin/users", label: "User Control", icon: Users },
    { href: "/admin/businesses", label: "Businesses", icon: Building2 },
    { href: "/admin/god-mode", label: "God Mode", icon: Bot },
    { href: "/admin/plans", label: "Monetization", icon: CreditCard },
    { href: "/admin/security", label: "Security", icon: Shield },
    { href: "/admin/settings", label: "Platform", icon: Settings },
];


export default function AppLayout() {
    const { user, profile, signOut, refreshProfile } = useAuth();
    const { isAdmin } = useUserRole();
    const { isolationLevel } = useSocialIntelligence();
    const { light } = useHaptics();
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);

    // Derived State (Restored)
    const isGodMode = location.pathname.startsWith("/admin");
    const currentItems = isGodMode ? adminSidebarItems : sidebarItems;
    const userInitials = user?.user_metadata?.name?.substring(0, 2).toUpperCase() || "HU";

    const handleSignOut = async () => {
        await signOut();
        navigate("/login");
    };

    // Helper to update intent
    const handleUpdateIntent = async (intent: string) => {
        if (!user) return;
        light();
        const { error } = await supabase
            .from("user_profiles")
            .update({ intent_signal: intent })
            .eq("id", user.id);

        if (error) {
            toast.error("Failed to update signal");
        } else {
            await refreshProfile();
            toast.success(`Signal set to ${intent.toUpperCase()}`);
        }
    };

    // Helper to open search
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setSearchOpen((open) => !open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    return (
        <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
            <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-black/40 backdrop-blur-3xl border-r border-white/5 z-50">
                <div className="flex items-center gap-3 px-6 h-20 border-b border-white/5">
                    <Link to="/" className="flex items-center gap-3">
                        <img src={hupLogo} alt="Hup" className="h-9 w-9 rounded-2xl shadow-xl" />
                        <span className="font-display text-2xl font-black tracking-tighter text-white">Hup</span>
                    </Link>
                </div>

                {/* Search Trigger */}
                <div className="px-4 pt-6 pb-2">
                    <button
                        onClick={() => setSearchOpen(true)}
                        className="w-full flex items-center justify-between px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-xl text-sm text-gray-400 transition-all group"
                    >
                        <div className="flex items-center gap-2">
                            <SearchIcon className="w-4 h-4 group-hover:text-white" />
                            <span>Search...</span>
                        </div>
                        <kbd className="hidden lg:inline-flex h-5 items-center gap-1 rounded border border-white/10 bg-black/20 px-1.5 font-mono text-[10px] font-medium text-gray-500">
                            <span className="text-xs">⌘</span>K
                        </kbd>
                    </button>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-2">
                    {currentItems.map((item) => {
                        const isActive = location.pathname === item.href || (item.href !== '/admin' && location.pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                onClick={() => {
                                    light();
                                    setSidebarOpen(false);
                                }}
                                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${isActive
                                    ? (isGodMode ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" : "bg-primary text-white shadow-lg shadow-primary/20")
                                    : "text-white/50 hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                                {item.label}
                            </Link>
                        );
                    })}

                    {isAdmin && !isGodMode && (
                        <Link
                            to="/admin"
                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all mt-8 ${location.pathname.startsWith("/admin")
                                ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                                : "text-amber-500 hover:bg-amber-500/10"
                                }`}
                        >
                            <ShieldCheck className="w-5 h-5 stroke-[2.5px]" />
                            God Mode
                        </Link>
                    )}

                    {isGodMode && (
                        <Link
                            to="/dashboard"
                            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all mt-8 text-white/50 hover:text-white hover:bg-white/5"
                        >
                            <LayoutDashboard className="w-5 h-5 stroke-2" />
                            Back to App
                        </Link>
                    )}

                    {/* Quick Intent HUD */}
                    {!isGodMode && (
                        <div className="mt-auto px-4 pb-4">
                            <div className="p-4 rounded-3xl bg-white/5 border border-white/10 space-y-3">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/40">
                                    <span>Signal Mode</span>
                                    <div className={`w-1.5 h-1.5 rounded-full ${isolationLevel > 50 ? 'bg-red-500' : 'bg-green-500'}`} />
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    {[
                                        { id: 'quiet', icon: '🤫' },
                                        { id: 'chat', icon: '💬' },
                                        { id: 'hang', icon: '👥' },
                                        { id: 'party', icon: '🥳' }
                                    ].map(intent => (
                                        <button
                                            key={intent.id}
                                            onClick={() => handleUpdateIntent(intent.id)}
                                            className={`h-10 rounded-xl flex items-center justify-center transition-all ${profile?.intent_signal === intent.id
                                                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                                : 'bg-white/5 hover:bg-white/10 text-xl'
                                                }`}
                                        >
                                            {intent.icon}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </nav>

                <div className="p-4 border-t border-white/5 bg-black/20">
                    <div className="mb-6 flex justify-center">
                        <PersonaSwitcher />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="w-full justify-start gap-3 px-3 py-3 h-auto hover:bg-white/5 rounded-2xl">
                                <Avatar className="h-10 w-10 ring-2 ring-white/10">
                                    <AvatarFallback className="bg-primary/20 text-primary text-sm font-black">
                                        {userInitials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 text-left">
                                    <p className="text-sm font-bold text-white truncate">
                                        {user?.user_metadata?.name || "Member"}
                                    </p>
                                    <p className="text-[10px] text-white/40 font-mono truncate uppercase tracking-widest">
                                        Active Node
                                    </p>
                                </div>
                                <ChevronDown className="w-4 h-4 text-white/40" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-black/90 backdrop-blur-2xl border-white/10 rounded-2xl shadow-2xl p-2">
                            <DropdownMenuItem asChild>
                                <Link to="/profile" className="cursor-pointer rounded-xl py-3 group">
                                    <User className="mr-3 w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                                    Identity Profile
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link to="/wallet" className="cursor-pointer rounded-xl py-3 group">
                                    <DollarSign className="mr-3 w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                                    Wallet & Payouts
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuItem onClick={handleSignOut} className="text-red-400 cursor-pointer rounded-xl py-3 hover:bg-red-500/10 hover:text-red-300">
                                <LogOut className="mr-3 w-4 h-4" />
                                Terminate Session
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </aside>

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
                {/* Header Removed for App-Like Feel */}


                {/* Mobile Sidebar Overlay */}
                <AnimatePresence>
                    {sidebarOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="lg:hidden fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm"
                                onClick={() => setSidebarOpen(false)}
                            />
                            <motion.aside
                                initial={{ x: "100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "100%" }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="lg:hidden fixed inset-y-0 right-0 z-[70] w-72 bg-black/90 backdrop-blur-3xl border-l border-white/10 p-6 flex flex-col"
                            >
                                <div className="flex items-center justify-between mb-10">
                                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white/40">Navigation</h2>
                                    <button onClick={() => setSidebarOpen(false)} className="p-2 text-white/60">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <nav className="flex-1 space-y-3">
                                    {currentItems.map((item) => {
                                        const isActive = location.pathname === item.href || (item.href !== '/admin' && location.pathname.startsWith(item.href));
                                        return (
                                            <Link
                                                key={item.href}
                                                to={item.href}
                                                onClick={() => setSidebarOpen(false)}
                                                className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-base font-bold transition-all ${isActive
                                                    ? (isGodMode ? "bg-amber-500 text-black" : "bg-primary text-white")
                                                    : "text-white/60 hover:text-white hover:bg-white/5"
                                                    }`}
                                            >
                                                <item.icon className="w-5 h-5" />
                                                {item.label}
                                            </Link>
                                        );
                                    })}

                                    {isAdmin && !isGodMode && (
                                        <Link
                                            to="/admin"
                                            onClick={() => setSidebarOpen(false)}
                                            className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-base font-bold transition-all mt-4 border border-amber-500/20 ${location.pathname.startsWith("/admin")
                                                ? "bg-amber-500 text-black px-6"
                                                : "text-amber-500"
                                                }`}
                                        >
                                            <ShieldCheck className="w-5 h-5" />
                                            God Mode
                                        </Link>
                                    )}
                                </nav>

                                <div className="pt-8 border-t border-white/10">
                                    <Button
                                        variant="ghost"
                                        onClick={handleSignOut}
                                        className="w-full justify-start gap-4 text-red-400 hover:text-red-300 hover:bg-red-500/10 h-14 rounded-2xl font-bold"
                                    >
                                        <LogOut className="w-5 h-5" />
                                        Sign Out
                                    </Button>
                                </div>
                            </motion.aside>
                        </>
                    )}
                </AnimatePresence>

                {/* Main Content Area */}
                <main className="flex-1 relative overflow-y-auto lg:p-4 pb-32 lg:pb-0 h-full">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="h-full"
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                    <SafetyPanic />
                </main>

                <div className="lg:hidden">
                    <BottomDock onMenuClick={() => setSidebarOpen(true)} />
                </div>
            </div>
        </div>
    );
}

