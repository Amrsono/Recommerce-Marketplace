"use client";

import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard, KanbanSquare, LogOut, Home, MessageSquare, Settings } from 'lucide-react';
import AdminGuard from '@/components/AdminGuard';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { useAdminTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Locale } from '@/locales/translations';

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const { logout, user } = useAuth();
    const pathname = usePathname();
    const { config } = useAdminTheme();
    const { t, locale, setLocale } = useLanguage();

    const navLinks = [
        { href: '/', label: t('adminNavMainPage'), icon: Home, exact: false },
        { href: '/admin', label: t('adminNavDashboard'), icon: LayoutDashboard, exact: true },
        { href: '/admin/kanban', label: t('adminNavTicketCommand'), icon: KanbanSquare, exact: true },
        { href: '/admin/chat', label: t('adminNavSupportChat'), icon: MessageSquare, exact: true },
        { href: '/admin/settings', label: t('adminNavSettings'), icon: Settings, exact: true },
    ];

    return (
        <AdminGuard>
            <div className={`${config.bg} ${config.text} min-h-screen flex flex-col md:flex-row w-full font-sans transition-colors duration-300`}>
                {/* Sidebar */}
                <aside className={`w-full md:w-64 ${config.sidebar} border-r ${config.border} flex flex-col p-4 transition-colors duration-300`}>
                    <div className="flex items-center gap-3 mb-8 px-2">
                        <div className={`relative w-8 h-8 overflow-hidden rounded-md border ${config.border} bg-slate-950`}>
                            <Image src="/logo.png" alt="used4cash Logo" fill className="object-contain" />
                        </div>
                        <span className="font-bold text-xl tracking-tight">used4cash</span>
                    </div>
                    <nav className="flex-1 space-y-1">
                        {navLinks.map(({ href, label, icon: Icon, exact }) => {
                            const isActive = exact ? pathname === href : pathname.startsWith(href);
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive ? config.navItemActive : config.navItem}`}
                                >
                                    <Icon className="w-5 h-5" />
                                    {label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className={`pt-4 border-t ${config.border} mt-auto`}>
                        <div className={`px-3 mb-4`}>
                            <select
                                value={locale}
                                onChange={(e) => setLocale(e.target.value as Locale)}
                                className={`w-full text-xs font-bold tracking-wider py-1.5 px-2 rounded bg-slate-900 border border-slate-700 text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                            >
                                <option value="en">English (EN)</option>
                                <option value="fr">Français (FR)</option>
                                <option value="es">Español (ES)</option>
                                <option value="pt">Português (PT)</option>
                                <option value="ar">العربية (AR)</option>
                            </select>
                        </div>
                        <div className={`flex items-center gap-3 px-3 py-2 text-sm ${config.textMuted}`}>
                            <Link href={user?.role === "ADMIN" ? "/admin" : (user?.role === "VENDOR" ? "/vendor" : "/profile")} className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white hover:scale-110 transition-all active:scale-95 shadow-lg shadow-blue-500/20 shrink-0">
                                {user?.name?.[0]}
                            </Link>
                            <span className="truncate flex-1" dir="ltr">{user?.email}</span>
                            <button onClick={logout} className="hover:text-white transition-colors p-1" title={t('adminSignOut')}>
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

