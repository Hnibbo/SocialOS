import { motion } from 'framer-motion';
import { Sparkles, Zap, Clock, Users, Gift, MapPin, Filter } from 'lucide-react';
import { MomentDropsFeed } from '@/components/features';
import { useState } from 'react';

export default function MomentsPage() {
    return (
        <div className="min-h-screen bg-black text-white p-6 pt-24">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-7xl mx-auto"
            >
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500">
                        <Sparkles className="w-8 h-8 text-black" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Moment Drops</h1>
                        <p className="text-white/60">Spontaneous events happening right now</p>
                    </div>
                </div>

                <MomentDropsFeed limit={50} />
            </motion.div>
        </div>
    );
}
