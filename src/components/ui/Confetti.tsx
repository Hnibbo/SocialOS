import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Particle {
    id: number;
    x: number;
    y: number;
    color: string;
    rotation: number;
}

const COLORS = ["#8B5CF6", "#D946EF", "#3B82F6", "#10B981", "#F59E0B"];

export function Confetti({ trigger }: { trigger: boolean }) {
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        if (trigger) {
            const newParticles = Array.from({ length: 50 }).map((_, i) => ({
                id: Math.random() + i,
                x: Math.random() * 100,
                y: -10,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                rotation: Math.random() * 360,
            }));
            setParticles(newParticles);

            const timer = setTimeout(() => setParticles([]), 3000);
            return () => clearTimeout(timer);
        }
    }, [trigger]);

    if (particles.length === 0) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: 0 }}
                    animate={{
                        y: "110vh",
                        x: `${p.x + (Math.random() * 10 - 5)}vw`,
                        rotate: p.rotation + 720,
                        opacity: 0
                    }}
                    transition={{
                        duration: 2 + Math.random() * 2,
                        ease: "easeOut"
                    }}
                    className="absolute w-2 h-2 rounded-sm"
                    style={{ backgroundColor: p.color }}
                />
            ))}
        </div>
    );
}
