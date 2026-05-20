"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Gavel, DollarSign, Smartphone, Clock, TrendingUp, Trophy, Medal, Award, ChevronDown, ChevronUp } from 'lucide-react';

type Bid = {
    id: string;
    amount: number;
    vendorId: string;
    status: string;
    createdAt: string;
    vendor: {
        id: string;
        name: string | null;
        email: string;
        trustScore: number;
    };
};

const getTimeLeft = (deadlineStr: string) => {
    const diff = new Date(deadlineStr).getTime() - new Date().getTime();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
};

const RankBadge = ({ rank }: { rank: number }) => {
    if (rank === 1) return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500/20 border border-yellow-500/40">
            <Trophy className="w-4 h-4 text-yellow-400" />
        </div>
    );
    if (rank === 2) return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-400/20 border border-slate-400/40">
            <Medal className="w-4 h-4 text-slate-300" />
        </div>
    );
    if (rank === 3) return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-700/20 border border-amber-700/40">
            <Award className="w-4 h-4 text-amber-600" />
        </div>
    );
    return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 border border-slate-700">
            <span className="text-xs font-bold text-slate-400">#{rank}</span>
        </div>
    );
};

export default function VendorDashboard() {
    const { user } = useAuth();
    const [tickets, setTickets] = useState<any[]>([]);
    const [bidAmounts, setBidAmounts] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState<string | null>(null);
    const [bidsMap, setBidsMap] = useState<Record<string, Bid[]>>({});
    const [expandedBids, setExpandedBids] = useState<Record<string, boolean>>({});

    const fetchBidsForTicket = useCallback(async (ticketId: string) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bids/ticket/${ticketId}`);
            const data = await res.json();
            if (data.success) {
                setBidsMap(prev => ({ ...prev, [ticketId]: data.bids }));
            }
        } catch (error) {
            console.error('Error fetching bids for ticket:', ticketId, error);
        }
    }, []);

    const fetchTickets = useCallback(async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickets`);
            const data = await res.json();
            if (data.success) {
                const openMarket = data.tickets.filter((t: any) => t.status === 'PRICING_ESTIMATED' || t.status === 'OPEN');
                setTickets(openMarket);
                // Fetch bids for all open tickets
                openMarket.forEach((t: any) => fetchBidsForTicket(t.id));
            }
        } catch (error) {
            console.error('Error fetching market devices:', error);
        }
    }, [fetchBidsForTicket]);

    useEffect(() => {
        fetchTickets();
        const interval = setInterval(fetchTickets, 10000);
        return () => clearInterval(interval);
    }, [fetchTickets]);

    const submitBid = async (ticketId: string) => {
        const amount = parseFloat(bidAmounts[ticketId]);
        if (!amount || isNaN(amount)) return;

        setSubmitting(ticketId);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bids`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticketId, vendorId: user?.id, amount })
            });
            const data = await res.json();
            if (data.success) {
                setBidAmounts(prev => ({ ...prev, [ticketId]: '' }));
                // Immediately refresh bids for this ticket
                await fetchBidsForTicket(ticketId);
                // Auto-expand bids to show the result
                setExpandedBids(prev => ({ ...prev, [ticketId]: true }));
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
                    <p className="text-slate-400">Review AI evaluations and submit your bids. All competing bids are visible for fair competition.</p>
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
                    tickets.map(ticket => {
                        const ticketBids: Bid[] = bidsMap[ticket.id] || [];
                        const myBid = ticketBids.find(b => b.vendorId === user?.id);
                        const leadingBid = ticketBids[0]; // already sorted desc by amount from API
                        const isExpanded = expandedBids[ticket.id] ?? false;
                        const myRank = myBid ? ticketBids.findIndex(b => b.vendorId === user?.id) + 1 : null;

                        return (
                            <div key={ticket.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl shadow-black/20 flex flex-col">
                                <div className="p-6 flex-1">
                                    {/* Header */}
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

                                    {/* Device specs */}
                                    <div className="space-y-3 mb-5 bg-slate-950/50 p-4 rounded-lg border border-slate-800/50">
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
                                                    } catch { return '128GB'; }
                                                })()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-400">Time left</span>
                                            <span className="font-medium text-orange-400 flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> {getTimeLeft(ticket.slaDeadline)}
                                            </span>
                                        </div>
                                        {myBid && myRank && (
                                            <div className="flex justify-between text-sm pt-2 border-t border-slate-800/60">
                                                <span className="text-slate-400">Your position</span>
                                                <span className={`font-bold ${myRank === 1 ? 'text-yellow-400' : myRank === 2 ? 'text-slate-300' : myRank === 3 ? 'text-amber-600' : 'text-slate-400'}`}>
                                                    #{myRank} of {ticketBids.length} bid{ticketBids.length !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Live Bids Leaderboard */}
                                    <div className="mb-5 rounded-xl border border-slate-800 overflow-hidden">
                                        <button
                                            onClick={() => setExpandedBids(prev => ({ ...prev, [ticket.id]: !prev[ticket.id] }))}
                                            className="w-full flex items-center justify-between px-4 py-3 bg-slate-950/60 hover:bg-slate-950/80 transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className="w-4 h-4 text-blue-400" />
                                                <span className="text-sm font-semibold text-white">Live Bid Leaderboard</span>
                                                {ticketBids.length > 0 && (
                                                    <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-medium">
                                                        {ticketBids.length} bid{ticketBids.length !== 1 ? 's' : ''}
                                                    </span>
                                                )}
                                            </div>
                                            {isExpanded
                                                ? <ChevronUp className="w-4 h-4 text-slate-400" />
                                                : <ChevronDown className="w-4 h-4 text-slate-400" />
                                            }
                                        </button>

                                        {isExpanded && (
                                            <div className="divide-y divide-slate-800/50">
                                                {ticketBids.length === 0 ? (
                                                    <div className="px-4 py-6 text-center">
                                                        <Gavel className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                                                        <p className="text-sm text-slate-500">No bids yet — be the first to bid!</p>
                                                    </div>
                                                ) : (
                                                    ticketBids.map((bid, index) => {
                                                        const rank = index + 1;
                                                        const isMe = bid.vendorId === user?.id;
                                                        // Anonymize other vendors: show "Bidder #N" based on their position
                                                        const displayName = isMe ? 'You' : `Bidder #${index + 1}`;

                                                        return (
                                                            <div
                                                                key={bid.id}
                                                                className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                                                                    isMe
                                                                        ? 'bg-blue-500/10 border-l-2 border-blue-500'
                                                                        : rank === 1
                                                                            ? 'bg-yellow-500/5'
                                                                            : 'bg-transparent'
                                                                }`}
                                                            >
                                                                <RankBadge rank={rank} />

                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`text-sm font-semibold ${isMe ? 'text-blue-300' : 'text-slate-200'}`}>
                                                                            {displayName}
                                                                        </span>
                                                                        {isMe && (
                                                                            <span className="text-[10px] bg-blue-500/30 text-blue-300 border border-blue-500/40 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                                                Your bid
                                                                            </span>
                                                                        )}
                                                                        {rank === 1 && !isMe && (
                                                                            <span className="text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                                                Leading
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="text-right">
                                                                    <span className={`text-base font-bold tabular-nums ${
                                                                        rank === 1 ? 'text-yellow-400' : isMe ? 'text-blue-300' : 'text-slate-200'
                                                                    }`}>
                                                                        ${bid.amount.toFixed(2)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Bid input */}
                                    <div className="space-y-2">
                                        {leadingBid && (
                                            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                                                <span className="flex items-center gap-1">
                                                    <Trophy className="w-3 h-3 text-yellow-400" />
                                                    Current leader:
                                                    <span className="text-yellow-400 font-bold">${leadingBid.amount.toFixed(2)}</span>
                                                </span>
                                                {myBid && myRank && myRank > 1 && (
                                                    <span className="text-orange-400 font-medium">
                                                        Bid &gt; ${leadingBid.amount.toFixed(2)} to lead
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        <label className="text-sm font-medium text-slate-300">
                                            {myBid ? 'Update Your Bid (USD)' : 'Your Bid (USD)'}
                                        </label>
                                        <div className="flex gap-3">
                                            <div className="relative flex-1">
                                                <input
                                                    type="number"
                                                    value={bidAmounts[ticket.id] || ''}
                                                    onChange={(e) => setBidAmounts(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white font-medium"
                                                    placeholder={leadingBid ? `> ${leadingBid.amount.toFixed(2)}` : 'e.g. 875.00'}
                                                />
                                                <DollarSign className="w-5 h-5 text-slate-500 absolute left-3 top-3.5" />
                                            </div>
                                            <button
                                                onClick={() => submitBid(ticket.id)}
                                                disabled={submitting === ticket.id || !bidAmounts[ticket.id]}
                                                className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white px-6 rounded-lg font-semibold transition-colors flex items-center gap-2"
                                            >
                                                <Gavel className="w-5 h-5" />
                                                {submitting === ticket.id ? 'Placing...' : myBid ? 'Update' : 'Place Bid'}
                                            </button>
                                        </div>
                                        {myBid && (
                                            <p className="text-xs text-slate-500">
                                                Your current bid: <span className="text-blue-400 font-semibold">${myBid.amount.toFixed(2)}</span>. Submitting will update it.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
