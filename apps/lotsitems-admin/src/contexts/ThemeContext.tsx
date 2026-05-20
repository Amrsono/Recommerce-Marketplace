"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type AdminTheme = "dark" | "medium" | "light";

export interface ThemeConfig {
    bg: string;
    sidebar: string;
    border: string;
    text: string;
    textMuted: string;
    navItem: string;
    navItemActive: string;
    card: string;
}

export const THEMES: Record<AdminTheme, ThemeConfig> = {
    dark: {
        bg: "bg-slate-950",
        sidebar: "bg-slate-900",
        border: "border-slate-800",
        text: "text-slate-50",
        textMuted: "text-slate-400",
        navItem: "text-slate-300 hover:bg-slate-800 hover:text-white",
        navItemActive: "bg-blue-600 text-white",
        card: "bg-slate-900 border-slate-800",
    },
    medium: {
        bg: "bg-[#2C2A35]",
        sidebar: "bg-[#24222C]",
        border: "border-[#3E3A4A]",
        text: "text-[#F0EAF8]",
        textMuted: "text-[#A89BC2]",
        navItem: "text-[#C4B8D8] hover:bg-[#3A3545] hover:text-[#F0EAF8]",
        navItemActive: "bg-violet-600 text-white",
        card: "bg-[#24222C] border-[#3E3A4A]",
    },
    light: {
        bg: "bg-slate-100",
        sidebar: "bg-white",
        border: "border-slate-200",
        text: "text-slate-900",
        textMuted: "text-slate-500",
        navItem: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        navItemActive: "bg-blue-600 text-white",
        card: "bg-white border-slate-200",
    },
};

interface ThemeContextType {
    theme: AdminTheme;
    config: ThemeConfig;
    setTheme: (t: AdminTheme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: "dark",
    config: THEMES.dark,
    setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<AdminTheme>("dark");

    useEffect(() => {
        const saved = localStorage.getItem("admin-theme") as AdminTheme | null;
        if (saved && THEMES[saved]) setThemeState(saved);
    }, []);

    const setTheme = (t: AdminTheme) => {
        setThemeState(t);
        localStorage.setItem("admin-theme", t);
    };

    return (
        <ThemeContext.Provider value={{ theme, config: THEMES[theme], setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useAdminTheme = () => useContext(ThemeContext);
