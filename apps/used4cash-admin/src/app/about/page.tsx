"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Gavel, Cpu, Globe, BadgeCheck, TrendingUp, Users } from "lucide-react";

const stats = [
    { value: "50K+", label: "Devices Sold" },
    { value: "$12M+", label: "Paid Out to Sellers" },
    { value: "500+", label: "Verified Vendors" },
    { value: "24h", label: "Average Payout Time" },
];

const values = [
    { icon: ShieldCheck, title: "Radical Transparency", description: "Every price is backed by real-time AI market data. No guesswork, no manipulation — just fair, data-driven valuations you can trust.", color: "blue" },
    { icon: Gavel, title: "True Competition", description: "Our multi-vendor bidding model means vendors compete for your device, driving prices up — not down. You always get the best offer.", color: "purple" },
    { icon: Cpu, title: "AI-First Infrastructure", description: "From visual diagnostics to market pricing, our platform is powered by cutting-edge AI agents that make every assessment accurate and instant.", color: "emerald" },
    { icon: Globe, title: "Built for the MENA Region", description: "We understand the nuances of the Middle East electronics market. Our platform is built from the ground up for local buyers and sellers.", color: "orange" },
];

const team = [
    { name: "Amr Sono", role: "Founder & CEO", initials: "AS", gradient: "from-blue-500 to-purple-600" },
    { name: "AI Pricing Engine", role: "Chief Valuation Officer", initials: "AI", gradient: "from-emerald-500 to-cyan-600" },
    { name: "Vendor Network", role: "500+ Verified Partners", initials: "VN", gradient: "from-orange-500 to-amber-600" },
];

const colorMap: Record<string, string> = {
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    purple: "bg-purple-500/10 border-purple-500/20 text-purple-400",
    emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    orange: "bg-orange-500/10 border-orange-500/20 text-orange-400",
};

