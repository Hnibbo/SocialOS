import { motion } from 'framer-motion';
import { Archive, MapPin, Users, Heart, Calendar, Image } from 'lucide-react';
import { MemoryCapsuleViewer } from '@/components/features';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

export default function MemoriesPage() {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-black text-white p-6 pt-24">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-7xl mx-auto"
            >
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500">
                        <Archive className="w-8 h-8 text-black" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Memory Capsules</h1>
                        <p className="text-white/60">Your archive of places, people, and moments</p>
                    </div>
                </div>

                <MemoryCapsuleViewer userId={user?.id} limit={50} />
            </motion.div>
        </div>
    );
}
