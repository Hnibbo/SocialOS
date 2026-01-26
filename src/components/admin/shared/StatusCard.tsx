import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface StatusCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    color: string;
    trend?: { value: number; isPositive: boolean } | "up" | "down";
    subtitle?: string;
    change?: number;
    changeLabel?: string;
    gradient: string;
    delay?: number;
}

export function StatusCard({
    label,
    value,
    icon: Icon,
    color = "text-primary",
    trend,
    subtitle,
    change,
    changeLabel,
    gradient,
    delay = 0
}: StatusCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay }}
            className="h-full"
        >
            <Card className="bg-gradient-card border-border/50 h-full overflow-hidden relative group hover:border-primary/30 transition-all duration-300">
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50 group-hover:opacity-100 transition-opacity`} />
                <CardContent className="p-4 relative">
                    <div className="flex items-start justify-between mb-4">
                        <div className={`p-2 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50 shadow-sm ${color}`}>
                            <Icon className="w-4 h-4" />
                        </div>
                        {trend && (
                            <Badge variant="outline" className={`text-[10px] h-5 ${
                                typeof trend === 'object' 
                                    ? (trend.isPositive ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20')
                                    : (trend === 'up' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20')
                            }`}>
                                {typeof trend === 'object' ? (trend.isPositive ? 'UP' : 'DOWN') : String(trend).toUpperCase()}
                            </Badge>
                        )}
                    </div>
                    <div>
                        <p className="text-2xl font-bold tracking-tight font-display">{value}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">{label}</p>
                    </div>
                    {subtitle && (
                        <p className="text-[10px] text-muted-foreground/60 mt-2 font-medium italic">{subtitle}</p>
                    )}
                    {change !== undefined && change > 0 && (
                        <div className="mt-2 flex items-center gap-1">
                            <div className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[9px] font-bold">
                                +{change} {changeLabel}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}
