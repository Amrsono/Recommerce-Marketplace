"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "next/navigation";
import { ScanLine, ArrowRight } from "lucide-react";

export function AuthForm() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");

    const { login, register } = useAuth();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get("redirect") || undefined;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isLogin) {
            login(email, password, redirectTo);
        } else {
            register(name, email, password, redirectTo);
        }
    };

    return (
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl z-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex flex-col items-center mb-8">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 border border-blue-500/20">
                    <ScanLine className="w-6 h-6 text-blue-500" />
                </div>
                <h1 className="text-2xl font-bold text-white text-center">
                    {isLogin ? "Welcome back" : "Create an account"}
                </h1>
                <p className="text-slate-400 mt-2 text-sm text-center">
                    {isLogin
                        ? "Enter your credentials to access your account"
                        : "Start turning your old devices into fast cash"}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-300">Full Name</label>
                        <input
                            type="text"
                            required={!isLogin}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            placeholder="John Doe"
                        />
                    </div>
                )}

                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">Email address</label>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        placeholder="you@example.com"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">Password</label>
                    <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        placeholder="••••••••"
                    />
                </div>



                <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg px-4 py-3 mt-6 transition-colors flex items-center justify-center gap-2 group"
                >
                    {isLogin ? "Sign In" : "Create Account"}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-400">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                    {isLogin ? "Sign up" : "Sign in"}
                </button>
            </div>
        </div>
    );
}
