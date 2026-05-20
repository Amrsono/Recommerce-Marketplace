"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, MessageSquare, MapPin, Phone, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

const contactMethods = [
    { icon: Mail, title: "Email Us", value: "hello@lotsitems.com", desc: "We typically reply within 2 hours.", color: "blue" },
    { icon: Phone, title: "Call Us", value: "+971 4 123 4567", desc: "Sun–Thu, 9am – 6pm GST.", color: "purple" },
    { icon: MapPin, title: "Our Office", value: "Dubai, UAE", desc: "MENA HQ — Downtown Dubai.", color: "emerald" },
];

const colorMap: Record<string, string> = {
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    purple: "bg-purple-500/10 border-purple-500/20 text-purple-400",
    emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
};

export default function ContactPage() {
    const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
    const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");
        await new Promise(r => setTimeout(r, 1500)); // Simulate API call
        setStatus("success");
    };

    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-blue-600/15 blur-[130px] rounded-full pointer-events-none -z-10" />
            <div className="absolute bottom-1/3 right-0 w-[400px] h-[400px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none -z-10" />

            {/* Nav */}
            <nav className="container mx-auto px-6 py-6 flex justify-between items-center border-b border-slate-800/50 sticky top-0 z-50 bg-black/40 backdrop-blur-xl">
                <Link href="/" className="flex items-center gap-3">
                    <div className="relative w-9 h-9 overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
                        <Image src="/logo.png" alt="Lotsitems" fill className="object-contain" />
                    </div>
                    <span className="font-bold text-xl tracking-tight text-white">Lotsitems</span>
                </Link>
                <div className="flex items-center gap-6 text-sm font-medium text-slate-400">
                    <Link href="/about" className="hover:text-white transition-colors">About</Link>
                    <Link href="/contact" className="text-white border-b border-blue-500 pb-0.5">Contact</Link>
                    <Link href="/offer" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-full transition-all shadow-lg shadow-blue-600/20">
                        Get an Offer
                    </Link>
                </div>
            </nav>

            {/* Hero */}
            <section className="container mx-auto px-6 pt-28 pb-16 text-center max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-8">
                    <MessageSquare className="w-3.5 h-3.5" /> Get In Touch
                </div>
                <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50">
                    We&apos;d love to <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">hear from you</span>
                </h1>
                <p className="text-lg text-slate-400 leading-relaxed">
                    Whether you&apos;re a seller, a vendor looking to join the marketplace, or just curious — our team is ready to help.
                </p>
            </section>

            {/* Contact Methods */}
            <section className="container mx-auto px-6 pb-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                    {contactMethods.map((m, i) => (
                        <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 group hover:border-slate-700 transition-all text-center">
                            <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mx-auto mb-4 ${colorMap[m.color]}`}>
                                <m.icon className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-white mb-1">{m.title}</h3>
                            <p className="text-slate-300 font-medium text-sm mb-1">{m.value}</p>
                            <p className="text-slate-500 text-xs">{m.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Contact Form + Sidebar */}
            <section className="container mx-auto px-6 py-16 border-t border-slate-800/50">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 max-w-6xl mx-auto">

                    {/* Form */}
                    <div className="lg:col-span-3">
                        <h2 className="text-3xl font-bold text-white mb-2">Send us a message</h2>
                        <p className="text-slate-400 mb-8">Fill in the form and we&apos;ll get back to you within one business day.</p>

                        {status === "success" ? (
                            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-12 text-center animate-in zoom-in-95 duration-300">
                                <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                                <h3 className="text-2xl font-bold text-white mb-2">Message sent!</h3>
                                <p className="text-slate-400 mb-6">We&apos;ve received your message and will get back to you shortly.</p>
                                <button
                                    onClick={() => { setStatus("idle"); setForm({ name: "", email: "", subject: "", message: "" }); }}
                                    className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1 mx-auto transition-colors"
                                >
                                    Send another message <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Your Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={form.name}
                                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-600"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
                                        <input
                                            type="email"
                                            required
                                            value={form.email}
                                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-600"
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Subject</label>
                                    <select
                                        required
                                        value={form.subject}
                                        onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                                    >
                                        <option value="" disabled>Select a topic...</option>
                                        <option value="selling">I want to sell a device</option>
                                        <option value="vendor">Become a verified vendor</option>
                                        <option value="order">Question about my order</option>
                                        <option value="partnership">Partnership / B2B inquiry</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Message</label>
                                    <textarea
                                        required
                                        rows={6}
                                        value={form.message}
                                        onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-600 resize-none"
                                        placeholder="Tell us how we can help..."
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={status === "loading"}
                                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30 flex items-center justify-center gap-2"
                                >
                                    {status === "loading" ? (
                                        <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</>
                                    ) : (
                                        <>Send Message <ArrowRight className="w-4 h-4" /></>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                            <h3 className="font-bold text-white mb-4 text-lg">Frequently Asked</h3>
                            <div className="space-y-5">
                                {[
                                    { q: "How long does a payout take?", a: "Most payouts complete within 24 hours of our engineer verifying your device." },
                                    { q: "How do I become a vendor?", a: "Fill in the contact form and select 'Become a verified vendor'. Our team will reach out within 24 hours." },
                                    { q: "Is there a listing fee?", a: "No — listing your device is completely free. Vendors pay a small commission on successful bids." },
                                    { q: "What devices do you accept?", a: "Smartphones, tablets, laptops, and smartwatches from all major brands." },
                                ].map((faq, i) => (
                                    <div key={i} className="border-b border-slate-800 pb-4 last:border-0 last:pb-0">
                                        <p className="font-semibold text-slate-200 text-sm mb-1">{faq.q}</p>
                                        <p className="text-slate-500 text-sm leading-relaxed">{faq.a}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/10 border border-blue-500/20 rounded-2xl p-6">
                            <h3 className="font-bold text-white mb-2">Want to list your device right now?</h3>
                            <p className="text-slate-400 text-sm mb-4">Skip the wait — get an AI-powered quote in under 2 minutes.</p>
                            <Link href="/offer" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-sm">
                                Get instant offer <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="border-t border-slate-800/50 py-8 text-center text-slate-500 text-sm">
                <p>© 2026 Lotsitems Marketplace. Don&apos;t trash it, cash it.</p>
            </footer>
        </div>
    );
}
