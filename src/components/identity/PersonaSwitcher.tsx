
import React from 'react';
import { usePresence } from '@/hooks/useLocation';
import { cn } from '@/lib/utils';
import { User, Sparkles, Ghost } from 'lucide-react';

export function PersonaSwitcher() {
    const { presence, updatePresence } = usePresence();

    const currentMode = presence?.visibility_mode || 'personal';

    const modes = [
        {
            id: 'personal',
            label: 'Personal',
            icon: User,
            color: 'text-cyan-400',
            bg: 'bg-cyan-400/10',
            border: 'border-cyan-400/20'
        },
        {
            id: 'creator',
            label: 'Creator',
            icon: Sparkles,
            color: 'text-amber-400',
            bg: 'bg-amber-400/10',
            border: 'border-amber-400/20'
        },
        {
            id: 'ghost',
            label: 'Ghost',
            icon: Ghost,
            color: 'text-slate-400',
            bg: 'bg-slate-400/10',
            border: 'border-slate-400/20'
        }
    ];

    const handleSwitch = (modeId: string) => {
        updatePresence({
            visibility_mode: modeId,
            is_visible: modeId !== 'ghost',
            anonymous_mode: modeId === 'ghost'
        });
    };

    return (
        <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md border border-white/5 rounded-full p-1 h-9">
            {modes.map((mode) => {
                const isActive = currentMode === mode.id;
                const Icon = mode.icon;

                return (
                    <button
                        key={mode.id}
                        onClick={() => handleSwitch(mode.id)}
                        className={cn(
                            "relative flex items-center justify-center w-7 h-7 rounded-full transition-all duration-300",
                            isActive ? `${mode.bg} ${mode.color} shadow-lg` : "text-white/40 hover:text-white/70 hover:bg-white/5"
                        )}
                        title={mode.label}
                    >
                        <Icon size={14} className={isActive ? "animate-pulse-slow" : ""} />
                        {isActive && (
                            <div className={cn(
                                "absolute -bottom-1 w-1 h-1 rounded-full",
                                mode.color.replace('text-', 'bg-')
                            )} />
                        )}
                    </button>
                );
            })}
        </div>
    );
}
