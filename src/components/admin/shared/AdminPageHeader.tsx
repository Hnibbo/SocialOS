import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface AdminPageHeaderProps {
    title: string;
    description: string;
    icon?: LucideIcon;
    actions?: React.ReactNode;
}

export function AdminPageHeader({ title, description, icon: Icon, actions }: AdminPageHeaderProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
            <div className="flex items-center gap-4">
                {Icon && (
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group transition-all">
                        <Icon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    </div>
                )}
                <div>
                    <h1 className="font-display text-2xl lg:text-3xl font-bold tracking-tight">
                        {title}
                    </h1>
                    <p className="text-muted-foreground text-sm lg:text-base">
                        {description}
                    </p>
                </div>
            </div>
            {actions && (
                <div className="flex items-center gap-2">
                    {actions}
                </div>
            )}
        </motion.div>
    );
}
