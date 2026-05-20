"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ShieldAlert } from "lucide-react";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && (!user || user.role !== "ADMIN")) {
            router.push("/auth?redirect=/admin");
        }
    }, [user, isLoading, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
                <div className="animate-pulse flex flex-col items-center">
                    <ShieldAlert className="w-12 h-12 text-blue-500 mb-4" />
                    <p>Verifying Admin Credentials...</p>
                </div>
            </div>
        );
    }

    if (!user || user.role !== "ADMIN") {
        return null; // Will redirect in useEffect
    }

    return <>{children}</>;
}
