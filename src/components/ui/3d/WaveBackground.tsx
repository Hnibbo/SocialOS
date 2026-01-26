import { useEffect, useRef } from 'react';

interface WaveBackgroundProps {
    color1?: string;
    color2?: string;
    amplitude?: number;
    frequency?: number;
}

export function WaveBackground({
    color1 = '#8B5CF6',
    color2 = '#EC4899',
    amplitude = 50,
    frequency = 0.002,
}: WaveBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        // Animation
        let animationId: number;
        let offset = 0;

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Create gradient
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, color1);
            gradient.addColorStop(1, color2);

            // Draw multiple waves
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(0, canvas.height / 2);

                for (let x = 0; x < canvas.width; x++) {
                    const y =
                        canvas.height / 2 +
                        Math.sin((x + offset + i * 100) * frequency) * amplitude +
                        Math.sin((x + offset * 0.5 + i * 50) * frequency * 2) * (amplitude / 2);

                    ctx.lineTo(x, y);
                }

                ctx.lineTo(canvas.width, canvas.height);
                ctx.lineTo(0, canvas.height);
                ctx.closePath();

                ctx.fillStyle = gradient;
                ctx.globalAlpha = 0.1 - i * 0.03;
                ctx.fill();
            }

            offset += 0.5;
            animationId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationId);
        };
    }, [color1, color2, amplitude, frequency]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 -z-10 pointer-events-none"
            style={{ opacity: 0.3 }}
        />
    );
}
