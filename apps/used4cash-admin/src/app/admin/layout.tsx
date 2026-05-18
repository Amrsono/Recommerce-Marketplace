"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Shield, LayoutDashboard, KanbanSquare, LogOut, Home, MessageSquare, Settings } from 'lucide-react';
import AdminGuard from '@/components/AdminGuard';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';

export default function AdminLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const { logout, user } = useAuth();
    const pathname = usePathname();

    return (
        <AdminGuard>
            <div className="bg-slate-950 text-slate-50 min-h-screen flex flex-col md:flex-row w-full font-sans">
                {/* Sidebar */}
                <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col p-4">
                    <div className="flex items-center gap-3 mb-8 px-2">
                        <div className="relative w-8 h-8 overflow-hidden rounded-md border border-slate-700 bg-slate-950">
                            <Image 
                                src="/logo.png" 
                                alt="used4cash Logo" 
                                fill 
                                className="object-contain"
                            />
                        </div>
                        <span className="font-bold text-xl tracking-tight">used4cash</span>
                    </div>
                    <nav className="flex-1 space-y-2">
                        <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-300 hover:text-white mb-2">
                            <Home className="w-5 h-5" />
                            Main Page
                        </Link>
                        <Link href="/admin" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${pathname === '/admin' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300 hover:text-white'}`}>
                            <LayoutDashboard className="w-5 h-5" />
                            Dashboard
                        </Link>
                        <Link href="/admin/kanban" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${pathname === '/admin/kanban' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300 hover:text-white'}`}>
                            <KanbanSquare className="w-5 h-5" />
                            Ticket Command
                        </Link>
                        <Link href="/admin/chat" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${pathname === '/admin/chat' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300 hover:text-white'}`}>
                            <MessageSquare className="w-5 h-5" />
                            Support Chat
                        </Link>
                        <Link href="/admin/settings" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${pathname === '/admin/settings' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300 hover:text-white'}`}>
                            <Settings className="w-5 h-5" />
                            Settings
                        </Link>
                    </nav>

                    <div className="pt-4 border-t border-slate-800 mt-auto">
                        <div className="flex items-center gap-3 px-3 py-2 text-sm text-slate-400">
                            <Link href="/profile" className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white hover:scale-110 transition-all active:scale-95 shadow-lg shadow-blue-500/20 shrink-0">
                                {user?.name?.[0]}
                            </Link>
                            <span className="truncate flex-1">{user?.email}</span>
                            <button onClick={logout} className="hover:text-white transition-colors p-1" title="Sign Out">
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-8">
                    {children}
                </main>
            </div>
        </AdminGuard>
    );
}
