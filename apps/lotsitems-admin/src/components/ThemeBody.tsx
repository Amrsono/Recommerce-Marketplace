"use client";

import { useAdminTheme } from "@/contexts/ThemeContext";

const GLOBAL_THEME_CLASSES = {
    dark: "bg-[#0A0A0A] text-slate-50",
    medium: "bg-[#2C2A35] text-[#F0EAF8]",
    light: "bg-slate-100 text-slate-900",
};

export default function ThemeBody({ children, className }: { children: React.ReactNode; className?: string }) {
    const { theme } = useAdminTheme();
    return (
        <div
            data-theme={theme}
            className={`${GLOBAL_THEME_CLASSES[theme]} min-h-screen transition-colors duration-300 selection:bg-blue-500/30 selection:text-blue-100 ${className ?? ""}`}
        >
            {children}
        </div>
    );
}
