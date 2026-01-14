import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ThemeContextType {
    primaryColor: string;
    borderRadius: string;
    glassmorphism: boolean;
    refreshTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [primaryColor, setPrimaryColor] = useState("#8B5CF6");
    const [borderRadius, setBorderRadius] = useState("0.75rem");
    const [glassmorphism, setGlassmorphism] = useState(true);

    const fetchThemeSettings = async () => {
        try {
            const { data } = await supabase
                .from("platform_settings")
                .select("key, value")
                .in("key", ["theme_primary_color", "theme_border_radius", "theme_glassmorphism"]);

            data?.forEach((item) => {
                if (item.key === "theme_primary_color") setPrimaryColor(item.value as string);
                if (item.key === "theme_border_radius") setBorderRadius(item.value as string);
                if (item.key === "theme_glassmorphism") setGlassmorphism(item.value === true);
            });
        } catch (error) {
            console.error("Error fetching theme settings:", error);
        }
    };

    useEffect(() => {
        fetchThemeSettings();
    }, []);

    useEffect(() => {
        // Apply variables to document root
        const root = document.documentElement;
        root.style.setProperty("--primary-hex", primaryColor);
        root.style.setProperty("--radius", borderRadius);

        // We can also calculate complementary colors or opacity variants if needed
        // For now, index.css uses --dynamic-primary: var(--primary-hex, #8B5CF6)

        if (glassmorphism) {
            root.classList.add("theme-glass");
        } else {
            root.classList.remove("theme-glass");
        }
    }, [primaryColor, borderRadius, glassmorphism]);

    return (
        <ThemeContext.Provider value={{ primaryColor, borderRadius, glassmorphism, refreshTheme: fetchThemeSettings }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useThemeSettings = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error("useThemeSettings must be used within a ThemeProvider");
    return context;
};
