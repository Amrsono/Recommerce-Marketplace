"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";

type UserRole = "CUSTOMER" | "ADMIN" | "ENGINEER" | "VENDOR" | null;

interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
}

interface AuthContextType {
    user: User | null;
    login: (email: string, pass: string, redirectTo?: string) => Promise<void>;
    register: (name: string, email: string, pass: string, redirectTo?: string) => Promise<void>;
    logout: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
console.log(`[AuthContext] Initialized with API_URL: ${API_URL}`);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkConnectivity = async () => {
            console.log(`[AuthContext] Pinging API at: ${API_URL}/../health`);
            try {
                const ping = await fetch(`${API_URL}/../health`);
                console.log(`[AuthContext] API Status: ${ping.status} ${ping.statusText}`);
            } catch (e: any) {
                console.warn(`[AuthContext] API Connectivity Test Failed: ${e.message}`);
            }
        };
        checkConnectivity();

        // Migration: Migrate legacy recommerce/makeuse/used4cash keys to lotsitems
        const legacyRecommerceUser = localStorage.getItem("recommerce_user");
        const legacyRecommerceToken = localStorage.getItem("recommerce_token");
        const legacyMakeuseUser = localStorage.getItem("makeuse_user");
        const legacyMakeuseToken = localStorage.getItem("makeuse_token");
        const legacyUsed4cashUser = localStorage.getItem("used4cash_user");
        const legacyUsed4cashToken = localStorage.getItem("used4cash_token");

        if (legacyRecommerceUser && legacyRecommerceToken) {
            localStorage.setItem("lotsitems_user", legacyRecommerceUser);
            localStorage.setItem("lotsitems_token", legacyRecommerceToken);
            localStorage.removeItem("recommerce_user");
            localStorage.removeItem("recommerce_token");
        } else if (legacyMakeuseUser && legacyMakeuseToken) {
            localStorage.setItem("lotsitems_user", legacyMakeuseUser);
            localStorage.setItem("lotsitems_token", legacyMakeuseToken);
            localStorage.removeItem("makeuse_user");
            localStorage.removeItem("makeuse_token");
        } else if (legacyUsed4cashUser && legacyUsed4cashToken) {
            localStorage.setItem("lotsitems_user", legacyUsed4cashUser);
            localStorage.setItem("lotsitems_token", legacyUsed4cashToken);
            localStorage.removeItem("used4cash_user");
            localStorage.removeItem("used4cash_token");
        }

        // Hydrate auth state from localStorage
        const storedUser = localStorage.getItem("lotsitems_user");
        const storedToken = localStorage.getItem("lotsitems_token");

        if (storedUser && storedToken) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse stored user", e);
                localStorage.removeItem("lotsitems_user");
                localStorage.removeItem("lotsitems_token");
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, pass: string, redirectTo?: string) => {
        console.log(`[Auth] Attempting API login for: ${email}`);
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password: pass })
            });
            const data = await res.json();

            if (data.success) {
                const userData = data.user;
                setUser(userData);
                localStorage.setItem("lotsitems_user", JSON.stringify(userData));
                localStorage.setItem("lotsitems_token", data.token);

                const dest = userData.role === "ADMIN" ? "/admin" : (userData.role === "VENDOR" ? "/vendor" : (redirectTo || "/profile"));
                router.push(dest);
            } else {
                throw new Error(data.error || "Login failed");
            }
        } catch (error: any) {
            console.error("[Auth] Login failed:", error.message);
            alert(`Login failed: ${error.message}`);
        }
    };

    const register = async (name: string, email: string, pass: string, redirectTo?: string) => {
        console.log(`[Auth] Attempting API registration for: ${email}`);
        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password: pass })
            });
            const data = await res.json();

            if (data.success) {
                const userData = data.user;
                setUser(userData);
                localStorage.setItem("lotsitems_user", JSON.stringify(userData));
                localStorage.setItem("lotsitems_token", data.token);

                const dest = userData.role === "ADMIN" ? "/admin" : (userData.role === "VENDOR" ? "/vendor" : (redirectTo || "/assess"));
                router.push(dest);
            } else {
                throw new Error(data.error || "Registration failed");
            }
        } catch (error: any) {
            console.error("[Auth] Registration failed:", error.message);
            alert(`Registration failed: ${error.message}`);
        }
    };

    const logout = async () => {
        setUser(null);
        localStorage.removeItem("lotsitems_user");
        localStorage.removeItem("lotsitems_token");
        router.push("/");
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
