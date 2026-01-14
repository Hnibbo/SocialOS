import { motion } from 'framer-motion';
import { MapPin, Heart, Users, MessageSquare, Shield, Zap } from 'lucide-react';

export const AppPreview = () => {
    return (
        <div className="w-full max-w-4xl mx-auto py-12 perspective-1000">
            <motion.div
                initial={{ rotateX: 15, y: 50, opacity: 0 }}
                animate={{ rotateX: 0, y: 0, opacity: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="relative bg-card/60 backdrop-blur-2xl border border-primary/20 rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border-white/5"
            >
                {/* App Shell Header */}
                <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-white/5">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                            <Zap className="w-4 h-4 text-white fill-current" />
                        </div>
                        <span className="font-bold text-sm tracking-tight">Hup OS v1.0</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">94,220 Connected</span>
                    </div>
                </div>

                {/* Dashboard Grid */}
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 h-[500px]">
                    {/* Main Map Tile */}
                    <div className="md:col-span-1 bg-primary/5 rounded-3xl border border-primary/10 p-6 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="font-bold text-lg">Social Map</h4>
                                <p className="text-xs text-muted-foreground">Real-time presence</p>
                            </div>
                            <MapPin className="w-5 h-5 text-primary" />
                        </div>
                        <div className="mt-8 space-y-4">
                            {[1, 2, 3].map(i => (
                                <motion.div
                                    key={i}
                                    animate={{ x: [0, 5, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, delay: i * 0.5 }}
                                    className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5"
                                >
                                    <div className="w-8 h-8 rounded-full bg-indigo-500/20" />
                                    <div className="flex-1 h-2 bg-white/10 rounded-full" />
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Side Tiles */}
                    <div className="flex flex-col gap-6">
                        <div className="flex-1 bg-accent/5 rounded-3xl border border-accent/10 p-6 flex flex-col justify-between group">
                            <div className="flex justify-between items-start">
                                <Heart className="w-6 h-6 text-accent" />
                                <span className="text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded-full uppercase font-bold">AI Active</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-lg">Dating Engine</h4>
                                <p className="text-sm text-muted-foreground">98% match found nearby</p>
                            </div>
                        </div>

                        <div className="flex-1 bg-emerald-500/5 rounded-3xl border border-emerald-500/10 p-6 flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <Shield className="w-6 h-6 text-emerald-500" />
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded-full uppercase font-bold">Encrypted</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-lg">Privacy Vault</h4>
                                <p className="text-sm text-muted-foreground">Identity secured</p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
