import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    Settings,
    Shield,
    Activity,
    CreditCard,
    Bell,
    FileText,
    Database,
    LogOut,
    ChevronDown,
    Menu,
    Building2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const navigationItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Organizations", href: "/admin/organizations", icon: Building2 },
    { name: "Analytics", href: "/admin/analytics", icon: Activity },
    { name: "Moderation", href: "/admin/moderation", icon: Shield },
    { name: "Content", href: "/admin/content", icon: FileText },
    { name: "Security", href: "/admin/security", icon: Shield },
    { name: "Settings", href: "/admin/settings", icon: Settings },
    { name: "Billing", href: "/admin/plans", icon: CreditCard },
    { name: "Database", href: "/admin/data-export", icon: Database },
];

const bottomItems = [
    { name: "Notifications", href: "/admin/notifications-center", icon: Bell },
];

export function Sidebar() {
    const location = useLocation();
    const [collapsed, setCollapsed] = React.useState(false);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = "/login";
    };

    return (
        <aside
            className={cn(
                "bg-slate-900/50 border-r border-slate-700/50 flex flex-col transition-all duration-300",
                collapsed ? "w-20" : "w-64"
            )}
        >
            <div className="p-4 border-b border-slate-700/50 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                    <LayoutDashboard className="w-6 h-6 text-white" />
                </div>
                {!collapsed && (
                    <>
                        <h2 className="font-black tracking-tighter text-lg bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                            ADMIN
                        </h2>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                            Control Center
                        </span>
                    </>
                )}
            </div>

            <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-3">
                {navigationItems.map((item) => {
                    const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + "/");
                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={cn(
                                "group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 hover:bg-slate-800",
                                isActive
                                    ? "bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                                    : "text-slate-400 border border-transparent hover:border-slate-700/30"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-cyan-400")} />
                            {!collapsed && (
                                <span className="font-semibold text-sm">{item.name}</span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-3 border-t border-slate-700/50 space-y-1">
                {bottomItems.map((item) => {
                    const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + "/");
                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={cn(
                                "group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 hover:bg-slate-800",
                                isActive
                                    ? "bg-slate-800 text-blue-400 border border-blue-500/30"
                                    : "text-slate-400 border border-transparent hover:border-slate-700/30"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5 flex-shrink-0")} />
                            {!collapsed && <span className="font-semibold text-sm">{item.name}</span>}
                        </Link>
                    );
                })}
            </div>

            <div className="p-3 border-t border-slate-700/50 space-y-1">
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="group flex items-center gap-3 px-3 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all w-full"
                >
                    {collapsed ? (
                        <>
                            <Menu className="w-5 h-5" />
                            <span className="font-semibold text-sm">Expand</span>
                        </>
                    ) : (
                        <>
                            <ChevronDown className="w-5 h-5" />
                            <span className="font-semibold text-sm">Collapse</span>
                        </>
                    )}
                </button>

                <button
                    onClick={handleLogout}
                    className="group flex items-center gap-3 px-3 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all w-full"
                >
                    <LogOut className="w-5 h-5" />
                    {!collapsed && <span className="font-semibold text-sm">Logout</span>}
                </button>
            </div>
        </aside>
    );
}
