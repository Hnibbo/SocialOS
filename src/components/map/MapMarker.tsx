
import React from 'react';
import type { MapMarker, UserPresence, Group, Business, Activity } from '@/types/social-os';

interface MapMarkerProps {
    marker: MapMarker;
    onClick?: (marker: MapMarker) => void;
}

export const MapMarkerContent: React.FC<MapMarkerProps> = ({ marker, onClick }) => {
    const { type, data } = marker;

    const intentIcons: Record<string, string> = {
        hang: '👥',
        chat: '💬',
        date: '❤️',
        party: '🥳',
        quiet: '🤫'
    };

    if (type === 'user') {
        const user = data as any;
        const intentIcon = intentIcons[user.intent_signal] || '🤫';
        const isStreaming = user.is_streaming || false;

        return (
            <div
                className="relative cursor-pointer group"
                onClick={() => onClick?.(marker)}
            >
                {/* Intent Signal Ring */}
                <div className={`absolute -inset-1.5 rounded-full blur-[2px] transition-all duration-500 ${user.intent_signal === 'date' ? 'bg-pink-500/50' :
                    user.intent_signal === 'party' ? 'bg-purple-500/50' :
                        user.intent_signal === 'hang' ? 'bg-cyan-500/50' :
                            'bg-slate-500/30'
                    } group-hover:scale-125`} />

                {/* Avatar Container */}
                <div className={`w-11 h-11 rounded-full bg-black border-2 ${isStreaming ? 'border-red-500' : 'border-white/20'
                    } shadow-xl flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:scale-110`}>
                    {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.display_name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                            <span className="text-white/40 text-xs font-bold">{user.display_name?.[0]?.toUpperCase()}</span>
                        </div>
                    )}
                </div>

                {/* Intent Icon Overlay */}
                <div className="absolute -top-1 -right-1 bg-black/80 backdrop-blur-md rounded-full shadow-lg p-0.5 border border-white/10 text-[10px] w-5 h-5 flex items-center justify-center">
                    {intentIcon}
                </div>

                {/* Live Indicator */}
                {isStreaming && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[8px] font-black px-1 rounded-sm border border-black animate-pulse">
                        LIVE
                    </div>
                )}
            </div>
        );
    }

    if (type === 'content' && (data as any).category === 'drop') {
        const drop = data as any;
        return (
            <div
                className="relative cursor-pointer group"
                onClick={() => onClick?.(marker)}
            >
                {/* Glow base */}
                <div className="absolute -inset-4 bg-primary/20 rounded-full blur-xl animate-pulse" />
                <div className="absolute -inset-2 bg-primary/40 rounded-full blur-md animate-ping" />

                {/* Main drop icon */}
                <div className="w-14 h-14 rounded-full bg-black border-2 border-primary shadow-[0_0_20px_rgba(124,58,237,0.6)] flex items-center justify-center overflow-hidden transition-all hover:scale-110 hover:shadow-[0_0_40px_rgba(139,92,246,0.8)]">
                    <span className="text-2xl">
                        {drop.type === 'flash_offer' ? '⚡' :
                            drop.type === 'mystery_unlock' ? '🎁' :
                                drop.type === 'dj_set' ? '🎧' : '🔥'}
                    </span>
                </div>

                {/* Title badge */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    {drop.title}
                </div>
            </div>
        );
    }

    if (type === 'group') {
        const group = data as Group;
        return (
            <div
                className="relative cursor-pointer group"
                onClick={() => onClick?.(marker)}
            >
                <div className="w-12 h-12 rounded-xl bg-black/60 backdrop-blur-xl border border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center justify-center overflow-hidden transition-transform transform group-hover:scale-110 rotate-45 group-hover:rotate-0 transition-all duration-300">
                    <div className="-rotate-45 group-hover:rotate-0 transition-all duration-300">
                        {group.avatar_url ? (
                            <img src={group.avatar_url} alt={group.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-purple-400 font-bold text-lg">G</span>
                        )}
                    </div>
                </div>
                <div className="absolute -top-2 -right-2 bg-amber-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-black shadow-lg">
                    {group.member_count}
                </div>
            </div>
        );
    }

    if (type === 'activity') {
        const act = data as any;
        const isGift = act.category === 'gift';

        if (isGift) {
            return (
                <div
                    className="relative cursor-pointer group"
                    onClick={() => onClick?.(marker)}
                >
                    {/* Floating Gem Look */}
                    <div className="absolute -inset-2 bg-cyan-400/20 rounded-full blur-lg animate-pulse" />
                    <div className="w-12 h-12 rounded-[1rem] bg-black/80 backdrop-blur-xl border border-cyan-400/50 shadow-[0_0_25px_rgba(34,211,238,0.5)] flex items-center justify-center rotate-45 hover:rotate-90 hover:scale-125 transition-all duration-500">
                        <div className="-rotate-45 group-hover:-rotate-90 transition-all duration-500">
                            <span className="text-xl">💎</span>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div
                className="relative cursor-pointer group"
                onClick={() => onClick?.(marker)}
            >
                <div className="w-12 h-12 rounded-full bg-orange-500/20 backdrop-blur-md border border-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.4)] flex items-center justify-center animate-pulse-slow">
                    <span className="text-xl">🔥</span>
                </div>
                {/* Ring ripple effect */}
                <div className="absolute inset-0 rounded-full border border-orange-500/30 animate-ping"></div>
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-black/80 text-orange-400 text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {act.title || 'Event'}
                </div>
            </div>
        );
    }

    if (type === 'business') {
        const business = data as Business;
        return (
            <div
                className="relative cursor-pointer group"
                onClick={() => onClick?.(marker)}
            >
                <div className="w-10 h-10 rounded-lg bg-white text-black border-2 border-slate-200 shadow-[0_0_20px_rgba(255,255,255,0.6)] flex items-center justify-center overflow-hidden transition-transform transform group-hover:scale-110 group-hover:-translate-y-1">
                    <span className="text-xs font-bold font-display tracking-tighter">BIZ</span>
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-t-[8px] border-t-white border-r-[6px] border-r-transparent"></div>
            </div>
        );
    }

    return null;
};
