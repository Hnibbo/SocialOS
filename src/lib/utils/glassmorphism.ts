/**
 * Glassmorphism utility classes
 * Modern glass-like UI effects
 */

export const glassStyles = {
    // Standard glass panel
    panel: `
    backdrop-blur-xl
    bg-white/5
    border border-white/10
    shadow-2xl shadow-black/20
  `,

    // Stronger glass effect
    strong: `
    backdrop-blur-2xl
    bg-white/10
    border border-white/20
    shadow-2xl shadow-black/30
  `,

    // Subtle glass effect
    subtle: `
    backdrop-blur-md
    bg-white/3
    border border-white/5
    shadow-xl shadow-black/10
  `,

    // Card with glass effect
    card: `
    backdrop-blur-xl
    bg-gradient-to-br from-white/10 to-white/5
    border border-white/10
    shadow-2xl shadow-primary/10
    hover:shadow-primary/20
    transition-all duration-300
  `,

    // Button with glass effect
    button: `
    backdrop-blur-lg
    bg-white/10
    border border-white/20
    hover:bg-white/20
    active:bg-white/15
    transition-all duration-200
  `,

    // Input with glass effect
    input: `
    backdrop-blur-lg
    bg-white/5
    border border-white/10
    focus:border-primary/50
    focus:bg-white/10
    transition-all duration-200
  `,

    // Modal/Dialog with glass effect
    modal: `
    backdrop-blur-2xl
    bg-black/40
    border border-white/10
  `,

    // Navbar with glass effect
    navbar: `
    backdrop-blur-xl
    bg-background/80
    border-b border-white/10
    shadow-lg shadow-black/5
  `,
};

/**
 * Generate glassmorphism CSS class string
 */
export function glass(variant: keyof typeof glassStyles = 'panel'): string {
    return glassStyles[variant].replace(/\s+/g, ' ').trim();
}

/**
 * Combine glass effect with custom classes
 */
export function glassWithClasses(
    variant: keyof typeof glassStyles,
    additionalClasses: string
): string {
    return `${glass(variant)} ${additionalClasses}`;
}
