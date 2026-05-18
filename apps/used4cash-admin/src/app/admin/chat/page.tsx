"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { 
    Search, User as UserIcon, Send, Clock, CircleDot, 
    Smartphone, MessageSquare, ShieldCheck, Image as ImageIcon
} from "lucide-react";

export default function AdminChatDashboard() {
    const { user } = useAuth();
    const [inbox, setInbox] = useState<any[]>([]);
    const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Fetch inbox
    const fetchInbox = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/chat/admin/inbox`);
            const data = await res.json();
            if (data.success) {
                setInbox(data.tickets);
                if (!activeTicketId && data.tickets.length > 0) {
                    setActiveTicketId(data.tickets[0].id);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch messages for active ticket
    const fetchMessages = async () => {
        if (!activeTicketId) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/chat/ticket/${activeTicketId}`);
            const data = await res.json();
            if (data.success) setMessages(data.messages);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchInbox();
        const interval = setInterval(fetchInbox, 10000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        fetchMessages();
        const msgInterval = setInterval(fetchMessages, 3000);
        return () => clearInterval(msgInterval);
    }, [activeTicketId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !activeTicketId) return;

        const activeTicket = inbox.find(t => t.id === activeTicketId);
        
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/chat/send`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: newMessage,
                    senderId: user.id,
                    receiverId: activeTicket.customerId,
                    ticketId: activeTicketId
                })
            });
            const data = await res.json();
            if (data.success) {
                setMessages([...messages, data.message]);
                setNewMessage("");
                fetchInbox(); // Refresh inbox to update latest message preview
            }
        } catch (err) {
            console.error(err);
        }
    };

    const activeTicket = inbox.find(t => t.id === activeTicketId);

    if (isLoading) return <div className="p-8 text-slate-400">Loading Command Center...</div>;

    return (
        <div className="h-[calc(100vh-6rem)] flex gap-6">
            {/* Left Pane: Inbox List */}
            <div className="w-96 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl flex flex-col overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-slate-800">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-blue-500" />
                        Support Inbox
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="Search customers or tickets..." 
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {inbox.length === 0 && (
                        <div className="text-center py-10 text-slate-500 text-sm">No active chats.</div>
                    )}
                    {inbox.map((ticket) => {
                        const latestMessage = ticket.messages[0];
                        const isUnread = latestMessage?.senderId !== user?.id; // Basic unread heuristic

                        return (
                            <button
                                key={ticket.id}
                                onClick={() => setActiveTicketId(ticket.id)}
                                className={`w-full text-left p-4 rounded-2xl transition-all border ${
                                    activeTicketId === ticket.id 
                                        ? "bg-blue-600/10 border-blue-500/50" 
                                        : "bg-transparent border-transparent hover:bg-slate-800/50"
                                }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="font-bold text-white text-sm flex items-center gap-2">
                                        {ticket.customer?.name}
                                        {isUnread && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                                    </div>
                                    <span className="text-xs text-slate-500">
                                        {latestMessage ? new Date(latestMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </span>
                                </div>
                                <div className="text-xs text-slate-400 mb-2 truncate flex items-center gap-1.5">
                                    <Smartphone className="w-3 h-3" />
                                    {ticket.device?.brand} {ticket.device?.model}
                                </div>
                                <div className={`text-sm truncate ${isUnread ? "text-slate-200 font-medium" : "text-slate-500"}`}>
                                    {latestMessage?.senderId === user?.id ? "You: " : ""}
                                    {latestMessage?.content || "No messages"}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Right Pane: Chat Window & Sidebar Context */}
            {activeTicket ? (
                <div className="flex-1 flex gap-6">
                    {/* Chat Area */}
                    <div className="flex-1 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl flex flex-col overflow-hidden shadow-2xl relative">
                        <div className="absolute top-0 w-full h-32 bg-blue-600/10 blur-[50px] pointer-events-none -z-10" />
                        
                        <div className="p-6 border-b border-slate-800/80 bg-slate-900/60 flex justify-between items-center z-10">
                            <div>
                                <h3 className="font-bold text-white text-lg">{activeTicket.customer?.name}</h3>
                                <div className="text-sm text-slate-400 flex items-center gap-2 mt-1">
                                    <CircleDot className="w-3 h-3 text-emerald-500" />
                                    Active Ticket: <span className="font-mono text-blue-400">#{activeTicket.id.split('-')[0].toUpperCase()}</span>
                                </div>
                            </div>
                        </div>

                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 z-10">
                            {messages.map((msg) => {
                                const isMsgAdmin = msg.sender?.role === 'ADMIN';
                                return (
                                    <div key={msg.id} className={`flex flex-col ${isMsgAdmin ? 'items-end' : 'items-start'}`}>
                                        <div className={`flex items-end gap-2 ${isMsgAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg ${
                                                isMsgAdmin ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'
                                            }`}>
                                                {isMsgAdmin ? 'AD' : 'CU'}
                                            </div>
                                            <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-xl ${
                                                isMsgAdmin 
                                                    ? 'bg-blue-600 text-white rounded-tr-none' 
                                                    : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                                            }`}>
                                                <p>{msg.content}</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className={`text-[10px] uppercase font-bold opacity-50`}>
                                                        {isMsgAdmin ? 'Support' : activeTicket.customer?.name}
                                                    </span>
                                                    <span className="text-[10px] opacity-40">•</span>
                                                    <span className={`text-[10px] opacity-50`}>
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <form onSubmit={handleSend} className="p-4 bg-slate-900/80 border-t border-slate-800 z-10">
                            <div className="relative flex items-center">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type your reply to the customer..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-14 py-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-all shadow-inner"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="absolute right-2 p-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg transition-colors"
                                >
                                    <Send className="w-5 h-5 ml-0.5" />
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Context Sidebar */}
                    <div className="w-80 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 hidden xl:block shadow-2xl">
                        <h4 className="font-bold text-white mb-6 uppercase tracking-widest text-xs text-slate-500">Device Context</h4>
                        
                        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 mb-6 text-center">
                            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                                <Smartphone className="w-8 h-8 text-blue-500" />
                            </div>
                            <h5 className="font-bold text-white mb-1">{activeTicket.device?.brand} {activeTicket.device?.model}</h5>
                            <p className="text-emerald-400 font-bold text-lg">£{activeTicket.device?.estimatedVal}</p>
                        </div>

                        {/* Customer Uploaded Photos */}
                        {activeTicket.device?.specs?.scannedPhoto && (
                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-3 text-slate-500">
                                    <ImageIcon className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Uploaded Visuals</span>
                                </div>
                                <div className="relative group">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img 
                                        src={activeTicket.device.specs.scannedPhoto} 
                                        alt="Customer upload" 
                                        className="w-full rounded-xl border border-slate-800 hover:border-blue-500/50 transition-colors cursor-zoom-in shadow-lg"
                                        onClick={() => window.open(activeTicket.device.specs.scannedPhoto, '_blank')}
                                    />
                                    <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/10 transition-all rounded-xl pointer-events-none" />
                                </div>
                            </div>
                        )}

                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between border-b border-slate-800 pb-3">
                                <span className="text-slate-500">Condition</span>
                                <span className="text-white font-medium">{activeTicket.device?.condition}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-800 pb-3">
                                <span className="text-slate-500">Storage</span>
                                <span className="text-white font-medium">{activeTicket.device?.specs?.storage || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-800 pb-3">
                                <span className="text-slate-500">Status</span>
                                <span className="text-blue-400 font-bold text-[10px] uppercase px-2 py-1 bg-blue-500/10 rounded">{activeTicket.status}</span>
                            </div>
                            
                            {activeTicket.device?.condition === "Poor" || activeTicket.device?.condition === "Broken" ? (
                                <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 text-xs leading-relaxed font-medium">
                                    <ShieldCheck className="w-4 h-4 mb-2" />
                                    Mandatory Engineer Visit required for this condition tier before payout.
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl flex items-center justify-center shadow-2xl">
                    <div className="text-center">
                        <MessageSquare className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-500">Select a conversation</h3>
                        <p className="text-slate-600 text-sm mt-2">Choose a ticket from the inbox to start chatting.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