export default function AboutPage() {
    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-blue-600/15 blur-[130px] rounded-full pointer-events-none -z-10" />
            <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none -z-10" />

            <nav className="container mx-auto px-6 py-6 flex justify-between items-center border-b border-slate-800/50 sticky top-0 z-50 bg-black/40 backdrop-blur-xl">
                <Link href="/" className="flex items-center gap-3">
                    <div className="relative w-9 h-9 overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
                        <Image src="/logo.png" alt="used4cash" fill className="object-contain" />
                    </div>
                    <span className="font-bold text-xl tracking-tight text-white">used4cash</span>
                </Link>
                <div className="flex items-center gap-6 text-sm font-medium text-slate-400">
                    <Link href="/about" className="text-white border-b border-blue-500 pb-0.5">About</Link>
                    <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
                    <Link href="/offer" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-full transition-all shadow-lg shadow-blue-600/20">
                        Get an Offer
                    </Link>
                </div>
            </nav>

            <section className="container mx-auto px-6 pt-28 pb-20 text-center max-w-5xl">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-8">
                    <BadgeCheck className="w-3.5 h-3.5" /> Our Story
                </div>
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50">
                    We&apos;re changing how the world <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">re-sells electronics</span>
                </h1>
                <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                    used4cash was built out of frustration. Selling your old phone shouldn&apos;t mean lowball offers, sketchy buyers, or weeks of waiting. We built a transparent, AI-powered marketplace where verified vendors compete for your device — and you always win.
                </p>
            </section>

            <section className="container mx-auto px-6 pb-24">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {stats.map((stat, i) => (
                        <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-center group hover:border-slate-700 hover:bg-slate-900/80 transition-all">
                            <div className="text-4xl font-black text-white mb-1 group-hover:text-blue-400 transition-colors">{stat.value}</div>
                            <div className="text-sm text-slate-500 font-medium">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="container mx-auto px-6 py-24 border-t border-slate-800/50">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
                    <div>
                        <h2 className="text-4xl font-bold text-white mb-6 leading-tight">The problem we&apos;re solving</h2>
                        <div className="space-y-4 text-slate-400 leading-relaxed text-lg">
                            <p>The secondary electronics market is broken. Marketplaces are flooded with fraud, buyers lowball, and sellers are left feeling robbed.</p>
                            <p>We built used4cash on a fundamentally different principle: <span className="text-slate-200 font-medium">let the market decide the price — transparently, in real time, with no room for manipulation.</span></p>
                            <p>Our AI establishes a fair baseline. Then verified vendors compete. The seller chooses the best offer. Our engineers verify the device. Everyone wins.</p>
                        </div>
                        <Link href="/offer" className="inline-flex items-center gap-2 mt-8 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-full font-semibold transition-all shadow-lg shadow-blue-600/20">
                            Try it yourself <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/10 rounded-3xl blur-2xl" />
                        <div className="relative bg-slate-900/80 border border-slate-800 rounded-3xl p-8 space-y-4">
                            {[
                                { label: "Vendor A", amount: "£820", winner: false },
                                { label: "Vendor B", amount: "£895", winner: false },
                                { label: "Vendor C", amount: "£940", winner: true },
                            ].map((bid, i) => (
                                <div key={i} className={`flex justify-between items-center p-4 rounded-xl border ${bid.winner ? "bg-emerald-500/10 border-emerald-500/30" : "bg-slate-800/50 border-slate-700"}`}>
                                    <div>
                                        <p className="font-semibold text-white">{bid.label}</p>
                                        <p className="text-xs text-slate-500">Verified Vendor</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold text-xl ${bid.winner ? "text-emerald-400" : "text-slate-300"}`}>{bid.amount}</p>
                                        <p className={`text-xs font-semibold ${bid.winner ? "text-emerald-400" : "text-slate-500"}`}>{bid.winner ? "Winner 🏆" : "Pending"}</p>
                                    </div>
                                </div>
                            ))}
                            <div className="pt-2 text-center text-xs text-slate-500 font-medium">Live competitive bids on your device</div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="container mx-auto px-6 py-24 border-t border-slate-800/50">
                <div className="text-center mb-16 max-w-2xl mx-auto">
                    <h2 className="text-4xl font-bold text-white mb-4">What we stand for</h2>
                    <p className="text-slate-400 text-lg">Four principles that guide every decision we make.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                    {values.map((v, i) => (
                        <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 group hover:border-slate-700 transition-all">
                            <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-5 ${colorMap[v.color]}`}>
                                <v.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">{v.title}</h3>
                            <p className="text-slate-400 leading-relaxed">{v.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="container mx-auto px-6 py-24 border-t border-slate-800/50">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-white mb-4">The people behind used4cash</h2>
                    <p className="text-slate-400 text-lg max-w-xl mx-auto">A lean, ambitious team on a mission to make electronics resale radically fair.</p>
                </div>
                <div className="flex flex-col md:flex-row gap-6 justify-center max-w-3xl mx-auto">
                    {team.map((member, i) => (
                        <div key={i} className="flex-1 bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center group hover:border-slate-700 transition-all">
                            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${member.gradient} flex items-center justify-center text-white font-extrabold text-2xl mx-auto mb-5 shadow-xl group-hover:scale-110 transition-transform`}>
                                {member.initials}
                            </div>
                            <h3 className="text-lg font-bold text-white">{member.name}</h3>
                            <p className="text-slate-500 text-sm mt-1">{member.role}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="container mx-auto px-6 py-24 border-t border-slate-800/50 text-center">
                <div className="relative bg-gradient-to-br from-blue-600/20 to-purple-600/10 border border-blue-500/20 rounded-3xl p-16 max-w-3xl mx-auto overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-blue-600/20 blur-[80px] pointer-events-none" />
                    <TrendingUp className="w-12 h-12 text-blue-400 mx-auto mb-6" />
                    <h2 className="text-4xl font-bold text-white mb-4">Ready to get the best price for your device?</h2>
                    <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">Join thousands of sellers who discovered that competition always beats a single lowball offer.</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/offer" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-semibold transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2">
                            Get your offer now <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link href="/contact" className="bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 px-8 py-4 rounded-full font-semibold transition-colors flex items-center justify-center gap-2">
                            <Users className="w-4 h-4" /> Talk to us
                        </Link>
                    </div>
                </div>
            </section>

            <footer className="border-t border-slate-800/50 py-8 text-center text-slate-500 text-sm">
                <p>© 2026 used4cash Marketplace. Don&apos;t trash it, cash it.</p>
            </footer>
        </div>
    );
}
