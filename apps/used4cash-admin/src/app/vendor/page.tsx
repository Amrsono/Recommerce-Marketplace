"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Gavel, DollarSign, Smartphone, Clock, CheckCircle } from 'lucide-react';

const getTimeLeft = (deadlineStr: string) => {
    const diff = new Date(deadlineStr).getTime() - new Date().getTime();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
};

export default function VendorDashboard() {
    const { user } = useAuth();
    const [tickets, setTickets] = useState<any[]>([]);
    const [bidAmounts, setBidAmounts] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState<string | null>(null);

    const fetchTickets = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickets`);
            const data = await res.json();
            if (data.success) {
                // Only show tickets that are waiting for pricing or open
                const openMarket = data.tickets.filter((t: any) => t.status === 'PRICING_ESTIMATED' || t.status === 'OPEN');
                setTickets(openMarket);
            }
        } catch (error) {
            console.error('Error fetching market devices:', error);
        }
    };

    useEffect(() => {
        fetchTickets();
        const interval = setInterval(fetchTickets, 10000); // Live poll every 10s
        return () => clearInterval(interval);
    }, []);

    const submitBid = async (ticketId: string) => {
        const amount = parseFloat(bidAmounts[ticketId]);
        if (!amount || isNaN(amount)) return;

        setSubmitting(ticketId);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bids`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ticketId,
                    vendorId: user?.id,
                    amount
                })
            });
            const data = await res.json();
            if (data.success) {
                alert('Bid placed successfully!');
                setBidAmounts(prev => ({ ...prev, [ticketId]: '' }));
            } else {
                alert(data.error || 'Failed to place bid');
            }
        } catch (error) {
            console.error('Error submitting bid:', error);
            alert('Network error submitting bid');
        } finally {
            setSubmitting(null);
        }
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Live Marketplace</h1>
                    <p className="text-slate-400">Review AI evaluations and submit your bids. Winning bids will be verified by our engineers.</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-900 px-4 py-2 rounded-lg border border-slate-800">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    Live Updates Active
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {tickets.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
                        <Smartphone className="w-12 h-12 text-slate-600 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium text-slate-300">Market is quiet</h3>
                        <p className="text-slate-500">No new devices available for bidding right now. Check back soon!</p>
                    </div>
                ) : (
                    tickets.map(ticket => (
                        <div key={ticket.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl shadow-black/20 flex flex-col">
                            <div className="p-6 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                            <Smartphone className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-white">{ticket.device}</h3>
                                            <p className="text-sm text-slate-400">ID: {ticket.id.split('-')[0]}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">AI Baseline</p>
                                        <p className="text-xl font-bold text-green-400">${ticket.estimatedVal || '0.00'}</p>
                                    </div>
                                </div>
                                
                                <div className="space-y-3 mb-6 bg-slate-950/50 p-4 rounded-lg border border-slate-800/50">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Condition</span>
                                        <span className="font-medium text-white">{ticket.condition || 'Good'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Storage</span>
                                        <span className="font-medium text-white">
                                            {(() => {
                                                try {
                                                    const specs = typeof ticket.specs === 'string' ? JSON.parse(ticket.specs) : ticket.specs;
                                                    return specs?.storage || '128GB';
                                                } catch (e) {
                                                    return '128GB';
                                                }
                                            })()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Time left</span>
                                        <span className="font-medium text-orange-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {getTimeLeft(ticket.slaDeadline)}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">Your Bid (USD)</label>
                                    <div className="flex gap-3">
                                        <div className="relative flex-1">
                                            <input 
                                                type="number" 
                                                value={bidAmounts[ticket.id] || ''}
                                                onChange={(e) => setBidAmounts(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white font-medium"
                                                placeholder="e.g. 875.00"
                                            />
                                            <DollarSign className="w-5 h-5 text-slate-500 absolute left-3 top-3.5" />
                                        </div>
                                        <button 
                                            onClick={() => submitBid(ticket.id)}
                                            disabled={submitting === ticket.id || !bidAmounts[ticket.id]}
                                            className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white px-6 rounded-lg font-semibold transition-colors flex items-center gap-2"
                                        >
                                            <Gavel className="w-5 h-5" />
                                            {submitting === ticket.id ? 'Placing...' : 'Place Bid'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
