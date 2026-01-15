import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Activity, MessageSquare, Zap, Menu } from "lucide-react";
import { motion } from "framer-motion";
import { useHaptics } from "@/hooks/use-haptics";

const navItems = [
    { href: "/map", label: "Map", icon: Activity },
    { href: "/social", label: "Feed", icon: MessageSquare },
    { href: "/connections", label: "Matches", icon: Zap },
    { href: "/dashboard", label: "HQ", icon: LayoutDashboard },
];

interface BottomDockProps {
    onMenuClick?: () => void;
}

export default function BottomDock({ onMenuClick }: BottomDockProps) {
    const location = useLocation();
    const { light } = useHaptics();

    const items = [
        ...navItems,
        { href: "#", label: "Menu", icon: Menu, onClick: onMenuClick }
    ];

    return (
        <nav className="fixed bottom-8 left-0 right-0 z-50 flex justify-center pointer-events-none">
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="pointer-events-auto bg-black/80 backdrop-blur-3xl border border-white/10 rounded-full h-18 px-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-6 md:gap-10"
            >
                {items.map((item, index) => {
                    const isActive = location.pathname === item.href;
                    const isMenu = item.label === "Menu";

                    const Content = (
                        <div className="relative flex flex-col items-center justify-center group cursor-pointer">
                            {isActive && (
                                <motion.div
                                    layoutId="dock-active"
                                    className="absolute -top-12 opacity-80"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                >
                                    <div className="w-1 h-1 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                                </motion.div>
                            )}

                            <motion.div
                                animate={{
                                    scale: isActive ? 1.2 : 1,
                                    color: isActive ? "#ffffff" : isMenu ? "#9ca3af" : "#6b7280"
                                }}
                                whileTap={{ scale: 0.9 }}
                                className="p-2 rounded-full transition-colors relative"
                            >
                                <item.icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />

                                {isActive && (
                                    <motion.div
                                        layoutId="dock-glow"
                                        className="absolute inset-0 bg-white/20 blur-lg rounded-full"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                    />
                                )}
                            </motion.div>
                        </div>
                    );

                    if (item.onClick) {
                        return (
                            <button key={item.label} onClick={(e) => { e.preventDefault(); light(); item.onClick?.(); }}>
                                {Content}
                            </button>
                        );
                    }

                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            onClick={light}
                        >
                            {Content}
                        </Link>
                    );
                })}
            </motion.div>
        </nav>
    );
}
