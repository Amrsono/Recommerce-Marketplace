"use client";

import { useState, useEffect, useMemo } from 'react';
import { 
    ShieldAlert, CheckCircle2, Clock, CalendarClock, 
    Search, Info, AlertTriangle,
    Zap, Calendar, Check, Store, Home, MapPin, Navigation
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

type EvaluationMethod = 'home-visit' | 'store' | string;

type Ticket = {
    id: string;
    device: string;
    status: 'OPEN' | 'PRICING_ESTIMATED' | 'ENGINEER_VISIT_SCHEDULED' | 'STORE_VISIT_SCHEDULED' | 'RESOLVED' | 'REJECTED';
    slaDeadline: string;
    isUrgent: boolean;
    scheduledVisit?: string;
    visitStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
    evaluationMethod?: EvaluationMethod;
    storeName?: string | null;
    storeAddress?: string | null;
    estimatedVal?: number | null;
    condition?: string;
};

export default function KanbanCommandCenter() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<'ALL' | 'URGENT' | 'ACTIVE'>('ALL');
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [selectedTicketForSchedule, setSelectedTicketForSchedule] = useState<Ticket | null>(null);
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');
    const { t } = useLanguage();

    const fetchTickets = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/tickets`);
            const data = await res.json();
            if (data.success && Array.isArray(data.tickets)) {
                const formattedTickets = data.tickets.map((t: any) => {
                    const date = new Date(t.slaDeadline);
                    const now = new Date();
                    const diffHours = Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60));
                    return {
                        ...t,
                        slaDeadline: diffHours > 0 ? `${diffHours}h remaining` : 'Completed'
                    };
                });
                setTickets(formattedTickets);
            }
        } catch (err) {
            console.error("Failed to fetch tickets", err);
        }
    };

    useEffect(() => {
        fetchTickets();
        const interval = setInterval(fetchTickets, 5000);
        return () => clearInterval(interval);
    }, []);

    const updateStatus = async (ticketId: string, newStatus: Ticket['status']) => {
        setIsUpdating(ticketId);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/tickets/${ticketId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) await fetchTickets();
        } catch (err) {
            console.error("Failed to update status", err);
        } finally {
            setIsUpdating(null);
        }
    };

    const markArrived = async (ticketId: string) => {
        setIsUpdating(ticketId);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/tickets/${ticketId}/mark-arrived`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            if (res.ok) await fetchTickets();
        } catch (err) {
            console.error("Failed to mark arrived", err);
        } finally {
            setIsUpdating(null);
        }
    };

    const filteredTickets = useMemo(() => {
        return tickets.filter(t => {
            const matchesSearch = t.device.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                t.id.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = activeFilter === 'ALL' ||
                                (activeFilter === 'URGENT' && t.isUrgent) ||
                                (activeFilter === 'ACTIVE' && t.status !== 'RESOLVED');
            return matchesSearch && matchesFilter;
        });
    }, [tickets, searchTerm, activeFilter]);

    const stats = useMemo(() => ({
        total: tickets.length,
        urgent: tickets.filter(t => t.isUrgent).length,
        open: tickets.filter(t => t.status === 'OPEN').length,
        priced: tickets.filter(t => t.status === 'PRICING_ESTIMATED').length,
        scheduled: tickets.filter(t => t.status === 'ENGINEER_VISIT_SCHEDULED').length,
        storeVisit: tickets.filter(t => t.status === 'STORE_VISIT_SCHEDULED').length,
        resolved: tickets.filter(t => t.status === 'RESOLVED').length,
    }), [tickets]);

    const toggleUrgency = async (ticketId: string, currentUrgency: boolean) => {
        setIsUpdating(ticketId);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/tickets/${ticketId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isUrgent: !currentUrgency }),
            });
            if (res.ok) await fetchTickets();
        } catch (err) {
            console.error("Failed to toggle urgency", err);
        } finally {
            setIsUpdating(null);
        }
    };

    const handleScheduleVisit = async () => {
        if (!selectedTicketForSchedule || !scheduleDate || !scheduleTime) return;
        setIsUpdating(selectedTicketForSchedule.id);
        try {
            const dateTime = `${scheduleDate}T${scheduleTime}:00`;
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/tickets/${selectedTicketForSchedule.id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scheduledVisit: dateTime, visitStatus: 'PENDING' }),
            });
            if (res.ok) {
                setSelectedTicketForSchedule(null);
                setScheduleDate('');
                setScheduleTime('');
                await fetchTickets();
            }
        } catch (err) {
            console.error("Failed to schedule visit", err);
        } finally {
            setIsUpdating(null);
        }
    };

    // ── Ticket Card ──────────────────────────────────────────────────────────
    const renderTicketCard = (ticket: Ticket, options: {
        nextStatus?: Ticket['status'];
        actionLabel?: string;
        ActionIcon?: any;
        actionColor?: string;
        onAction?: (ticket: Ticket) => void;
        customAction?: React.ReactNode;
    }) => {
        const isStore = ticket.evaluationMethod === 'store';

        return (
            <div
                key={ticket.id}
                className={`group relative bg-slate-950/80 border ${ticket.isUrgent ? 'border-red-500/20 shadow-red-500/5' : 'border-slate-800'} p-4 rounded-xl shadow-lg hover:border-blue-500/50 hover:shadow-blue-500/5 transition-all cursor-default overflow-hidden`}
            >
                {ticket.isUrgent && (
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 blur-2xl -z-10 rounded-full" />
                )}

                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono font-medium text-slate-500 px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800">
                            {ticket.id.slice(0, 8)}
                        </span>
                        {ticket.isUrgent && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 animate-pulse">
                                <Zap className="w-3 h-3 fill-current" />
                                {t('adminKanbanUrgentTag')}
                            </span>
                        )}
                        {/* Evaluation method badge */}
                        {isStore ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                                <Store className="w-2.5 h-2.5" /> Store
                            </span>
                        ) : ticket.evaluationMethod === 'home-visit' && ticket.status !== 'OPEN' && ticket.status !== 'PRICING_ESTIMATED' ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-full border border-blue-500/20">
                                <Home className="w-2.5 h-2.5" /> Home
                            </span>
                        ) : null}
                    </div>
                    <button
                        onClick={() => toggleUrgency(ticket.id, ticket.isUrgent)}
                        title={ticket.isUrgent ? t('adminKanbanRemoveUrgent') : t('adminKanbanMarkUrgent')}
                        className={`transition-colors p-1 rounded-md ${ticket.isUrgent ? 'text-red-500 hover:bg-red-500/10' : 'text-slate-600 hover:text-white hover:bg-slate-800'}`}
                    >
                        <AlertTriangle className="w-4 h-4" />
                    </button>
                </div>

                <h4 className="font-semibold text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-1">{ticket.device}</h4>

                {/* Store name sub-label */}
                {isStore && ticket.storeName && (
                    <div className="flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                        <p className="text-[11px] text-emerald-300 truncate">{ticket.storeName}</p>
                    </div>
                )}

                {/* Condition + value */}
                {(ticket.condition || ticket.estimatedVal) && (
                    <div className="flex items-center gap-2 mt-2">
                        {ticket.condition && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold border ${
                                ticket.condition === 'Mint' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                ticket.condition === 'Good' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                ticket.condition === 'Poor' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                                {ticket.condition}
                            </span>
                        )}
                        {ticket.estimatedVal && (
                            <span className="text-[10px] font-bold text-slate-300">£{ticket.estimatedVal}</span>
                        )}
                    </div>
                )}

                <div className="mt-4 flex items-center justify-between gap-2">
                    <div className="flex items-center text-[10px] text-slate-500 gap-1.5 px-2 py-1 bg-slate-900/50 rounded-lg border border-slate-800">
                        <Clock className={`w-3 h-3 ${ticket.isUrgent ? 'text-red-400' : 'text-slate-500'}`} />
                        <span className={ticket.isUrgent ? 'text-red-400 font-medium' : ''}>{ticket.slaDeadline}</span>
                    </div>

                    {options.customAction ? (
                        <div className="opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                            {options.customAction}
                        </div>
                    ) : options.nextStatus || options.onAction ? (
                        <button
                            onClick={() => {
                                if (options.onAction) {
                                    options.onAction(ticket);
                                } else if (options.nextStatus) {
                                    if (options.nextStatus === 'ENGINEER_VISIT_SCHEDULED' && ticket.status === 'PRICING_ESTIMATED') {
                                        setSelectedTicketForSchedule(ticket);
                                    } else {
                                        updateStatus(ticket.id, options.nextStatus);
                                    }
                                }
                            }}
                            disabled={isUpdating === ticket.id}
                            className={`opacity-0 group-hover:opacity-100 flex items-center gap-1.5 text-[10px] font-bold ${options.actionColor || 'bg-blue-600 hover:bg-blue-500'} text-white px-2.5 py-1.5 rounded-lg transition-all transform translate-y-2 group-hover:translate-y-0 disabled:opacity-50`}
                        >
                            {isUpdating === ticket.id ? (
                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    {options.ActionIcon && <options.ActionIcon className="w-3 h-3" />}
                                    {options.actionLabel}
                                </>
                            )}
                        </button>
                    ) : null}
                </div>
            </div>
        );
    };

    // ── Column Renderer ──────────────────────────────────────────────────────
    const getStatusColumn = (
        status: Ticket['status'],
        title: string,
        icon: React.ReactNode,
        accentClass: string,
        cardOptions: (t: Ticket) => Parameters<typeof renderTicketCard>[1]
    ) => {
        const columnTickets = filteredTickets.filter(t => t.status === status);

        return (
            <div className="flex flex-col bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-4 min-h-[600px] transition-all">
                <div className="flex items-center gap-2 font-bold mb-4 pb-4 border-b border-slate-800/50">
                    <div className={`p-1.5 rounded-lg ${accentClass}`}>
                        {icon}
                    </div>
                    <span>{title}</span>
                    <span className="ml-auto bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full border border-slate-700">
                        {columnTickets.length}
                    </span>
                </div>

                <div className="flex flex-col gap-4 overflow-y-auto">
                    {columnTickets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-600 border-2 border-dashed border-slate-800/50 rounded-xl">
                            <Info className="w-8 h-8 opacity-20 mb-2" />
                            <span className="text-xs">{t('adminKanbanNoTickets')}</span>
                        </div>
                    ) : (
                        columnTickets.map(ticket => renderTicketCard(ticket, cardOptions(ticket)))
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 min-h-screen flex flex-col">
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight">{t('adminKanbanTitle')}</h1>
                    <p className="text-slate-400 mt-2 max-w-xl">{t('adminKanbanDesc')}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Quick stats pills */}
                    <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-semibold">
                            <Store className="w-3 h-3" /> {stats.storeVisit} store
                        </span>
                        <span className="flex items-center gap-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-full font-semibold">
                            <Home className="w-3 h-3" /> {stats.scheduled} home
                        </span>
                    </div>

                    <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
                        <button
                            onClick={() => setActiveFilter('ALL')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeFilter === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            {t('adminKanbanAll')} {stats.total}
                        </button>
                        <button
                            onClick={() => setActiveFilter('URGENT')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeFilter === 'URGENT' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            {t('adminKanbanUrgent')} {stats.urgent}
                        </button>
                        <button
                            onClick={() => setActiveFilter('ACTIVE')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeFilter === 'ACTIVE' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            {t('adminKanbanActive')} {stats.total - stats.resolved}
                        </button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder={t('adminKanbanSearch')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm w-64 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600"
                        />
                    </div>
                </div>
            </header>

            {/* 5-column Kanban Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 flex-1">

                {/* Col 1 — New Intake */}
                {getStatusColumn(
                    'OPEN',
                    t('adminKanbanNewIntake'),
                    <ShieldAlert className="w-4 h-4 text-amber-500" />,
                    'bg-amber-500/10',
                    () => ({
                        nextStatus: 'PRICING_ESTIMATED',
                        actionLabel: t('adminKanbanEstimatePricing'),
                        ActionIcon: Zap,
                        actionColor: 'bg-amber-600 hover:bg-amber-500',
                    })
                )}

                {/* Col 2 — Valuation Ready */}
                {getStatusColumn(
                    'PRICING_ESTIMATED',
                    t('adminKanbanValuationReady'),
                    <Clock className="w-4 h-4 text-blue-500" />,
                    'bg-blue-500/10',
                    () => ({
                        nextStatus: 'ENGINEER_VISIT_SCHEDULED',
                        actionLabel: t('adminKanbanScheduleVisit'),
                        ActionIcon: Calendar,
                        actionColor: 'bg-blue-600 hover:bg-blue-500',
                    })
                )}

                {/* Col 3 — Engineer Home Visit */}
                {getStatusColumn(
                    'ENGINEER_VISIT_SCHEDULED',
                    t('adminKanbanEngineerOut'),
                    <CalendarClock className="w-4 h-4 text-purple-500" />,
                    'bg-purple-500/10',
                    () => ({
                        nextStatus: 'RESOLVED',
                        actionLabel: t('adminKanbanMarkResolved'),
                        ActionIcon: Check,
                        actionColor: 'bg-purple-600 hover:bg-purple-500',
                    })
                )}

                {/* Col 4 — Store Visit (NEW) */}
                {getStatusColumn(
                    'STORE_VISIT_SCHEDULED',
                    'Store Visit',
                    <Store className="w-4 h-4 text-emerald-400" />,
                    'bg-emerald-500/10',
                    (ticket) => ({
                        actionLabel: 'Mark Arrived',
                        ActionIcon: Navigation,
                        actionColor: 'bg-emerald-600 hover:bg-emerald-500',
                        onAction: () => markArrived(ticket.id),
                    })
                )}

                {/* Col 5 — Completed */}
                {getStatusColumn(
                    'RESOLVED',
                    t('adminKanbanCompleted'),
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
                    'bg-emerald-500/10',
                    () => ({})
                )}
            </div>

            {/* Schedule Home Visit Modal */}
            {selectedTicketForSchedule && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-blue-600/10 rounded-2xl">
                                <Calendar className="w-6 h-6 text-blue-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">{t('adminKanbanScheduleModalTitle')}</h3>
                                <p className="text-slate-400 text-sm">{t('adminKanbanScheduleModalDesc')}</p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">{t('adminKanbanPickupDate')}</label>
                                <input
                                    type="date"
                                    value={scheduleDate}
                                    onChange={(e) => setScheduleDate(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all [color-scheme:dark]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">{t('adminKanbanPreferredTime')}</label>
                                <input
                                    type="time"
                                    value={scheduleTime}
                                    onChange={(e) => setScheduleTime(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all [color-scheme:dark]"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setSelectedTicketForSchedule(null)}
                                className="flex-1 px-6 py-3 rounded-xl bg-slate-800 text-white font-bold text-sm hover:bg-slate-700 transition-colors"
                            >
                                {t('adminKanbanCancel')}
                            </button>
                            <button
                                onClick={handleScheduleVisit}
                                disabled={!scheduleDate || !scheduleTime || isUpdating === selectedTicketForSchedule.id}
                                className="flex-[2] px-6 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-500 transition-all disabled:opacity-50 disabled:hover:bg-blue-600 flex items-center justify-center gap-2"
                            >
                                {isUpdating === selectedTicketForSchedule.id ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    t('adminKanbanDispatchRequest')
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
