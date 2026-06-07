"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
    ShoppingBag, Search, SlidersHorizontal, ArrowRight, X,
    Gavel, ChevronUp, Star, Shield, Zap, Clock, Tag,
    Smartphone, Laptop, Tablet, TrendingUp, LogOut,
    CheckCircle2, AlertTriangle, Loader2, Filter
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || '/api';

const CONDITION_COLORS: Record<string, string> = {
    Mint: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    Good: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    Poor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    Broken: "bg-red-500/20 text-red-400 border-red-500/30",
};

const DEVICE_IMAGES: Record<string, string> = {
    Apple: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?q=80&w=400&auto=format&fit=crop",
    Samsung: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?q=80&w=400&auto=format&fit=crop",
    Google: "https://images.unsplash.com/photo-1598327105854-c8674faddf79?q=80&w=400&auto=format&fit=crop",
    MacBook: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=400&auto=format&fit=crop",
    iPad: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=400&auto=format&fit=crop",
};

function getDeviceImage(listing: any): string {
    if (listing.images?.length > 0) return listing.images[0];
    for (const [key, url] of Object.entries(DEVICE_IMAGES)) {
        if (listing.make?.includes(key) || listing.model?.includes(key)) return url as string;
    }
    return "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=400&auto=format&fit=crop";
}

// ── Floating Ad Card ──────────────────────────────────────────────────────────
function FloatingAdCard({ listing, delay = 0 }: { listing: any; delay?: number }) {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setVisible(true), delay);
        return () => clearTimeout(t);
    }, [delay]);

    return (
        <div
            className={`fixed bottom-6 right-6 z-50 w-80 bg-slate-900/95 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden transition-all duration-700 ease-out cursor-pointer group ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {/* Gradient glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 to-blue-600/5 pointer-events-none" />

            {/* Header bar */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-slate-800/60">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Live Listing</span>
                </div>
                <span className="text-[10px] text-slate-500">Just now</span>
            </div>

            {/* Content */}
            <div className="flex gap-3 p-4">
                <div className="w-16 h-16 rounded-xl bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-700/50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={getDeviceImage(listing)} alt={listing.model} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-white font-bold text-sm truncate">{listing.make} {listing.model}</h4>
                    <p className="text-slate-400 text-xs mt-0.5">{listing.storage} · {listing.seller?.name || "Verified Seller"}</p>
                    <div className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold mt-1.5 ${CONDITION_COLORS[listing.condition] || "bg-slate-500/20 text-slate-400 border-slate-500/30"}`}>
                        {listing.condition}
                    </div>
                </div>
            </div>

            <div className="px-4 pb-4 flex items-center justify-between">
                <div>
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Current Bid</p>
                    <p className="text-emerald-400 font-black text-lg leading-none">${listing.currentBid || listing.basePrice}</p>
                </div>
                <Link
                    href="/marketplace"
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-full transition-all hover:scale-105 shadow-lg shadow-emerald-600/30"
                >
                    Bid Now <Gavel className="w-3 h-3" />
                </Link>
            </div>
        </div>
    );
}

