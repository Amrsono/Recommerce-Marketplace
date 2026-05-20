"use client";

import Link from 'next/link';
import Image from 'next/image';
import { LogOut, LayoutDashboard, Store } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function VendorLayout({ children }: { children: React.ReactNode }) {
    const { logout, user } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        if (user && user.role !== 'VENDOR') {
            router.push('/');
        }
    }, [user, router]);

    if (!user || user.role !== 'VENDOR') return null;

    return (
        <div className="bg-slate-950 text-slate-50 min-h-screen flex flex-col md:flex-row w-full font-sans">
            <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col p-4">
                <div className="flex items-center gap-3 mb-8 px-2">
                    <div className="relative w-8 h-8 overflow-hidden rounded-md border border-slate-700 bg-slate-950">
                        <Image src="/logo.png" alt="Lotsitems B2B" fill className="object-contain" />
                    </div>
                    <span className="font-bold text-xl tracking-tight">Lotsitems B2B</span>
                </div>
                <nav className="flex-1 space-y-2">
                    <Link href="/vendor" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${pathname === '/vendor' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300 hover:text-white'}`}>
                        <Store className="w-5 h-5" />
                        Live Marketplace
                    </Link>
                </nav>
                <div className="pt-4 border-t border-slate-800 mt-auto">
                    <div className="flex items-center gap-3 px-3 py-2 text-sm text-slate-400">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-[10px] font-bold text-white shadow-lg shrink-0">
                            {user?.name?.[0] || 'V'}
                        </div>
                        <span className="truncate flex-1">{user?.name}</span>
                        <button onClick={logout} className="hover:text-white transition-colors p-1" title="Sign Out">
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>
            <main className="flex-1 overflow-x-hidden overflow-y-auto p-8 bg-slate-950">
                {children}
            </main>
        </div>
    );
}
