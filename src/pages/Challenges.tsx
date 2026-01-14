import { motion } from 'framer-motion';
import { Trophy, Target, Crown, Medal } from 'lucide-react';
import { CityChallengesFeed } from '@/components/features';
import { useState } from 'react';

export default function ChallengesPage() {
    return (
        <div className="min-h-screen bg-black text-white p-6 pt-24">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-7xl mx-auto"
            >
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600">
                        <Trophy className="w-8 h-8 text-black" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">City Challenges</h1>
                        <p className="text-white/60">Compete with other cities and earn rewards</p>
                    </div>
                </div>

                <CityChallengesFeed limit={50} />
            </motion.div>
        </div>
    );
}
