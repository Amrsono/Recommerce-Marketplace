"use client";

import { useState, useEffect, useMemo } from 'react';
import { 
    ShieldAlert, CheckCircle2, Clock, CalendarClock, 
    Search, Info, AlertTriangle,
    Zap, Calendar, Check, Store, Home, MapPin, Navigation,
    X, Smartphone, User, DollarSign, Gavel, ChevronRight,
    ExternalLink, Package, Hash
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
    specs?: any;
};

type TicketDetail = Ticket & {
    customer?: { id: string; name: string | null; email: string; trustScore: number };
    bids?: Array<{ id: string; amount: number; status: string; createdAt: string; vendor: { id: string; name: string | null; email: string } }>;
    messages?: Array<{ id: string; content: string; createdAt: string; sender: { name: string | null; email: string } }>;
    createdAt?: string;
    updatedAt?: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    OPEN:                       { label: 'New Intake',         color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20' },
    PRICING_ESTIMATED:          { label: 'Valuation Ready',    color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20' },
    ENGINEER_VISIT_SCHEDULED:   { label: 'Engineer Out',       color: 'text-purple-400',  bg: 'bg-purple-500/10 border-purple-500/20' },
    STORE_VISIT_SCHEDULED:      { label: 'Store Visit',        color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    RESOLVED:                   { label: 'Completed',          color: 'text-green-400',   bg: 'bg-green-500/10 border-green-500/20' },
    REJECTED:                   { label: 'Rejected',           color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20' },
};

export default function KanbanCommandCenter() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<'ALL' | 'URGENT' | 'ACTIVE'>('ALL');
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [selectedTicketForSchedule, setSelectedTicketForSchedule] = useState<Ticket | null>(null);
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');
    const [detailTicket, setDetailTicket] = useState<TicketDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
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

    const openDetail = async (ticket: Ticket) => {
        setDetailLoading(true);
        setDetailTicket({ ...ticket });
        try {
            const [ticketRes, bidsRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/tickets/${ticket.id}`),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/bids/ticket/${ticket.id}`),
            ]);
            const ticketData = await ticketRes.json();
            const bidsData = await bidsRes.json();

            const fullTicket = ticketData.success ? ticketData.ticket : {};
            const bids = bidsData.success ? bidsData.bids : [];

            setDetailTicket({
                ...ticket,
                customer: fullTicket.customer,
                specs: fullTicket.device?.specs,
                bids,
                messages: fullTicket.messages,
                createdAt: fullTicket.createdAt,
                updatedAt: fullTicket.updatedAt,
            });
        } catch (err) {
            console.error('Failed to fetch ticket detail', err);
        } finally {
            setDetailLoading(false);
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
                onClick={() => openDetail(ticket)}
                className={`group relative bg-slate-950/80 border ${ticket.isUrgent ? 'border-red-500/20 shadow-red-500/5' : 'border-slate-800'} p-4 rounded-xl shadow-lg hover:border-blue-500/50 hover:shadow-blue-500/5 transition-all cursor-pointer overflow-hidden`}
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
                    <div className="flex items-center gap-1">
                        <button
                            onClick={(e) => { e.stopPropagation(); toggleUrgency(ticket.id, ticket.isUrgent); }}
                            title={ticket.isUrgent ? t('adminKanbanRemoveUrgent') : t('adminKanbanMarkUrgent')}
                            className={`transition-colors p-1 rounded-md ${ticket.isUrgent ? 'text-red-500 hover:bg-red-500/10' : 'text-slate-600 hover:text-white hover:bg-slate-800'}`}
                        >
                            <AlertTriangle className="w-4 h-4" />
                        </button>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400 transition-colors" />
                    </div>
                </div>

                <h4 className="font-semibold text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-1">{ticket.device}</h4>

                {isStore && ticket.storeName && (
                    <div className="flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                        <p className="text-[11px] text-emerald-300 truncate">{ticket.storeName}</p>
                    </div>
                )}

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
                        <div onClick={e => e.stopPropagation()} className="opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                            {options.customAction}
                        </div>
                    ) : options.nextStatus || options.onAction ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
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

    // ── Ticket Detail Panel ──────────────────────────────────────────────────
    const DetailPanel = () => {
        if (!detailTicket) return null;
        const cfg = STATUS_CONFIG[detailTicket.status] || STATUS_CONFIG['OPEN'];
        const specs = detailTicket.specs
            ? (typeof detailTicket.specs === 'string' ? JSON.parse(detailTicket.specs) : detailTicket.specs)
            : {};

        return (
            <div className="fixed inset-0 z-[200] flex" onClick={() => setDetailTicket(null)}>
                {/* Backdrop */}
                <div className="flex-1 bg-slate-950/70 backdrop-blur-sm" />

                {/* Panel */}
                <div
                    className="w-full max-w-xl bg-slate-950 border-l border-slate-800 h-full overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-300"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur border-b border-slate-800 px-6 py-4 flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
                                    {cfg.label}
                                </span>
                                {detailTicket.isUrgent && (
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 animate-pulse">
                                        <Zap className="w-3 h-3 fill-current" /> URGENT
                                    </span>
                                )}
                            </div>
                            <h2 className="text-lg font-bold text-white leading-tight">{detailTicket.device}</h2>
                        </div>
                        <button onClick={() => setDetailTicket(null)} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        {detailLoading && (
                            <div className="flex items-center gap-3 text-slate-400 text-sm py-4">
                                <div className="w-4 h-4 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
                                Loading full details...
                            </div>
                        )}

                        {/* Ticket ID + timestamps */}
                        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2">
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Ticket Info</p>
                            <div className="flex items-center gap-2 text-sm">
                                <Hash className="w-4 h-4 text-slate-500 shrink-0" />
                                <span className="text-slate-400">ID</span>
                                <span className="ml-auto font-mono text-slate-200 text-xs">{detailTicket.id}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                                <span className="text-slate-400">SLA</span>
                                <span className={`ml-auto font-semibold text-sm ${detailTicket.isUrgent ? 'text-red-400' : 'text-slate-200'}`}>{detailTicket.slaDeadline}</span>
                            </div>
                            {detailTicket.createdAt && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
                                    <span className="text-slate-400">Submitted</span>
                                    <span className="ml-auto text-slate-200 text-xs">{new Date(detailTicket.createdAt).toLocaleString()}</span>
                                </div>
                            )}
                            {detailTicket.scheduledVisit && (
                                <div className="flex items-center gap-2 text-sm">
                                    <CalendarClock className="w-4 h-4 text-purple-400 shrink-0" />
                                    <span className="text-slate-400">Scheduled Visit</span>
                                    <span className="ml-auto text-purple-300 text-xs font-semibold">{new Date(detailTicket.scheduledVisit).toLocaleString()}</span>
                                </div>
                            )}
                        </section>

                        {/* Device */}
                        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Device</p>
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                                    <Smartphone className="w-5 h-5 text-blue-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-white">{detailTicket.device}</p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {detailTicket.condition && (
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                                                detailTicket.condition === 'Mint' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                detailTicket.condition === 'Good' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                detailTicket.condition === 'Poor' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                'bg-red-500/10 text-red-400 border-red-500/20'
                                            }`}>
                                                {detailTicket.condition}
                                            </span>
                                        )}
                                        {detailTicket.estimatedVal && (
                                            <span className="text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                                                AI Value: £{detailTicket.estimatedVal}
                                            </span>
                                        )}
                                        {detailTicket.evaluationMethod && (
                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                                detailTicket.evaluationMethod === 'store'
                                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                    : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                            }`}>
                                                {detailTicket.evaluationMethod === 'store' ? '🏪 Store Drop-off' : '🏠 Home Visit'}
                                            </span>
                                        )}
                                    </div>
                                    {/* Specs */}
                                    {Object.keys(specs).length > 0 && (
                                        <div className="mt-3 space-y-1.5">
                                            {Object.entries(specs).filter(([k]) => !['evaluationMethod','address'].includes(k)).map(([k, v]) => (
                                                <div key={k} className="flex justify-between text-xs">
                                                    <span className="text-slate-500 capitalize">{k}</span>
                                                    <span className="text-slate-300 font-medium">{String(v)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {detailTicket.storeName && (
                                        <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-300">
                                            <MapPin className="w-3.5 h-3.5" />{detailTicket.storeName}
                                        </div>
                                    )}
                                    {specs.address && (
                                        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                                            <Navigation className="w-3 h-3" />{specs.address}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Customer */}
                        {detailTicket.customer && (
                            <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Customer</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                                        <User className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white">{detailTicket.customer.name || 'Unknown'}</p>
                                        <p className="text-xs text-slate-400">{detailTicket.customer.email}</p>
                                        <p className="text-[10px] text-slate-500 mt-0.5">Trust Score: <span className="text-blue-400 font-bold">{detailTicket.customer.trustScore}</span></p>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Bids */}
                        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Vendor Bids</p>
                                {detailTicket.bids && detailTicket.bids.length > 0 && (
                                    <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-semibold">
                                        {detailTicket.bids.length} bid{detailTicket.bids.length !== 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                            {!detailTicket.bids || detailTicket.bids.length === 0 ? (
                                <div className="flex flex-col items-center py-6 text-slate-600">
                                    <Gavel className="w-7 h-7 opacity-30 mb-2" />
                                    <p className="text-xs">No bids yet</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {[...detailTicket.bids].sort((a, b) => b.amount - a.amount).map((bid, i) => (
                                        <div key={bid.id} className={`flex items-center gap-3 p-3 rounded-xl border ${i === 0 ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-slate-800/40 border-slate-700/50'}`}>
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                                i === 0 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-slate-700 text-slate-400'
                                            }`}>#{i + 1}</div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-slate-200 truncate">{bid.vendor?.name || bid.vendor?.email || 'Vendor'}</p>
                                                <p className="text-[10px] text-slate-500">{new Date(bid.createdAt).toLocaleString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-base font-bold ${i === 0 ? 'text-yellow-400' : 'text-slate-200'}`}>${bid.amount.toFixed(2)}</p>
                                                <p className={`text-[10px] font-semibold ${bid.status === 'ACCEPTED' ? 'text-green-400' : bid.status === 'REJECTED' ? 'text-red-400' : 'text-slate-500'}`}>{bid.status}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Recent Messages */}
                        {detailTicket.messages && detailTicket.messages.length > 0 && (
                            <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Recent Messages</p>
                                <div className="space-y-2">
                                    {detailTicket.messages.slice(0, 3).map((msg) => (
                                        <div key={msg.id} className="text-xs bg-slate-800/50 rounded-xl px-3 py-2.5">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-semibold text-blue-300">{msg.sender?.name || msg.sender?.email}</span>
                                                <span className="text-slate-600">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                                            </div>
                                            <p className="text-slate-400 line-clamp-2">{msg.content}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Quick Actions */}
                        <section className="space-y-2">
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Quick Actions</p>
                            {detailTicket.status === 'OPEN' && (
                                <button onClick={() => { updateStatus(detailTicket.id, 'PRICING_ESTIMATED'); setDetailTicket(null); }}
                                    className="w-full flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-3 rounded-xl font-semibold transition-colors text-sm">
                                    <Zap className="w-4 h-4" /> {t('adminKanbanEstimatePricing')}
                                </button>
                            )}
                            {detailTicket.status === 'PRICING_ESTIMATED' && (
                                <button onClick={() => { setSelectedTicketForSchedule(detailTicket); setDetailTicket(null); }}
                                    className="w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-xl font-semibold transition-colors text-sm">
                                    <Calendar className="w-4 h-4" /> {t('adminKanbanScheduleVisit')}
                                </button>
                            )}
                            {detailTicket.status === 'ENGINEER_VISIT_SCHEDULED' && (
                                <button onClick={() => { updateStatus(detailTicket.id, 'RESOLVED'); setDetailTicket(null); }}
                                    className="w-full flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-3 rounded-xl font-semibold transition-colors text-sm">
                                    <Check className="w-4 h-4" /> {t('adminKanbanMarkResolved')}
                                </button>
                            )}
                            {detailTicket.status === 'STORE_VISIT_SCHEDULED' && (
                                <button onClick={() => { markArrived(detailTicket.id); setDetailTicket(null); }}
                                    className="w-full flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-3 rounded-xl font-semibold transition-colors text-sm">
                                    <Navigation className="w-4 h-4" /> Mark Arrived
                                </button>
                            )}
                            <button
                                onClick={() => { toggleUrgency(detailTicket.id, detailTicket.isUrgent); setDetailTicket(prev => prev ? { ...prev, isUrgent: !prev.isUrgent } : null); }}
                                className={`w-full flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-colors text-sm border ${detailTicket.isUrgent ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}>
                                <AlertTriangle className="w-4 h-4" />
                                {detailTicket.isUrgent ? t('adminKanbanRemoveUrgent') : t('adminKanbanMarkUrgent')}
                            </button>
                        </section>
                    </div>
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
                    <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-semibold">
                            <Store className="w-3 h-3" /> {stats.storeVisit} store
                        </span>
                        <span className="flex items-center gap-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-full font-semibold">
                            <Home className="w-3 h-3" /> {stats.scheduled} home
                        </span>
                    </div>

                    <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
                        <button onClick={() => setActiveFilter('ALL')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeFilter === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                            {t('adminKanbanAll')} {stats.total}
                        </button>
                        <button onClick={() => setActiveFilter('URGENT')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeFilter === 'URGENT' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                            {t('adminKanbanUrgent')} {stats.urgent}
                        </button>
                        <button onClick={() => setActiveFilter('ACTIVE')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeFilter === 'ACTIVE' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}>
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
                {getStatusColumn('OPEN', t('adminKanbanNewIntake'), <ShieldAlert className="w-4 h-4 text-amber-500" />, 'bg-amber-500/10',
                    () => ({ nextStatus: 'PRICING_ESTIMATED', actionLabel: t('adminKanbanEstimatePricing'), ActionIcon: Zap, actionColor: 'bg-amber-600 hover:bg-amber-500' })
                )}
                {getStatusColumn('PRICING_ESTIMATED', t('adminKanbanValuationReady'), <Clock className="w-4 h-4 text-blue-500" />, 'bg-blue-500/10',
                    () => ({ nextStatus: 'ENGINEER_VISIT_SCHEDULED', actionLabel: t('adminKanbanScheduleVisit'), ActionIcon: Calendar, actionColor: 'bg-blue-600 hover:bg-blue-500' })
                )}
                {getStatusColumn('ENGINEER_VISIT_SCHEDULED', t('adminKanbanEngineerOut'), <CalendarClock className="w-4 h-4 text-purple-500" />, 'bg-purple-500/10',
                    () => ({ nextStatus: 'RESOLVED', actionLabel: t('adminKanbanMarkResolved'), ActionIcon: Check, actionColor: 'bg-purple-600 hover:bg-purple-500' })
                )}
                {getStatusColumn('STORE_VISIT_SCHEDULED', 'Store Visit', <Store className="w-4 h-4 text-emerald-400" />, 'bg-emerald-500/10',
                    (ticket) => ({ actionLabel: 'Mark Arrived', ActionIcon: Navigation, actionColor: 'bg-emerald-600 hover:bg-emerald-500', onAction: () => markArrived(ticket.id) })
                )}
                {getStatusColumn('RESOLVED', t('adminKanbanCompleted'), <CheckCircle2 className="w-4 h-4 text-emerald-500" />, 'bg-emerald-500/10',
                    () => ({})
                )}
            </div>

            {/* Ticket Detail Slide-Over */}
            {detailTicket && <DetailPanel />}

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
                                <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all [color-scheme:dark]" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">{t('adminKanbanPreferredTime')}</label>
                                <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all [color-scheme:dark]" />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setSelectedTicketForSchedule(null)}
                                className="flex-1 px-6 py-3 rounded-xl bg-slate-800 text-white font-bold text-sm hover:bg-slate-700 transition-colors">
                                {t('adminKanbanCancel')}
                            </button>
                            <button onClick={handleScheduleVisit}
                                disabled={!scheduleDate || !scheduleTime || isUpdating === selectedTicketForSchedule.id}
                                className="flex-[2] px-6 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-500 transition-all disabled:opacity-50 disabled:hover:bg-blue-600 flex items-center justify-center gap-2">
                                {isUpdating === selectedTicketForSchedule.id ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : t('adminKanbanDispatchRequest')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
