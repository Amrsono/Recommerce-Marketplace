"use client";

import { useState, useEffect, useMemo } from 'react';
import { 
    ShieldAlert, CheckCircle2, Clock, CalendarClock, 
    Search, Filter, ArrowRight, Info, AlertTriangle,
    Zap, Calendar, Check, MoreVertical
} from 'lucide-react';

type Ticket = {
    id: string;
    device: string;
    status: 'OPEN' | 'PRICING_ESTIMATED' | 'ENGINEER_VISIT_SCHEDULED' | 'RESOLVED' | 'REJECTED';
    slaDeadline: string;
    isUrgent: boolean;
    scheduledVisit?: string;
    visitStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
};

export default function KanbanCommandCenter() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<'ALL' | 'URGENT' | 'ACTIVE'>('ALL');
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [selectedTicketForSchedule, setSelectedTicketForSchedule] = useState<Ticket | null>(null);
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');

    const fetchTickets = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/tickets`);
            const data = await res.json();
            if (data.success && Array.isArray(data.tickets)) {
                // Format SLAs
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
            if (res.ok) {
                await fetchTickets();
            }
        } catch (err) {
            console.error("Failed to update status", err);
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

    const stats = useMemo(() => {
        return {
            total: tickets.length,
            urgent: tickets.filter(t => t.isUrgent).length,
            open: tickets.filter(t => t.status === 'OPEN').length,
            priced: tickets.filter(t => t.status === 'PRICING_ESTIMATED').length,
            scheduled: tickets.filter(t => t.status === 'ENGINEER_VISIT_SCHEDULED').length,
            resolved: tickets.filter(t => t.status === 'RESOLVED').length,
        };
    }, [tickets]);

    const toggleUrgency = async (ticketId: string, currentUrgency: boolean) => {
        setIsUpdating(ticketId);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/tickets/${ticketId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isUrgent: !currentUrgency }),
            });
            if (res.ok) {
                await fetchTickets();
            }
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
                body: JSON.stringify({ 
                    scheduledVisit: dateTime,
                    visitStatus: 'PENDING'
                }),
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

    const getStatusColumn = (status: Ticket['status'], title: string, icon: React.ReactNode, nextStatus?: Ticket['status'], actionLabel?: string, ActionIcon?: any) => {
        const columnTickets = filteredTickets.filter(t => t.status === status);

        return (
            <div className="flex flex-col bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-4 min-h-[600px] transition-all">
                <div className="flex items-center gap-2 font-bold mb-4 pb-4 border-b border-slate-800/50">
                    <div className="p-1.5 bg-slate-800 rounded-lg">
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
                            <span className="text-xs">No tickets</span>
                        </div>
                    ) : (
                        columnTickets.map(ticket => (
                            <div 
                                key={ticket.id} 
                                className={`group relative bg-slate-950/80 border ${ticket.isUrgent ? 'border-red-500/20 shadow-red-500/5' : 'border-slate-800'} p-4 rounded-xl shadow-lg hover:border-blue-500/50 hover:shadow-blue-500/5 transition-all cursor-default overflow-hidden`}
                            >
                                {/* Urgency Glow */}
                                {ticket.isUrgent && (
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 blur-2xl -z-10 rounded-full" />
                                )}

                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-mono font-medium text-slate-500 px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800">{ticket.id}</span>
                                        {ticket.isUrgent && (
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 animate-pulse">
                                                <Zap className="w-3 h-3 fill-current" />
                                                URGENT
                                            </span>
                                        )}
                                    </div>
                                    <button 
                                        onClick={() => toggleUrgency(ticket.id, ticket.isUrgent)}
                                        title={ticket.isUrgent ? "Remove Urgent Flag" : "Mark as Urgent"}
                                        className={`transition-colors p-1 rounded-md ${ticket.isUrgent ? 'text-red-500 hover:bg-red-500/10' : 'text-slate-600 hover:text-white hover:bg-slate-800'}`}
                                    >
                                        <AlertTriangle className="w-4 h-4" />
                                    </button>
                                </div>

                                <h4 className="font-semibold text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-1">{ticket.device}</h4>
                                
                                <div className="mt-4 flex items-center justify-between">
                                    <div className="flex items-center text-[10px] text-slate-500 gap-1.5 px-2 py-1 bg-slate-900/50 rounded-lg border border-slate-800">
                                        <Clock className={`w-3 h-3 ${ticket.isUrgent ? 'text-red-400' : 'text-slate-500'}`} />
                                        <span className={ticket.isUrgent ? 'text-red-400 font-medium' : ''}>{ticket.slaDeadline}</span>
                                    </div>

                                    {nextStatus && (
                                        <button 
                                            onClick={() => {
                                                if (actionLabel === 'Schedule Visit') {
                                                    setSelectedTicketForSchedule(ticket);
                                                } else {
                                                    updateStatus(ticket.id, nextStatus);
                                                }
                                            }}
                                            disabled={isUpdating === ticket.id}
                                            className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 text-[10px] font-bold bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1.5 rounded-lg transition-all transform translate-y-2 group-hover:translate-y-0 disabled:opacity-50"
                                        >
                                            {isUpdating === ticket.id ? (
                                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    {ActionIcon && <ActionIcon className="w-3 h-3" />}
                                                    {actionLabel}
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 min-h-screen flex flex-col">
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight">Ticket Command</h1>
                    <p className="text-slate-400 mt-2 max-w-xl">
                        Fleet-wide orchestration of device evaluations, pricing workflows, and engineer dispatches.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
                        <button 
                            onClick={() => setActiveFilter('ALL')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeFilter === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            All {stats.total}
                        </button>
                        <button 
                            onClick={() => setActiveFilter('URGENT')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeFilter === 'URGENT' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            Urgent {stats.urgent}
                        </button>
                        <button 
                            onClick={() => setActiveFilter('ACTIVE')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeFilter === 'ACTIVE' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            Active {stats.total - stats.resolved}
                        </button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="Search fleet..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm w-64 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600"
                        />
                    </div>
                </div>
            </header>

            {/* Matrix View */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 flex-1">
                {getStatusColumn(
                    'OPEN', 
                    'New Intake', 
                    <ShieldAlert className="w-4 h-4 text-amber-500" />,
                    'PRICING_ESTIMATED',
                    'Estimate Pricing',
                    Zap
                )}
                {getStatusColumn(
                    'PRICING_ESTIMATED', 
                    'Valuation Ready', 
                    <Clock className="w-4 h-4 text-blue-500" />,
                    'ENGINEER_VISIT_SCHEDULED',
                    'Schedule Visit',
                    Calendar
                )}
                {getStatusColumn(
                    'ENGINEER_VISIT_SCHEDULED', 
                    'Engineer Out', 
                    <CalendarClock className="w-4 h-4 text-purple-500" />,
                    'RESOLVED',
                    'Mark Resolved',
                    Check
                )}
                {getStatusColumn(
                    'RESOLVED', 
                    'Completed', 
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                )}
            </div>

            {/* Schedule Modal */}
            {selectedTicketForSchedule && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-blue-600/10 rounded-2xl">
                                <Calendar className="w-6 h-6 text-blue-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Schedule Visit</h3>
                                <p className="text-slate-400 text-sm">Propose a pickup date for this device.</p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Pickup Date</label>
                                <input 
                                    type="date" 
                                    value={scheduleDate}
                                    onChange={(e) => setScheduleDate(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all [color-scheme:dark]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Preferred Time</label>
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
                                Cancel
                            </button>
                            <button 
                                onClick={handleScheduleVisit}
                                disabled={!scheduleDate || !scheduleTime || isUpdating === selectedTicketForSchedule.id}
                                className="flex-[2] px-6 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-500 transition-all disabled:opacity-50 disabled:hover:bg-blue-600 flex items-center justify-center gap-2"
                            >
                                {isUpdating === selectedTicketForSchedule.id ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    "Dispatch Request"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
