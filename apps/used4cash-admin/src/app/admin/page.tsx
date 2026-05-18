"use client";

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Users, Ticket, ArrowUpRight, Smartphone, Loader2 } from 'lucide-react';

type Stats = {
    totalTickets: number;
    openTickets: number;
    totalUsers: number;
    totalDevices: number;
    slaFulfillment: string;
};

type VolumePoint = { name: string; devices: number };
type WeeklyPoint = { name: string; tickets: number };

export default function Dashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [volumeData, setVolumeData] = useState<VolumePoint[]>([]);
    const [weeklyData, setWeeklyData] = useState<WeeklyPoint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = () => {
            fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/stats`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setStats(data.stats);
                        setVolumeData(data.volumeData || []);
                        setWeeklyData(data.weeklyData || []);
                        setError(null);
                    } else {
                        setError('Failed to load stats from API.');
                    }
                })
                .catch(() => setError('API unreachable — is the server running?'))
                .finally(() => setIsLoading(false));
        };

        fetchStats();
        const interval = setInterval(fetchStats, 10000); // Refresh every 10s
        return () => clearInterval(interval);
    }, []);

    const kpiCards = stats
        ? [
            { label: 'Total Tickets', value: stats.totalTickets.toLocaleString(), icon: Ticket, change: `${stats.openTickets} open` },
            { label: 'Active Customers', value: stats.totalUsers.toLocaleString(), icon: Users, change: 'registered users' },
            { label: 'Devices Evaluated', value: stats.totalDevices.toLocaleString(), icon: Smartphone, change: 'total submissions' },
            { label: 'SLA Fulfillment', value: stats.slaFulfillment, icon: ArrowUpRight, change: 'resolved / total' },
        ]
        : [];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
                    <p className="text-slate-400 mt-1">
                        {isLoading ? 'Loading live platform metrics…' : error ? error : 'Live platform overview from database.'}
                    </p>
                </div>
                {!isLoading && !error && (
                    <span className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full font-medium">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                        Live
                    </span>
                )}
            </header>

            {/* KPI Cards */}
            {isLoading ? (
                <div className="flex items-center justify-center h-40">
                    <Loader2 className="w-8 h-8 text-slate-500 animate-spin" />
                </div>
            ) : error ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center text-red-400">
                    <p className="font-semibold">{error}</p>
                    <p className="text-sm text-slate-400 mt-1">Stats will appear here once the API is reachable.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {kpiCards.map((stat, i) => (
                        <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm hover:border-slate-700 transition-colors">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-slate-400">{stat.label}</p>
                                    <h3 className="text-2xl font-bold mt-2">{stat.value}</h3>
                                </div>
                                <div className="p-3 bg-blue-500/10 rounded-lg">
                                    <stat.icon className="w-5 h-5 text-blue-500" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-sm">
                                <span className="text-slate-500">{stat.change}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Charts Section */}
            {!isLoading && !error && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <h3 className="text-lg font-semibold mb-1">Device Submissions (6 Months)</h3>
                        <p className="text-xs text-slate-500 mb-6">Real monthly device submission volume</p>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={volumeData}>
                                    <defs>
                                        <linearGradient id="colorDevices" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis dataKey="name" stroke="#64748b" tickMargin={10} />
                                    <YAxis stroke="#64748b" allowDecimals={false} />
                                    <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                                    <Area type="monotone" dataKey="devices" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorDevices)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <h3 className="text-lg font-semibold mb-1">Weekly Ticket Volume</h3>
                        <p className="text-xs text-slate-500 mb-6">Tickets created in the last 7 days</p>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weeklyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis dataKey="name" stroke="#64748b" tickMargin={10} />
                                    <YAxis stroke="#64748b" allowDecimals={false} />
                                    <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} cursor={{ fill: '#1e293b' }} />
                                    <Bar dataKey="tickets" fill="#10b981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
