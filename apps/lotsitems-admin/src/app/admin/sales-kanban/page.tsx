"use client";

import { useState, useEffect, useMemo } from 'react';
import { 
    Gavel, CheckCircle2, Clock, Truck, ShieldAlert,
    Search, Info, Zap, Check, ChevronRight, X, 
    Smartphone, User, DollarSign, ExternalLink, Package, Hash, CreditCard
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminTheme } from '@/contexts/ThemeContext';
import Link from 'next/link';

type MarketListing = {
    id: string;
    title: string;
    description: string;
    basePrice: number;
    currentBid: number | null;
    condition: string;
    make: string;
    model: string;
    storage: string;
    images: any;
    sellerId: string;
    status: 'AVAILABLE' | 'SOLD' | 'CANCELLED';
    seller?: { id: string; name: string | null; email: string };
    bids?: Array<{ id: string; amount: number; status: string; buyer: { name: string | null; email: string } }>;
    createdAt: string;
};

type Order = {
    id: string;
    listingId: string;
    buyerId: string;
    status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED';
    totalAmount: number;
    listing: MarketListing;
    buyer?: { id: string; name: string | null; email: string };
    createdAt: string;
    updatedAt: string;
};

const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    PENDING:   { label: 'Awaiting Payment',   color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20' },
    PAID:      { label: 'Awaiting Shipment',  color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20' },
    SHIPPED:   { label: 'Shipped & In Transit', color: 'text-purple-400',  bg: 'bg-purple-500/10 border-purple-500/20' },
    DELIVERED: { label: 'Delivered / Completed', color: 'text-green-400',   bg: 'bg-green-500/10 border-green-500/20' },
};

export default function SalesKanbanCenter() {
    const { t } = useLanguage();
    const { config } = useAdminTheme();
    
    const [listings, setListings] = useState<MarketListing[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [isAccepting, setIsAccepting] = useState<string | null>(null);
    const [selectedItemDetail, setSelectedItemDetail] = useState<{ type: 'listing' | 'order'; item: any } | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const fetchData = async () => {
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api';
            const [listingsRes, ordersRes] = await Promise.all([
                fetch(`${apiBase}/marketplace/admin/listings`),
                fetch(`${apiBase}/marketplace/admin/orders`)
            ]);
            
            const listingsData = await listingsRes.json();
            const ordersData = await ordersRes.json();
            
            if (listingsData.success) {
                setListings(listingsData.listings);
            }
            if (ordersData.success) {
                setOrders(ordersData.orders);
            }
        } catch (err) {
            console.error("Failed to fetch admin sales kanban data", err);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 8000);
        return () => clearInterval(interval);
    }, []);

    const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
        setIsUpdating(orderId);
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api';
            const res = await fetch(`${apiBase}/marketplace/admin/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                await fetchData();
                if (selectedItemDetail && selectedItemDetail.type === 'order' && selectedItemDetail.item.id === orderId) {
                    const data = await res.json();
                    if (data.success) {
                        setSelectedItemDetail({ type: 'order', item: data.order });
                    }
                }
            }
        } catch (err) {
            console.error("Failed to update order status", err);
        } finally {
            setIsUpdating(null);
        }
    };

    const acceptBestBid = async (e: React.MouseEvent, listing: MarketListing) => {
        e.stopPropagation();
        const topBid = listing.bids?.[0];
        if (!topBid) return;
        if (!confirm(`Accept top bid of $${topBid.amount} from ${topBid.buyer?.name || topBid.buyer?.email}? This will create an order and close bidding.`)) return;
        setIsAccepting(listing.id);
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api';
            const res = await fetch(`${apiBase}/marketplace/listings/${listing.id}/accept-bid`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bidId: topBid.id }),
            });
            if (res.ok) {
                await fetchData();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to accept bid');
            }
        } catch (err) {
            console.error('Failed to accept bid:', err);
            alert('Network error accepting bid');
        } finally {
            setIsAccepting(null);
        }
    };

    const openListingDetail = async (listing: MarketListing) => {
        setDetailLoading(true);
        setSelectedItemDetail({ type: 'listing', item: listing });
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api';
            const res = await fetch(`${apiBase}/marketplace/listings/${listing.id}`);
            const data = await res.json();
            if (data.success) {
                setSelectedItemDetail({ type: 'listing', item: data.listing });
            }
        } catch (err) {
            console.error("Failed to load listing details:", err);
        } finally {
            setDetailLoading(false);
        }
    };

    const openOrderDetail = (order: Order) => {
        setSelectedItemDetail({ type: 'order', item: order });
    };

    // Filter items based on search and filters
    const filteredListings = useMemo(() => {
        return listings.filter(l => {
            const matchesSearch = l.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 l.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 l.id.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = activeFilter === 'ALL' ||
                                 (activeFilter === 'ACTIVE' && l.status === 'AVAILABLE') ||
                                 (activeFilter === 'COMPLETED' && l.status === 'SOLD');
            return matchesSearch && matchesFilter;
        });
    }, [listings, searchTerm, activeFilter]);

    const filteredOrders = useMemo(() => {
        return orders.filter(o => {
            const matchesSearch = o.listing?.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 o.listing?.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 (o.buyer?.name && o.buyer.name.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesFilter = activeFilter === 'ALL' ||
                                 (activeFilter === 'ACTIVE' && o.status !== 'DELIVERED') ||
                                 (activeFilter === 'COMPLETED' && o.status === 'DELIVERED');
            return matchesSearch && matchesFilter;
        });
    }, [orders, searchTerm, activeFilter]);

    const stats = useMemo(() => ({
        totalListings: listings.length,
        activeBidding: listings.filter(l => l.status === 'AVAILABLE').length,
        totalOrders: orders.length,
        pendingPayment: orders.filter(o => o.status === 'PENDING').length,
        paidAwaiting: orders.filter(o => o.status === 'PAID').length,
        shipped: orders.filter(o => o.status === 'SHIPPED').length,
        delivered: orders.filter(o => o.status === 'DELIVERED').length,
    }), [listings, orders]);

    // Render active listing card (Bidding phase)
    const renderListingCard = (listing: MarketListing) => {
        const bidCount = listing.bids?.length || 0;
        return (
            <div
                key={listing.id}
                onClick={() => openListingDetail(listing)}
                className="group relative bg-slate-950/80 border border-slate-800 p-4 rounded-xl shadow-lg hover:border-blue-500/50 hover:shadow-blue-500/5 transition-all cursor-pointer overflow-hidden"
            >
                <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-mono text-slate-500 px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800">
                        {listing.id.slice(0, 8)}
                    </span>
                    <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                        {bidCount} bids
                    </span>
                </div>
                <h4 className="font-semibold text-slate-100 group-hover:text-blue-400 transition-colors truncate">{listing.make} {listing.model}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{listing.storage} • {listing.condition}</p>

                <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-900">
                    <div className="flex flex-col">
                        <span className="text-[9px] text-slate-600 uppercase font-bold">Current Bid</span>
                        <span className="text-sm font-extrabold text-emerald-400">${listing.currentBid || listing.basePrice}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={(e) => { e.stopPropagation(); openListingDetail(listing); }}
                            className="flex items-center gap-1 text-[9px] font-bold bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded-md transition-all"
                        >
                            <ExternalLink className="w-2.5 h-2.5" />
                            Details
                        </button>
                        {bidCount > 0 && (
                            <button
                                onClick={(e) => acceptBestBid(e, listing)}
                                disabled={isAccepting === listing.id}
                                className="flex items-center gap-1 text-[9px] font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-2 py-1 rounded-md transition-all"
                            >
                                {isAccepting === listing.id ? (
                                    <div className="w-2.5 h-2.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Check className="w-2.5 h-2.5" />
                                )}
                                Accept Bid
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // Render order card (Payment, Shipping stages)
    const renderOrderCard = (order: Order, options: { nextStatus?: Order['status']; label?: string; colorClass?: string; icon?: any }) => {
        return (
            <div
                key={order.id}
                onClick={() => openOrderDetail(order)}
                className="group relative bg-slate-950/80 border border-slate-800 p-4 rounded-xl shadow-lg hover:border-blue-500/50 hover:shadow-blue-500/5 transition-all cursor-pointer overflow-hidden"
            >
                <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-mono text-slate-500 px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800">
                        {order.id.slice(0, 8)}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 max-w-[120px] truncate" title={order.buyer?.name || order.buyer?.email}>
                        Buyer: {order.buyer?.name || order.buyer?.email?.split('@')[0]}
                    </span>
                </div>
                <h4 className="font-semibold text-slate-100 group-hover:text-blue-400 transition-colors truncate">{order.listing?.make} {order.listing?.model}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{order.listing?.storage} • Payout: <span className="text-slate-300 font-bold">${order.totalAmount}</span></p>

                <div className="mt-4 flex items-center justify-between gap-2">
                    <div className="text-[10px] text-slate-500 font-medium font-mono">
                        {new Date(order.createdAt).toLocaleDateString()}
                    </div>

                    {options.nextStatus && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                updateOrderStatus(order.id, options.nextStatus!);
                            }}
                            disabled={isUpdating === order.id}
                            className={`flex items-center gap-1 text-[9px] font-bold ${options.colorClass} text-white px-2 py-1 rounded-md transition-all disabled:opacity-50`}
                        >
                            {isUpdating === order.id ? (
                                <div className="w-2.5 h-2.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <options.icon className="w-2.5 h-2.5" />
                                    {options.label}
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        );
    };

    // Render full slideover details panel
    const DetailPanel = () => {
        if (!selectedItemDetail) return null;
        
        const { type, item } = selectedItemDetail;
        const isListing = type === 'listing';
        
        return (
            <div className="fixed inset-0 z-[200] flex" onClick={() => setSelectedItemDetail(null)}>
                <div className="flex-1 bg-slate-950/70 backdrop-blur-sm" />
                <div
                    className="w-full max-w-xl bg-slate-950 border-l border-slate-800 h-full overflow-y-auto shadow-2xl p-6 animate-in slide-in-from-right duration-300"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">
                        <div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                                isListing ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : ORDER_STATUS_CONFIG[item.status]?.bg + ' ' + ORDER_STATUS_CONFIG[item.status]?.color
                            }`}>
                                {isListing ? 'Active Listing' : ORDER_STATUS_CONFIG[item.status]?.label}
                            </span>
                            <h2 className="text-xl font-bold text-white mt-2">
                                {isListing ? `${item.make} ${item.model}` : `${item.listing?.make} ${item.listing?.model}`}
                            </h2>
                        </div>
                        <button onClick={() => setSelectedItemDetail(null)} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {detailLoading && (
                            <div className="flex items-center gap-3 text-slate-400 text-sm">
                                <div className="w-4 h-4 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
                                Loading details...
                            </div>
                        )}

                        {/* ID Section */}
                        <section className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">System ID</span>
                                <span className="font-mono text-xs text-white">{item.id}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Created Date</span>
                                <span className="text-xs text-white">{new Date(item.createdAt).toLocaleString()}</span>
                            </div>
                        </section>

                        {/* Device Info */}
                        <section className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4">
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Device Details</p>
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                                    <Smartphone className="w-5 h-5 text-blue-400" />
                                </div>
                                <div className="flex-1 min-w-0 space-y-1">
                                    <p className="font-bold text-white">{isListing ? `${item.make} ${item.model}` : `${item.listing?.make} ${item.listing?.model}`}</p>
                                    <p className="text-xs text-slate-400">Storage: {isListing ? item.storage : item.listing?.storage}</p>
                                    <p className="text-xs text-slate-400">Condition: <span className="text-white font-bold">{isListing ? item.condition : item.listing?.condition}</span></p>
                                    {item.description && (
                                        <p className="text-xs text-slate-500 mt-2 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800">{isListing ? item.description : item.listing?.description}</p>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Seller/Buyer details */}
                        <section className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4">
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                                {isListing ? 'Seller Info' : 'Buyer Info'}
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white shrink-0">
                                    {isListing ? item.seller?.name?.[0] || 'S' : item.buyer?.name?.[0] || 'B'}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white">
                                        {isListing ? item.seller?.name || 'Unknown' : item.buyer?.name || 'Unknown'}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {isListing ? item.seller?.email : item.buyer?.email}
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Financials / Bids section */}
                        {isListing ? (
                            <section className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4">
                                <div className="flex justify-between items-center mb-4">
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Active Customer Bids</p>
                                    <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-semibold">
                                        {item.bids?.length || 0} bids
                                    </span>
                                </div>
                                {!item.bids || item.bids.length === 0 ? (
                                    <p className="text-xs text-slate-600 text-center py-4">No bids placed on this listing yet.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {item.bids.map((bid: any, index: number) => (
                                            <div key={bid.id} className={`flex items-center justify-between p-3 rounded-lg border ${index === 0 ? 'bg-yellow-500/5 border-yellow-500/25' : 'bg-slate-950/40 border-slate-900'}`}>
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black ${index === 0 ? 'bg-yellow-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                                                        {index + 1}
                                                    </span>
                                                    <div>
                                                        <p className="text-xs font-semibold text-slate-200">{bid.buyer?.name || 'Anonymous'}</p>
                                                        <p className="text-[9px] text-slate-500">{bid.buyer?.email}</p>
                                                    </div>
                                                </div>
                                                <span className="text-sm font-bold text-emerald-400">${bid.amount}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        ) : (
                            <section className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 space-y-3">
                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Transaction Financials</p>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Order Amount</span>
                                    <span className="font-extrabold text-emerald-400 text-base">${item.totalAmount}</span>
                                </div>
                                
                                <div className="space-y-2 pt-3 border-t border-slate-800/80">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Change status</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {item.status === 'PENDING' && (
                                            <button onClick={() => updateOrderStatus(item.id, 'PAID')}
                                                className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-bold text-xs transition-colors">
                                                <CreditCard className="w-3.5 h-3.5" /> Mark Paid
                                            </button>
                                        )}
                                        {item.status === 'PAID' && (
                                            <button onClick={() => updateOrderStatus(item.id, 'SHIPPED')}
                                                className="w-full flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white py-2 rounded-lg font-bold text-xs transition-colors">
                                                <Truck className="w-3.5 h-3.5" /> Mark Shipped
                                            </button>
                                        )}
                                        {item.status === 'SHIPPED' && (
                                            <button onClick={() => updateOrderStatus(item.id, 'DELIVERED')}
                                                className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg font-bold text-xs transition-colors">
                                                <Check className="w-3.5 h-3.5" /> Mark Delivered
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 min-h-screen flex flex-col">
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight">Sales Command</h1>
                    <p className="text-slate-400 mt-2 max-w-xl">
                        Kanban control for secondary market listings, active bids, and order fulfillments.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
                        <button onClick={() => setActiveFilter('ALL')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeFilter === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                            All
                        </button>
                        <button onClick={() => setActiveFilter('ACTIVE')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeFilter === 'ACTIVE' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                            Active
                        </button>
                        <button onClick={() => setActiveFilter('COMPLETED')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeFilter === 'COMPLETED' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                            Completed
                        </button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search listings/orders..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm w-64 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600"
                        />
                    </div>
                </div>
            </header>

            {/* Kanban Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 flex-1">
                {/* Column 1: Active Bidding */}
                <div className="flex flex-col bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-4 min-h-[600px]">
                    <div className="flex items-center gap-2 font-bold mb-4 pb-4 border-b border-slate-800/50">
                        <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                            <Gavel className="w-4 h-4" />
                        </div>
                        <span>Active Bidding</span>
                        <span className="ml-auto bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full border border-slate-700">
                            {stats.activeBidding}
                        </span>
                    </div>
                    <div className="flex flex-col gap-4 overflow-y-auto">
                        {filteredListings.filter(l => l.status === 'AVAILABLE').length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-600 border-2 border-dashed border-slate-800/50 rounded-xl">
                                <Info className="w-8 h-8 opacity-20 mb-2" />
                                <span className="text-xs">No active listings</span>
                            </div>
                        ) : (
                            filteredListings.filter(l => l.status === 'AVAILABLE').map(renderListingCard)
                        )}
                    </div>
                </div>

                {/* Column 2: Awaiting Payment */}
                <div className="flex flex-col bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-4 min-h-[600px]">
                    <div className="flex items-center gap-2 font-bold mb-4 pb-4 border-b border-slate-800/50">
                        <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                            <Clock className="w-4 h-4" />
                        </div>
                        <span>Awaiting Payment</span>
                        <span className="ml-auto bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full border border-slate-700">
                            {stats.pendingPayment}
                        </span>
                    </div>
                    <div className="flex flex-col gap-4 overflow-y-auto">
                        {filteredOrders.filter(o => o.status === 'PENDING').length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-600 border-2 border-dashed border-slate-800/50 rounded-xl">
                                <Info className="w-8 h-8 opacity-20 mb-2" />
                                <span className="text-xs">No orders pending payment</span>
                            </div>
                        ) : (
                            filteredOrders.filter(o => o.status === 'PENDING').map(o => renderOrderCard(o, {
                                nextStatus: 'PAID',
                                label: 'Mark Paid',
                                colorClass: 'bg-blue-600 hover:bg-blue-500',
                                icon: CreditCard
                            }))
                        )}
                    </div>
                </div>

                {/* Column 3: Awaiting Shipment */}
                <div className="flex flex-col bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-4 min-h-[600px]">
                    <div className="flex items-center gap-2 font-bold mb-4 pb-4 border-b border-slate-800/50">
                        <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                            <Package className="w-4 h-4" />
                        </div>
                        <span>Paid / Processing</span>
                        <span className="ml-auto bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full border border-slate-700">
                            {stats.paidAwaiting}
                        </span>
                    </div>
                    <div className="flex flex-col gap-4 overflow-y-auto">
                        {filteredOrders.filter(o => o.status === 'PAID').length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-600 border-2 border-dashed border-slate-800/50 rounded-xl">
                                <Info className="w-8 h-8 opacity-20 mb-2" />
                                <span className="text-xs">No orders to process</span>
                            </div>
                        ) : (
                            filteredOrders.filter(o => o.status === 'PAID').map(o => renderOrderCard(o, {
                                nextStatus: 'SHIPPED',
                                label: 'Mark Shipped',
                                colorClass: 'bg-purple-600 hover:bg-purple-500',
                                icon: Truck
                            }))
                        )}
                    </div>
                </div>

                {/* Column 4: Shipped */}
                <div className="flex flex-col bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-4 min-h-[600px]">
                    <div className="flex items-center gap-2 font-bold mb-4 pb-4 border-b border-slate-800/50">
                        <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                            <Truck className="w-4 h-4" />
                        </div>
                        <span>Shipped</span>
                        <span className="ml-auto bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full border border-slate-700">
                            {stats.shipped}
                        </span>
                    </div>
                    <div className="flex flex-col gap-4 overflow-y-auto">
                        {filteredOrders.filter(o => o.status === 'SHIPPED').length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-600 border-2 border-dashed border-slate-800/50 rounded-xl">
                                <Info className="w-8 h-8 opacity-20 mb-2" />
                                <span className="text-xs">No shipped orders</span>
                            </div>
                        ) : (
                            filteredOrders.filter(o => o.status === 'SHIPPED').map(o => renderOrderCard(o, {
                                nextStatus: 'DELIVERED',
                                label: 'Mark Delivered',
                                colorClass: 'bg-emerald-600 hover:bg-emerald-500',
                                icon: Check
                            }))
                        )}
                    </div>
                </div>

                {/* Column 5: Delivered */}
                <div className="flex flex-col bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-4 min-h-[600px]">
                    <div className="flex items-center gap-2 font-bold mb-4 pb-4 border-b border-slate-800/50">
                        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <span>Delivered</span>
                        <span className="ml-auto bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full border border-slate-700">
                            {stats.delivered}
                        </span>
                    </div>
                    <div className="flex flex-col gap-4 overflow-y-auto">
                        {filteredOrders.filter(o => o.status === 'DELIVERED').length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-600 border-2 border-dashed border-slate-800/50 rounded-xl">
                                <Info className="w-8 h-8 opacity-20 mb-2" />
                                <span className="text-xs">No delivered orders</span>
                            </div>
                        ) : (
                            filteredOrders.filter(o => o.status === 'DELIVERED').map(o => renderOrderCard(o, {}))
                        )}
                    </div>
                </div>
            </div>

            {/* Slide-over Detail Panel */}
            {selectedItemDetail && <DetailPanel />}
        </div>
    );
}
