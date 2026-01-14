import { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export const CustomCursor = () => {
    const cursorX = useMotionValue(-100);
    const cursorY = useMotionValue(-100);

    // Optimized spring physics for the trailing circle - snappier response
    const springConfig = { damping: 40, stiffness: 400, mass: 0.8 };
    const cursorXSpring = useSpring(cursorX, springConfig);
    const cursorYSpring = useSpring(cursorY, springConfig);

    const [isHovering, setIsHovering] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const hoverTargetRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        const moveCursor = (e: MouseEvent) => {
            // Direct mapping for instant feedback
            cursorX.set(e.clientX - 16);
            cursorY.set(e.clientY - 16);

            if (!isVisible && e.clientX > 0 && e.clientX < window.innerWidth && e.clientY > 0 && e.clientY < window.innerHeight) {
                setIsVisible(true);
            }
        };

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Check for clickable elements - extended list
            const isClickable =
                target.tagName === "BUTTON" ||
                target.tagName === "A" ||
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.tagName === "SELECT" ||
                target.tagName === "LABEL" ||
                target.closest("button") ||
                target.closest("a") ||
                target.getAttribute("role") === "button" ||
                target.classList.contains("clickable") ||
                window.getComputedStyle(target).cursor === "pointer";

            if (isClickable) {
                setIsHovering(true);
                hoverTargetRef.current = target;
            } else {
                setIsHovering(false);
                hoverTargetRef.current = null;
            }
        };

        const handleMouseOut = (e: MouseEvent) => {
            if (!e.relatedTarget) {
                setIsVisible(false);
            }
        };

        window.addEventListener("mousemove", moveCursor, { passive: true });
        window.addEventListener("mouseover", handleMouseOver, { passive: true });
        document.addEventListener("mouseout", handleMouseOut);

        return () => {
            window.removeEventListener("mousemove", moveCursor);
            window.removeEventListener("mouseover", handleMouseOver);
            document.removeEventListener("mouseout", handleMouseOut);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Don't render on touch devices
    if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) {
        return null;
    }

    return (
        <>
            {/* Center Dot - Instant Response (No Spring) */}
            <motion.div
                className="fixed top-0 left-0 w-2 h-2 bg-primary rounded-full pointer-events-none z-[9999] mix-blend-difference"
                style={{
                    x: cursorX,
                    y: cursorY,
                    translateX: 13,
                    translateY: 13,
                    opacity: isVisible ? 1 : 0,
                }}
                animate={{
                    scale: isHovering ? 0 : 1, // Hide dot when hovering to show only ring/glow
                }}
                transition={{ duration: 0.1 }}
            />

            {/* Trailing Ring - Smooth Spring Follow */}
            <motion.div
                className="fixed top-0 left-0 w-8 h-8 rounded-full pointer-events-none z-[9999]"
                style={{
                    x: cursorXSpring,
                    y: cursorYSpring,
                    opacity: isVisible ? 1 : 0,
                }}
                animate={{
                    scale: isHovering ? 2 : 1,
                    borderWidth: isHovering ? "2px" : "1.5px",
                    borderColor: isHovering ? "rgba(139, 92, 246, 0.8)" : "rgba(139, 92, 246, 0.3)",
                    backgroundColor: isHovering ? "rgba(139, 92, 246, 0.05)" : "transparent",
                }}
                transition={{ type: "tween", duration: 0.2 }}
            />

            {/* Glow effect on hover */}
            {isHovering && (
                <motion.div
                    className="fixed top-0 left-0 w-16 h-16 rounded-full pointer-events-none z-[9998]"
                    style={{
                        x: cursorXSpring,
                        y: cursorYSpring,
                        translateX: -8,
                        translateY: -8,
                        background: "radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)",
                        filter: "blur(5px)",
                    }}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                />
            )}
        </>
    );
};
