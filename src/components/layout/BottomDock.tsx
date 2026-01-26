import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Activity, MessageSquare, Zap, Menu, ShoppingBag, Home } from "lucide-react";
import { motion } from "framer-motion";
import { useHaptics } from "@/hooks/use-haptics";
import { useCart } from "@/hooks/useCart";

const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/map", label: "Map", icon: Activity },
    { href: "/social", label: "Feed", icon: MessageSquare },
    { href: "/connections", label: "Matches", icon: Zap },
    { href: "/products", label: "Market", icon: ShoppingBag },
    { href: "/dashboard", label: "HQ", icon: LayoutDashboard },
];

interface BottomDockProps {
    onMenuClick?: () => void;
}

export default function BottomDock({ onMenuClick }: BottomDockProps) {
    const location = useLocation();
    const { light } = useHaptics();
    const { getTotalItems } = useCart();

    const items = [
        ...navItems,
        { href: "#", label: "Menu", icon: Menu, onClick: onMenuClick }
    ];

    return (
        <nav className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center bg-black/80 backdrop-blur-3xl border-t border-white/10 h-16 px-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            {items.map((item, index) => {
                const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
                const isMenu = item.label === "Menu";
                const isCart = item.label === "Market";

                const Content = (
                    <div className="relative flex flex-col items-center justify-center group cursor-pointer">
                        <motion.div
                            animate={{
                                scale: isActive ? 1.2 : 1,
                                color: isActive ? "rgb(99, 102, 241)" : isMenu ? "#9ca3af" : "#6b7280"
                            }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2 rounded-full transition-colors relative"
                        >
                            <item.icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                            
                            {isCart && getTotalItems() > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                    {getTotalItems()}
                                </span>
                            )}

                            {isActive && (
                                <motion.div
                                    layoutId="dock-glow"
                                    className="absolute inset-0 bg-primary/20 blur-lg rounded-full"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                />
                            )}
                        </motion.div>
                        <span className={`text-xs mt-1 ${isActive ? 'text-primary font-medium' : 'text-gray-400'}`}>
                            {item.label}
                        </span>
                    </div>
                );

                if (item.onClick) {
                    return (
                        <button key={item.label} onClick={(e) => { e.preventDefault(); light(); item.onClick?.(); }} className="flex flex-col items-center justify-center">
                            {Content}
                        </button>
                    );
                }

                return (
                    <Link
                        key={item.href}
                        to={item.href}
                        onClick={light}
                        className="flex flex-col items-center justify-center"
                    >
                        {Content}
                    </Link>
                );
            })}
        </nav>
    );
}
