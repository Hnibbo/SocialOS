import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
    glow?: boolean;
    onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    className,
    hover = false,
    glow = false,
    onClick,
}) => {
    return (
        <div
            onClick={onClick}
            className={cn(
                'glass-card relative overflow-hidden rounded-2xl',
                'bg-white/10 backdrop-blur-2xl border border-white/15',
                'shadow-[0_8px_32px_0_rgba(99,102,241,0.15)]',
                hover && 'transition-all duration-300 hover:bg-white/15 hover:border-white/25 hover:shadow-[0_8px_48px_0_rgba(99,102,241,0.25)] hover:-translate-y-1',
                glow && 'before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500',
                onClick && 'cursor-pointer',
                className
            )}
        >
            {children}
        </div>
    );
};