// ── Listing Card ──────────────────────────────────────────────────────────────
function ListingCard({ listing, onBid }: { listing: any; onBid: (listing: any) => void }) {
    const img = getDeviceImage(listing);
    return (
        <div className="group bg-slate-900/60 border border-slate-800/60 rounded-2xl overflow-hidden hover:border-slate-700 hover:shadow-xl hover:shadow-black/30 transition-all duration-300 flex flex-col">
            {/* Image */}
            <div className="relative h-48 bg-slate-800 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt={`${listing.make} ${listing.model}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-75 group-hover:opacity-100" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                <div className="absolute top-3 left-3">
                    <span className={`px-2.5 py-1 rounded-full border text-[11px] font-bold ${CONDITION_COLORS[listing.condition] || "bg-slate-500/20 text-slate-400 border-slate-500/30"}`}>
                        {listing.condition}
                    </span>
                </div>
                <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-700">
                    {listing.storage}
                </div>
            </div>

            {/* Body */}
            <div className="p-5 flex flex-col flex-1">
                <h3 className="text-white font-bold text-base mb-0.5">{listing.make} {listing.model}</h3>
                <p className="text-slate-500 text-xs mb-4">Sold by <span className="text-slate-400 font-medium">{listing.seller?.name || "Verified Seller"}</span></p>

                {listing.description && (
                    <p className="text-slate-400 text-xs leading-relaxed mb-4 line-clamp-2">{listing.description}</p>
                )}

                <div className="mt-auto">
                    {/* Bid info */}
                    <div className="flex items-end justify-between mb-4 p-3 bg-slate-950/60 rounded-xl border border-slate-800/50">
                        <div>
                            <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Starting bid</p>
                            <p className="text-slate-400 text-sm font-bold">${listing.basePrice}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Current bid</p>
                            <p className="text-emerald-400 text-xl font-black">${listing.currentBid || listing.basePrice}</p>
                        </div>
                    </div>

                    {/* Bid count */}
                    {listing.bids?.length > 0 && (
                        <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                            <Gavel className="w-3 h-3" /> {listing.bids.length} bid{listing.bids.length !== 1 ? "s" : ""} placed
                        </p>
                    )}

                    <button
                        onClick={() => onBid(listing)}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                    >
                        <Gavel className="w-4 h-4" /> Place a Bid
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Bid Modal ─────────────────────────────────────────────────────────────────
function BidModal({ listing, onClose, onSuccess }: { listing: any; onClose: () => void; onSuccess: () => void }) {
    const { user } = useAuth();
    const router = useRouter();
    const [amount, setAmount] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const minBid = (listing.currentBid || listing.basePrice) + 1;

    const handleBid = async () => {
        if (!user) { router.push("/auth?redirect=/marketplace"); return; }
        const bid = parseFloat(amount);
        if (isNaN(bid) || bid <= (listing.currentBid || listing.basePrice)) {
            setError(`Bid must be higher than $${listing.currentBid || listing.basePrice}`);
            return;
        }
        setIsSubmitting(true);
        setError("");
        try {
            const res = await fetch(`${API}/marketplace/listings/${listing.id}/bid`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: bid, buyerId: user.id || user.email }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || "Failed to place bid");
            setSuccess(true);
            setTimeout(() => { onSuccess(); onClose(); }, 1800);
        } catch (err: any) {
            setError(err.message || "Something went wrong. Try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="relative h-40 bg-slate-800 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={getDeviceImage(listing)} alt={listing.model} className="w-full h-full object-cover opacity-50" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-900/80 hover:bg-slate-800 text-slate-300 rounded-full transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-4 left-5">
                        <h3 className="text-white font-black text-xl">{listing.make} {listing.model}</h3>
                        <p className="text-slate-400 text-sm">{listing.storage} · {listing.condition}</p>
                    </div>
                </div>

                <div className="p-6 space-y-5">
                    {success ? (
                        <div className="text-center py-6">
                            <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto mb-4" />
                            <h4 className="text-white font-bold text-xl mb-1">Bid Placed!</h4>
                            <p className="text-slate-400 text-sm">You&apos;re now the highest bidder at <span className="text-emerald-400 font-bold">${amount}</span></p>
                        </div>
                    ) : (
                        <>
                            {/* Current bid display */}
                            <div className="flex items-center justify-between p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider mb-1">Current Highest</p>
                                    <p className="text-white font-black text-2xl">${listing.currentBid || listing.basePrice}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider mb-1">Min. Next Bid</p>
                                    <p className="text-emerald-400 font-black text-2xl">${minBid}</p>
                                </div>
                            </div>

                            {/* Bid input */}
                            <div>
                                <label className="text-sm font-semibold text-slate-300 mb-2 block">Your Bid Amount ($)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">$</span>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={e => { setAmount(e.target.value); setError(""); }}
                                        placeholder={`${minBid} or more`}
                                        min={minBid}
                                        className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-4 pl-8 text-white text-xl font-bold focus:outline-none transition-colors"
                                    />
                                </div>
                                {error && (
                                    <div className="mt-2 flex items-center gap-2 text-red-400 text-sm">
                                        <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
                                    </div>
                                )}
                            </div>

                            {/* Quick bid suggestions */}
                            <div className="flex gap-2">
                                {[minBid, minBid + 10, minBid + 25, minBid + 50].map(v => (
                                    <button
                                        key={v}
                                        onClick={() => setAmount(String(v))}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${amount === String(v) ? "bg-blue-600 border-blue-500 text-white" : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600"}`}
                                    >
                                        ${v}
                                    </button>
                                ))}
                            </div>

                            {!user && (
                                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-amber-300 text-xs font-medium">
                                    <Shield className="w-4 h-4 shrink-0" /> You need to sign in to place a bid
                                </div>
                            )}

                            <button
                                onClick={handleBid}
                                disabled={isSubmitting}
                                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold py-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Placing Bid...</>
                                ) : (
                                    <><Gavel className="w-5 h-5" /> {user ? "Confirm Bid" : "Sign In to Bid"}</>
                                )}
                            </button>

                            <p className="text-center text-xs text-slate-500">
                                By bidding, you agree to purchase if your bid wins. All sales are final.
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Main Marketplace Page ─────────────────────────────────────────────────────
export default function MarketplacePage() {
    const { user, logout } = useAuth();
    const [listings, setListings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterCondition, setFilterCondition] = useState("");
    const [filterMake, setFilterMake] = useState("");
    const [sortBy, setSortBy] = useState<"price_asc" | "price_desc" | "newest">("newest");
    const [selectedListing, setSelectedListing] = useState<any | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [floatingAd, setFloatingAd] = useState<any | null>(null);
    const [showAd, setShowAd] = useState(false);

    const fetchListings = useCallback(async () => {
        try {
            const res = await fetch(`${API}/marketplace/listings`);
            const data = await res.json();
            if (data.success) {
                setListings(data.listings);
                // Show a floating ad after 2s if there are listings
                if (data.listings.length > 0) {
                    setTimeout(() => {
                        const randomIndex = Math.floor(Math.random() * data.listings.length);
                        setFloatingAd(data.listings[randomIndex]);
                        setShowAd(true);
                        // Auto-dismiss after 8s
                        setTimeout(() => setShowAd(false), 8000);
                    }, 2000);
                }
            }
        } catch (err) {
            console.error("Failed to fetch listings:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchListings(); }, [fetchListings]);

    // Filter & sort
    const filtered = listings
        .filter(l => {
            const q = search.toLowerCase();
            const matchSearch = !q || `${l.make} ${l.model} ${l.storage}`.toLowerCase().includes(q);
            const matchCondition = !filterCondition || l.condition === filterCondition;
            const matchMake = !filterMake || l.make === filterMake;
            return matchSearch && matchCondition && matchMake;
        })
        .sort((a, b) => {
            if (sortBy === "price_asc") return (a.currentBid || a.basePrice) - (b.currentBid || b.basePrice);
            if (sortBy === "price_desc") return (b.currentBid || b.basePrice) - (a.currentBid || a.basePrice);
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

    const uniqueMakes = [...new Set(listings.map(l => l.make).filter(Boolean))];

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-slate-200">
            {/* Background glow */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/8 blur-[120px] rounded-full pointer-events-none -z-10" />
            <div className="fixed bottom-1/4 right-0 w-[400px] h-[400px] bg-emerald-600/5 blur-[120px] rounded-full pointer-events-none -z-10" />

            {/* ── Nav ── */}
            <nav className="sticky top-0 z-40 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="relative w-8 h-8 overflow-hidden rounded-md border border-slate-700 bg-slate-950">
                            <Image src="/logo.png" alt="Logo" fill className="object-contain" />
                        </div>
                        <span className="font-bold text-lg text-white">Lotsitems</span>
                    </Link>

                    <div className="flex items-center gap-3">
                        {user ? (
                            <>
                                <Link href="/profile" className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:block">
                                    {user.name}
                                </Link>
                                <Link href="/offer" className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-full transition-all">
                                    Sell a Device
                                </Link>
                                <button onClick={logout} className="p-2 text-slate-500 hover:text-red-400 transition-colors">
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </>
                        ) : (
                            <>
                                <Link href="/offer" className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:flex items-center gap-1">
                                    Sell a Device <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                                <Link href="/auth?redirect=/marketplace" className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-full transition-all">
                                    Sign In to Bid
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* ── Hero Banner ── */}
            <div className="border-b border-slate-800/50">
                <div className="container mx-auto px-6 py-12">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Live Marketplace
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">
                                Buy a Used Device
                            </h1>
                            <p className="text-slate-400 text-lg max-w-xl">
                                Browse certified used devices sold directly by verified customers. Bid, win, and save.
                            </p>
                        </div>
                        <div className="flex items-center gap-6 text-center flex-shrink-0">
                            <div>
                                <p className="text-3xl font-black text-white">{listings.length}</p>
                                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Active Listings</p>
                            </div>
                            <div className="w-px h-10 bg-slate-800" />
                            <div>
                                <p className="text-3xl font-black text-emerald-400">100%</p>
                                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Verified Sellers</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Filters & Search Bar ── */}
            <div className="sticky top-[65px] z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
                <div className="container mx-auto px-6 py-3 flex flex-wrap gap-3 items-center">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search make, model, storage..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>

                    {/* Make filter */}
                    <select
                        value={filterMake}
                        onChange={e => setFilterMake(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                    >
                        <option value="">All Brands</option>
                        {uniqueMakes.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>

                    {/* Condition filter */}
                    <select
                        value={filterCondition}
                        onChange={e => setFilterCondition(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                    >
                        <option value="">All Conditions</option>
                        {["Mint", "Good", "Poor", "Broken"].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    {/* Sort */}
                    <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value as any)}
                        className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                    >
                        <option value="newest">Newest First</option>
                        <option value="price_asc">Price: Low to High</option>
                        <option value="price_desc">Price: High to Low</option>
                    </select>

                    {(filterMake || filterCondition || search) && (
                        <button
                            onClick={() => { setSearch(""); setFilterMake(""); setFilterCondition(""); }}
                            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                        >
                            <X className="w-3.5 h-3.5" /> Clear filters
                        </button>
                    )}
                </div>
            </div>

            {/* ── Main Content ── */}
            <main className="container mx-auto px-6 py-10">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden animate-pulse">
                                <div className="h-48 bg-slate-800" />
                                <div className="p-5 space-y-3">
                                    <div className="h-4 bg-slate-800 rounded-full w-3/4" />
                                    <div className="h-3 bg-slate-800 rounded-full w-1/2" />
                                    <div className="h-10 bg-slate-800 rounded-xl mt-4" />
                                    <div className="h-10 bg-slate-800 rounded-xl" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filtered.length > 0 ? (
                    <>
                        <p className="text-sm text-slate-500 mb-6">{filtered.length} listing{filtered.length !== 1 ? "s" : ""} found</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filtered.map(listing => (
                                <ListingCard key={listing.id} listing={listing} onBid={setSelectedListing} />
                            ))}
                        </div>
                    </>
                ) : (
                    /* Empty state */
                    <div className="text-center py-24">
                        <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-6">
                            <ShoppingBag className="w-10 h-10 text-slate-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">
                            {search || filterMake || filterCondition ? "No listings match your search" : "No listings yet"}
                        </h3>
                        <p className="text-slate-500 mb-8 max-w-md mx-auto">
                            {search || filterMake || filterCondition
                                ? "Try adjusting your filters to see more results."
                                : "Be the first to list your used device and reach hundreds of buyers!"}
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            {(search || filterMake || filterCondition) && (
                                <button
                                    onClick={() => { setSearch(""); setFilterMake(""); setFilterCondition(""); }}
                                    className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-full font-semibold transition-colors"
                                >
                                    Clear Filters
                                </button>
                            )}
                            <Link href="/offer" className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-semibold transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2">
                                Sell Your Device <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                )}

                {/* Trust badges */}
                {!loading && (
                    <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-slate-800/50 pt-12">
                        {[
                            { icon: Shield, title: "Verified Sellers", desc: "Every seller is verified through our AI assessment process before listing." },
                            { icon: Gavel, title: "Fair Bidding", desc: "Transparent bidding with real-time updates. Highest bid wins, always." },
                            { icon: Zap, title: "Fast Delivery", desc: "Devices ship within 48 hours of auction close to your doorstep." },
                        ].map(({ icon: Icon, title, desc }) => (
                            <div key={title} className="flex items-start gap-4 p-5 bg-slate-900/40 border border-slate-800/50 rounded-2xl">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                                    <Icon className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <h4 className="text-white font-bold mb-1">{title}</h4>
                                    <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* ── Bid Modal ── */}
            {selectedListing && (
                <BidModal
                    listing={selectedListing}
                    onClose={() => setSelectedListing(null)}
                    onSuccess={fetchListings}
                />
            )}

            {/* ── Floating Ad ── (only shown for logged-in users or anyone) */}
            {showAd && floatingAd && (
                <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="relative w-80 bg-slate-900/95 backdrop-blur-xl border border-emerald-500/30 rounded-2xl shadow-2xl shadow-emerald-900/20 overflow-hidden">
                        {/* Close button */}
                        <button
                            onClick={() => setShowAd(false)}
                            className="absolute top-2 right-2 z-10 p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>

                        {/* Animated top glow line */}
                        <div className="h-0.5 w-full bg-gradient-to-r from-emerald-500 via-blue-500 to-emerald-500 animate-pulse" />

                        <div className="flex items-center gap-2 px-4 pt-3 pb-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">Hot Listing</span>
                        </div>

                        <div className="flex gap-3 px-4 pb-4">
                            <div className="w-16 h-16 rounded-xl bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-700">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={getDeviceImage(floatingAd)} alt={floatingAd.model} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-white font-bold text-sm truncate">{floatingAd.make} {floatingAd.model}</h4>
                                <p className="text-slate-400 text-xs mt-0.5">{floatingAd.storage}</p>
                                <div className="flex items-center justify-between mt-2">
                                    <div>
                                        <p className="text-[9px] text-slate-500 uppercase font-semibold">Bid from</p>
                                        <p className="text-emerald-400 font-black text-base leading-none">${floatingAd.currentBid || floatingAd.basePrice}</p>
                                    </div>
                                    <button
                                        onClick={() => { setShowAd(false); setSelectedListing(floatingAd); }}
                                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-lg transition-all hover:scale-105"
                                    >
                                        Bid <Gavel className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
