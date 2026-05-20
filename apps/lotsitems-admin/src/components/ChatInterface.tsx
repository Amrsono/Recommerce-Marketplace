"use client";

import { useState, useEffect, useRef } from 'react';
import { Send, User as UserIcon, Shield, MessageSquare, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface Message {
    id: string;
    content: string;
    senderId: string;
    sender: { name: string; role: string };
    createdAt: string;
}

interface ChatInterfaceProps {
    ticketId?: string;
    receiverId?: string;
}

export default function ChatInterface({ ticketId, receiverId }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();
    const scrollRef = useRef<HTMLDivElement>(null);

    const fetchMessages = async () => {
        if (!ticketId) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/chat/ticket/${ticketId}`);
            const data = await res.json();
            if (data.success) setMessages(data.messages);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (!ticketId) return;
        fetchMessages();
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [ticketId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;
        setError(null);

        if (!ticketId) {
            setError('No active ticket. Please submit a device first to start a support conversation.');
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/chat/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: newMessage,
                    senderEmail: user.email,
                    senderId: user.id,
                    receiverId: receiverId || "1",
                    ticketId
                })
            });
            const data = await res.json();
            if (data.success) {
                setMessages([...messages, data.message]);
                setNewMessage('');
            } else {
                setError(data.error || 'Failed to send message. Please try again.');
            }
        } catch (err) {
            console.error(err);
            setError('Could not connect to the server. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    // No ticket — show a helpful empty state instead of a broken chat
    if (!ticketId) {
        return (
            <div className="flex flex-col h-[500px] bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Shield className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white">Support Chat</h3>
                        <p className="text-xs text-slate-500">Secure Channel</p>
                    </div>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-6">
                        <MessageSquare className="w-8 h-8 text-slate-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No active support ticket</h3>
                    <p className="text-slate-500 text-sm mb-8 max-w-sm">
                        Submit a device for evaluation first to open a support conversation with our team.
                    </p>
                    <Link
                        href="/offer"
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-full font-bold transition-all shadow-xl shadow-blue-500/30"
                    >
                        Submit a device
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[500px] bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Shield className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white">Support Specialist</h3>
                        <p className="text-xs text-blue-400">Online • Secure Channel</p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-grid-slate-800/10">
                {messages.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-slate-500 text-sm">No messages yet. Start the conversation!</p>
                    </div>
                )}
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                            msg.senderId === user?.id 
                                ? 'bg-blue-600 text-white rounded-tr-none' 
                                : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                        }`}>
                            <p className="leading-relaxed">{msg.content}</p>
                            <span className="text-[10px] opacity-60 mt-1 block">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Error Banner */}
            {error && (
                <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/20 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <p className="text-red-400 text-xs">{error}</p>
                    <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300 text-xs font-bold">✕</button>
                </div>
            )}

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 bg-slate-900/80 border-t border-slate-800">
                <div className="relative">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all pr-12"
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </form>
        </div>
    );
}
