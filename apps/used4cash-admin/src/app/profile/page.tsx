"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { 
    User as UserIcon, 
    Settings, 
    Bell, 
    CreditCard, 
    History, 
    ShieldCheck, 
    MessageSquare, 
    Smartphone, 
    ArrowRight,
    ArrowLeft,
    TrendingUp,
    ExternalLink,
    CheckCircle2,
    Clock,
    DollarSign,
    Truck,
    MapPin,
    Package,
    Loader2,
    Calendar
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import OrderTracker from "@/components/OrderTracker";
import ChatInterface from "@/components/ChatInterface";

function formatStatus(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).toLowerCase().replace(/^\w/, c => c.toUpperCase());
}

function statusColor(status: string) {
    switch (status) {
        case 'OPEN': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        case 'PRICING_ESTIMATED': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        case 'ENGINEER_VISIT_SCHEDULED': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
        case 'RESOLVED': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
        case 'CANCELLED': return 'bg-red-500/20 text-red-400 border-red-500/30';
        default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
}

export default function ProfilePage() {
    const { user } = useAuth();
    const router = useRouter();
    const [profileData, setProfileData] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'orders' | 'chat' | 'payments'>('orders');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [isAccepting, setIsAccepting] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [isApproving, setIsApproving] = useState(false);

    const fetchProfile = () => {
        if (user?.email) {
            fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/profile/${user.email}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) setProfileData(data.user);
                    setIsLoading(false);
                });
        }
    };

    useEffect(() => {
        if (user) {
            if (user.role === 'VENDOR') {
                router.push('/vendor');
            } else if (user.role === 'ADMIN') {
                router.push('/admin');
            }
        }
    }, [user, router]);

    useEffect(() => {
        fetchProfile();
    }, [user]);

    if (!user) return <div className="p-8 text-white">Please sign in...</div>;
    if (user.role === 'VENDOR' || user.role === 'ADMIN') return null;

    const tickets = profileData?.tickets || [];
    const activeOrder = tickets[0];
    const selectedTicket = selectedTicketId ? tickets.find((t: any) => t.id === selectedTicketId) : null;

    const handleAcceptOffer = async (bidId: string) => {
        setIsAccepting(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/bids/${bidId}/accept`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (data.success) {
                // Refresh profile data to reflect new status
                fetchProfile();
            }
        } catch (err) {
            console.error('Failed to accept offer:', err);
        } finally {
            setIsAccepting(false);
        }
    };

    const handleRejectOffer = async (ticketId: string) => {
        setIsRejecting(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/tickets/${ticketId}/reject-offer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (data.success) {
                fetchProfile();
            }
        } catch (err) {
            console.error('Failed to reject offer:', err);
        } finally {
            setIsRejecting(false);
        }
    };

    const handleApproveVisit = async (ticketId: string) => {
        setIsApproving(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/tickets/${ticketId}/approve-visit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (data.success) {
                fetchProfile();
            }
        } catch (err) {
            console.error('Failed to approve visit:', err);
        } finally {
            setIsApproving(false);
        }
    };

    const handleOpenChatForTicket = (ticketId: string) => {
        setSelectedTicketId(null);
        setActiveTab('chat');
    };

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-slate-200">
            {/* Nav */}
             <nav className="border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="relative w-8 h-8 overflow-hidden rounded-md border border-slate-700 bg-slate-950">
                            <Image 
                                src="/logo.png" 
                                alt="used4cash Logo" 
                                fill 
                                className="object-contain"
                            />
                        </div>
                        <span className="font-bold text-lg text-white">used4cash</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <button className="p-2 text-slate-400 hover:text-white transition-colors relative">
                            <Bell className="w-5 h-5" />
                            {profileData?.notifications?.length > 0 && (
                                <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border border-[#0A0A0A]" />
                            )}
                        </button>
                        <Link href="/profile" className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white hover:scale-110 transition-transform active:scale-95 shadow-lg shadow-blue-500/20">
                            {user.name?.[0]}
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="container mx-auto px-6 py-12 max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    
                    {/* Left Sidebar */}
                    <div className="lg:col-span-3 space-y-4">
                        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-8 text-center">
                            <div className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 mx-auto mb-4 flex items-center justify-center">
                                <UserIcon className="w-10 h-10 text-slate-500" />
                            </div>
                            <h2 className="text-xl font-bold text-white">{user.name}</h2>
                            <p className="text-slate-500 text-sm mb-4">{user.email}</p>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
                                <ShieldCheck className="w-3 h-3" />
                                Trust Score: {profileData?.trustScore || 100}
                            </div>
                        </div>

                        <div className="space-y-1">
                            {[
                                { id: 'orders', label: 'My Orders', icon: History },
                                { id: 'chat', label: 'Support Chat', icon: MessageSquare },
                                { id: 'payments', label: 'Payout Methods', icon: CreditCard },
                                { id: 'settings', label: 'Settings', icon: Settings },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => { setActiveTab(item.id as any); setSelectedTicketId(null); }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                                        activeTab === item.id 
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                    }`}
                                >
                                    <item.icon className="w-4 h-4" />
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-6 space-y-8">
                        {isLoading ? (
                            <div className="animate-pulse space-y-4">
                                <div className="h-64 bg-slate-900/50 rounded-2xl" />
                                <div className="h-32 bg-slate-900/50 rounded-2xl" />
                            </div>
                        ) : (
                            <>
                                {activeTab === 'orders' && !selectedTicket && (
                                    <>
                                        {/* Active Order Tracker */}
                                        {activeOrder ? (
                                            <div 
                                                className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl relative overflow-hidden group cursor-pointer hover:border-slate-700 transition-colors"
                                                onClick={() => setSelectedTicketId(activeOrder.id)}
                                            >
                                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[80px] -z-10" />
                                                <div className="flex justify-between items-start mb-10">
                                                    <div>
                                                        <h3 className="text-2xl font-bold text-white mb-2">Track your trade-in</h3>
                                                        <p className="text-slate-500 text-sm">Order ID: <span className="text-blue-500 font-mono">{activeOrder.id.split('-')[0].toUpperCase()}</span></p>
                                                    </div>
                                                    <div className={`px-3 py-1 border rounded-lg text-xs font-bold uppercase ${statusColor(activeOrder.status)}`}>
                                                       {formatStatus(activeOrder.status)}
                                                    </div>
                                                </div>

                                                <OrderTracker status={activeOrder.status} />

                                                <div className="mt-8 flex items-center justify-between p-4 bg-slate-950/50 border border-slate-800 rounded-2xl">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-14 h-14 bg-slate-900 rounded-xl flex items-center justify-center">
                                                            <Smartphone className="w-7 h-7 text-blue-500" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-white">{activeOrder.device?.brand} {activeOrder.device?.model}</h4>
                                                            <p className="text-slate-500 text-sm">
                                                                Estimated Payout: {' '}
                                                                {activeOrder.device?.estimatedVal ? (
                                                                    <span className="text-emerald-400 font-bold">${activeOrder.device.estimatedVal}</span>
                                                                ) : (
                                                                    <span className="text-amber-400 font-medium">Pending AI evaluation</span>
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-slate-500 group-hover:text-blue-400 transition-colors">
                                                        <ArrowRight className="w-5 h-5" />
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-slate-900/50 border border-slate-800 p-12 rounded-3xl text-center">
                                                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                                    <History className="w-8 h-8 text-slate-500" />
                                                </div>
                                                <h3 className="text-xl font-bold text-white mb-2">No active orders</h3>
                                                <p className="text-slate-500 mb-8">Ready to turn your old gadget into cash?</p>
                                                <Link href="/offer" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-full font-bold transition-all shadow-xl shadow-blue-500/30">
                                                    Start selling <ArrowRight className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        )}

                                        {/* Order History List */}
                                        {tickets.length > 0 && (
                                            <div className="space-y-4">
                                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-1">Recent Activity</h3>
                                                {tickets.map((ticket: any) => (
                                                    <button
                                                        key={ticket.id}
                                                        onClick={() => setSelectedTicketId(ticket.id)}
                                                        className="w-full bg-slate-900/30 border border-slate-800/50 p-5 rounded-2xl flex items-center justify-between group hover:border-blue-500/30 hover:bg-slate-900/60 transition-all text-left"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="p-2.5 bg-slate-800 rounded-xl group-hover:bg-blue-500/10 transition-colors">
                                                                <Smartphone className="w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-colors" />
                                                            </div>
                                                            <div>
                                                                <div className="text-white font-medium">{ticket.device?.brand} {ticket.device?.model}</div>
                                                                <div className="text-slate-500 text-xs">{new Date(ticket.createdAt).toLocaleDateString()}</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <div className="text-right">
                                                                <div className="text-sm font-bold">
                                                                    {ticket.device?.estimatedVal ? (
                                                                        <span className="text-emerald-400">${ticket.device.estimatedVal}</span>
                                                                    ) : (
                                                                        <span className="text-amber-400">Pending</span>
                                                                    )}
                                                                </div>
                                                                <div className={`text-[10px] uppercase font-bold tracking-wider mt-0.5 px-2 py-0.5 rounded-full inline-block ${statusColor(ticket.status)}`}>
                                                                    {formatStatus(ticket.status)}
                                                                </div>
                                                            </div>
                                                            <div className="p-1.5 text-slate-600 group-hover:text-blue-400 transition-colors">
                                                                <ArrowRight className="w-4 h-4" />
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Ticket Detail View */}
                                {activeTab === 'orders' && selectedTicket && (
                                    <TicketDetail
                                        ticket={selectedTicket}
                                        onBack={() => setSelectedTicketId(null)}
                                        onAcceptOffer={handleAcceptOffer}
                                        onRejectOffer={handleRejectOffer}
                                        onApproveVisit={handleApproveVisit}
                                        onOpenChat={() => handleOpenChatForTicket(selectedTicket.id)}
                                        isAccepting={isAccepting}
                                        isRejecting={isRejecting}
                                        isApproving={isApproving}
                                    />
                                )}

                                {activeTab === 'chat' && (
                                    <ChatInterface ticketId={activeOrder?.id} receiverId={activeOrder?.engineerId || "1"} />
                                )}

                                {activeTab === 'payments' && (
                                    <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl">
                                        <h3 className="text-xl font-bold text-white mb-6">Payment Methods</h3>
                                        <div className="space-y-4">
                                            {profileData?.paymentMethods?.map((pm: any) => (
                                                <div key={pm.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-8 bg-slate-900 rounded overflow-hidden flex items-center justify-center border border-slate-800">
                                                            <CreditCard className="w-5 h-5 text-slate-400" />
                                                        </div>
                                                        <div>
                                                            <div className="text-white font-medium">{pm.provider} **** {pm.last4}</div>
                                                            <div className="text-slate-500 text-xs">Default Payout Method</div>
                                                        </div>
                                                    </div>
                                                    <div className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded">ACTIVE</div>
                                                </div>
                                            ))}
                                            <button className="w-full py-4 border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 hover:text-blue-400 hover:border-blue-500/50 transition-all font-medium flex items-center justify-center gap-2">
                                                Add new payout method
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Right Rails (Adverts/Stats) */}
                    <div className="lg:col-span-3 space-y-8">
                        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-3xl shadow-xl shadow-blue-600/20">
                            <h3 className="text-white font-bold mb-2">Upgrade coming soon?</h3>
                            <p className="text-blue-100 text-sm mb-6">Users who sell their iPhone 13 today are getting 15% more value than last month.</p>
                            <button className="w-full bg-white text-blue-600 py-3 rounded-xl font-bold text-sm hover:scale-105 transition-transform flex items-center justify-center gap-2">
                                Check Trending <TrendingUp className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                             <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Recommended for you</h4>
                             {[
                                { name: "MacBook Pro M2", price: "850", img: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=200&h=200&auto=format&fit=crop" },
                                { name: "iPad Air 5th Gen", price: "420", img: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=200&h=200&auto=format&fit=crop" }
                             ].map((ad, i) => (
                                 <div key={i} className="group bg-slate-900/30 border border-slate-800/50 rounded-2xl overflow-hidden hover:border-slate-700 transition-colors">
                                     <div className="h-32 bg-slate-800 relative">
                                         <img src={ad.img} alt={ad.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                     </div>
                                     <div className="p-4">
                                         <h5 className="text-white text-sm font-bold mb-1">{ad.name}</h5>
                                         <div className="flex justify-between items-center">
                                             <span className="text-blue-400 font-bold text-xs">Sell for up to ${ad.price}</span>
                                             <ExternalLink className="w-3 h-3 text-slate-600" />
                                         </div>
                                     </div>
                                 </div>
                             ))}
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}

// ─── Ticket Detail Component ──────────────────────

function TicketDetail({ ticket, onBack, onAcceptOffer, onRejectOffer, onApproveVisit, onOpenChat, isAccepting, isRejecting, isApproving }: {
    ticket: any;
    onBack: () => void;
    onAcceptOffer: (id: string) => void;
    onRejectOffer: (id: string) => void;
    onApproveVisit: (id: string) => void;
    onOpenChat: () => void;
    isAccepting: boolean;
    isRejecting: boolean;
    isApproving: boolean;
}) {
    const device = ticket.device;
    const specs = device?.specs || {};
    const isPricingEstimated = ticket.status === 'PRICING_ESTIMATED' || ticket.status === 'OPEN';
    const isResolved = ticket.status === 'RESOLVED';
    const hasEstimate = device?.estimatedVal != null;

    const [bids, setBids] = useState<any[]>([]);

    useEffect(() => {
        if (ticket.id) {
            fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/bids/ticket/${ticket.id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) setBids(data.bids);
                });
        }
    }, [ticket.id]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Back Button */}
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium group"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Orders
            </button>

            {/* Header Card */}
            <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[80px] -z-10" />
                
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-1">Order Details</h3>
                        <p className="text-slate-500 text-sm">
                            Order ID: <span className="text-blue-500 font-mono">{ticket.id.split('-')[0].toUpperCase()}</span>
                            <span className="mx-2">·</span>
                            <span>{new Date(ticket.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </p>
                    </div>
                    <div className={`px-3 py-1.5 border rounded-lg text-xs font-bold uppercase ${statusColor(ticket.status)}`}>
                        {formatStatus(ticket.status)}
                    </div>
                </div>

                <OrderTracker status={ticket.status} />
            </div>

            {/* Device Info & Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Device Card */}
                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-2.5 bg-blue-500/10 rounded-xl">
                            <Smartphone className="w-5 h-5 text-blue-400" />
                        </div>
                        <h4 className="font-bold text-white">Device Information</h4>
                    </div>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Brand</span>
                            <span className="text-slate-200 font-medium">{device?.brand}</span>
                        </div>
                        <div className="border-b border-slate-800" />
                        <div className="flex justify-between">
                            <span className="text-slate-500">Model</span>
                            <span className="text-slate-200 font-medium">{device?.model}</span>
                        </div>
                        <div className="border-b border-slate-800" />
                        <div className="flex justify-between">
                            <span className="text-slate-500">Condition</span>
                            <span className="text-slate-200 font-medium">{device?.condition}</span>
                        </div>
                        {specs.storage && (
                            <>
                                <div className="border-b border-slate-800" />
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Storage</span>
                                    <span className="text-slate-200 font-medium">{specs.storage}</span>
                                </div>
                            </>
                        )}
                        {specs.address && (
                            <>
                                <div className="border-b border-slate-800" />
                                <div className="flex justify-between items-start">
                                    <span className="text-slate-500">Pickup</span>
                                    <span className="text-slate-200 font-medium text-right max-w-[60%] truncate" title={specs.address}>
                                        {specs.address}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Pricing Card */}
                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                            <DollarSign className="w-5 h-5 text-emerald-400" />
                        </div>
                        <h4 className="font-bold text-white">Pricing & Bids</h4>
                    </div>
                    <div className="space-y-4">
                        {specs.askedPrice && (
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Your Asking Price</span>
                                <span className="text-slate-200 font-medium">£{specs.askedPrice}</span>
                            </div>
                        )}

                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 text-center">
                            <p className="text-slate-500 text-xs uppercase tracking-wider font-bold mb-2">AI Market Baseline</p>
                            {hasEstimate ? (
                                <p className="text-2xl font-bold text-slate-300">
                                    £{device.estimatedVal.toLocaleString()}
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-2xl font-bold text-amber-400">Pending</p>
                                    <p className="text-slate-500 text-xs">AI evaluation in progress...</p>
                                </div>
                            )}
                        </div>

                        {/* Live Bids */}
                        <div className="pt-4">
                            <h5 className="text-sm font-bold text-slate-300 mb-3">Live Vendor Bids ({bids.length})</h5>
                            {bids.length === 0 ? (
                                <p className="text-slate-500 text-sm text-center py-4 bg-slate-950 rounded-xl">Waiting for vendors to bid...</p>
                            ) : (
                                <div className="space-y-3">
                                    {bids.map(bid => (
                                        <div key={bid.id} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                                            <div>
                                                <p className="font-semibold text-white">{bid.vendor?.name || 'Vendor'}</p>
                                                <p className="text-xs text-slate-400">Trust Score: {bid.vendor?.trustScore || 100}</p>
                                            </div>
                                            <div className="text-right flex items-center gap-3">
                                                <span className="font-bold text-emerald-400 text-lg">£{bid.amount}</span>
                                                {isPricingEstimated && (
                                                    <button 
                                                        onClick={() => onAcceptOffer(bid.id)}
                                                        disabled={isAccepting}
                                                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                                                    >
                                                        {isAccepting ? '...' : 'Accept'}
                                                    </button>
                                                )}
                                                {bid.status === 'ACCEPTED' && (
                                                    <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 text-xs font-bold rounded-lg border border-emerald-500/30">WON</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
                {isPricingEstimated && (
                    <button
                        onClick={() => onRejectOffer(ticket.id)}
                        disabled={isAccepting || isRejecting}
                        className="flex-1 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-300 border border-transparent hover:border-red-500/30 rounded-xl px-6 py-4 font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        {isRejecting ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Cancelling...</>
                        ) : (
                            "Cancel Ticket"
                        )}
                    </button>
                )}

                {ticket.status === 'ENGINEER_VISIT_SCHEDULED' && (
                    <div className="flex-[3] bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-xl px-6 py-4 font-medium text-sm flex items-center justify-center gap-3">
                        <Truck className="w-5 h-5 text-purple-400" />
                        Engineer visit {ticket.visitStatus === 'APPROVED' ? 'confirmed' : 'scheduled'} — {ticket.scheduledVisit ? `Pickup on ${new Date(ticket.scheduledVisit).toLocaleString()}` : "we'll contact you within 24 hours"}
                    </div>
                )}

                {ticket.scheduledVisit && ticket.visitStatus === 'PENDING' && (
                    <div className="flex-[3] bg-blue-600/10 border border-blue-500/30 p-6 rounded-2xl animate-in zoom-in-95 duration-500">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="p-3 bg-blue-600/20 rounded-2xl">
                                <Calendar className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-white mb-1">Pickup Scheduled</h4>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    Our logistics team has proposed a pickup for <strong className="text-blue-400">{new Date(ticket.scheduledVisit).toLocaleString()}</strong>. Please approve this date to lock it in.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => onApproveVisit(ticket.id)}
                            disabled={isApproving}
                            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl py-4 font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            {isApproving ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Confirming...</>
                            ) : (
                                <><CheckCircle2 className="w-5 h-5" /> Approve Pickup Date</>
                            )}
                        </button>
                    </div>
                )}

                {isResolved && (
                    <div className="flex-[3] bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl px-6 py-4 font-medium text-sm flex items-center justify-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        Order completed — payment has been processed
                    </div>
                )}

                {ticket.status === 'CANCELLED' && (
                    <div className="flex-[3] bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-6 py-4 font-medium text-sm flex items-center justify-center gap-3">
                        Offer Rejected — This ticket is now closed.
                    </div>
                )}

                <button
                    onClick={onOpenChat}
                    className="flex-shrink-0 bg-slate-800 hover:bg-slate-700 text-white rounded-xl px-6 py-4 font-medium text-sm transition-colors flex items-center justify-center gap-2"
                >
                    <MessageSquare className="w-4 h-4" />
                    Support Chat
                </button>
            </div>

            {/* SLA Timeline */}
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
                <div className="flex items-center gap-3 mb-5">
                    <div className="p-2.5 bg-amber-500/10 rounded-xl">
                        <Clock className="w-5 h-5 text-amber-400" />
                    </div>
                    <h4 className="font-bold text-white">Timeline</h4>
                </div>
                <div className="space-y-4 text-sm relative pl-6">
                    <div className="absolute left-[7px] top-1 bottom-1 w-0.5 bg-slate-800" />

                    <TimelineItem
                        label="Ticket Created"
                        date={ticket.createdAt}
                        active={true}
                    />
                    <TimelineItem
                        label="AI Pricing Estimated"
                        date={ticket.status !== 'OPEN' ? ticket.createdAt : null}
                        active={ticket.status !== 'OPEN'}
                    />
                    <TimelineItem
                        label="Offer Accepted / Engineer Scheduled"
                        date={ticket.status === 'ENGINEER_VISIT_SCHEDULED' || ticket.status === 'RESOLVED' ? ticket.updatedAt : null}
                        active={ticket.status === 'ENGINEER_VISIT_SCHEDULED' || ticket.status === 'RESOLVED'}
                    />
                    <TimelineItem
                        label="Payment Released"
                        date={ticket.status === 'RESOLVED' ? ticket.updatedAt : null}
                        active={ticket.status === 'RESOLVED'}
                    />
                </div>
            </div>
        </div>
    );
}

function TimelineItem({ label, date, active }: { label: string; date: string | null; active: boolean }) {
    return (
        <div className="flex items-center gap-3 relative">
            <div className={`absolute -left-6 w-3.5 h-3.5 rounded-full border-2 z-10 ${
                active 
                    ? 'bg-blue-600 border-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.5)]' 
                    : 'bg-slate-900 border-slate-700'
            }`} />
            <div className="flex-1 flex justify-between items-center">
                <span className={active ? 'text-slate-200 font-medium' : 'text-slate-500'}>{label}</span>
                {date && (
                    <span className="text-slate-600 text-xs">
                        {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                )}
            </div>
        </div>
    );
}
