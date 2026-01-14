import React from 'react';
import { cn } from '@/lib/utils';

interface ElectricButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    glow?: boolean;
    children: React.ReactNode;
}

export const ElectricButton: React.FC<ElectricButtonProps> = ({
    variant = 'primary',
    size = 'md',
    glow = false,
    className,
    children,
    ...props
}) => {
    const baseStyles = 'relative font-medium rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group';

    const variants = {
        primary: 'bg-gradient-to-r from-primary to-secondary text-dark hover:shadow-[0_0_30px_rgba(0,240,255,0.5)] hover:scale-105',
        secondary: 'bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 hover:border-primary/50',
        ghost: 'bg-transparent text-primary hover:bg-primary/10',
    };

    const sizes = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg',
    };

    return (
        <button
            className={cn(
                baseStyles,
                variants[variant],
                sizes[size],
                glow && 'animate-pulse-glow',
                className
            )}
            {...props}
        >
            {/* Shimmer effect */}
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

            {/* Content */}
            <span className="relative z-10 flex items-center justify-center gap-2">
                {children}
            </span>
        </button>
    );
};
