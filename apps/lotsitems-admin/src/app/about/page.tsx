"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Gavel, Cpu, Globe, BadgeCheck, TrendingUp, Users } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";

export default function AboutPage() {
    const { t } = useLanguage();

    const stats = [
        { value: "50K+", label: t("aboutStatsDevices") || "Devices Sold" },
        { value: "$12M+", label: t("aboutStatsPaid") || "Paid Out to Sellers" },
        { value: "500+", label: t("aboutStatsVendors") || "Verified Vendors" },
        { value: "24h", label: t("aboutStatsTime") || "Average Payout Time" },
    ];

    const values = [
        { icon: ShieldCheck, title: t("feature1Title"), description: t("feature1Desc"), color: "blue" },
        { icon: Gavel, title: t("feature2Title"), description: t("feature2Desc"), color: "purple" },
        { icon: Cpu, title: t("feature3Title"), description: t("feature3Desc"), color: "emerald" },
        { icon: Globe, title: t("modalStep1Title"), description: t("modalStep1Desc"), color: "orange" },
    ];

    const team = [
        { name: "Grand Minds Technology", role: t("aboutFounderRole") || "Founder & CEO", initials: "GM", gradient: "from-blue-500 to-purple-600" },
        { name: "AI Pricing Engine", role: t("aboutAiRole") || "Chief Valuation Officer", initials: "AI", gradient: "from-emerald-500 to-cyan-600" },
        { name: "Vendor Network", role: t("aboutNetworkRole") || "500+ Verified Partners", initials: "VN", gradient: "from-orange-500 to-amber-600" },
    ];

    const colorMap: Record<string, string> = {
        blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
        purple: "bg-purple-500/10 border-purple-500/20 text-purple-400",
        emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
        orange: "bg-orange-500/10 border-orange-500/20 text-orange-400",
    };

    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-blue-600/15 blur-[130px] rounded-full pointer-events-none -z-10" />
            <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none -z-10" />

            <nav className="container mx-auto px-6 py-6 flex justify-between items-center border-b border-slate-800/50 sticky top-0 z-50 bg-black/40 backdrop-blur-xl">
                <Link href="/" className="flex items-center gap-3">
                    <div className="relative w-9 h-9 overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
                        <Image src="/logo.png" alt={t("navBrand")} fill className="object-contain" />
                    </div>
                    <span className="font-bold text-xl tracking-tight text-white">{t("navBrand")}</span>
                </Link>
                <div className="flex items-center gap-6 text-sm font-medium text-slate-400">
                    <Link href="/about" className="text-white border-b border-blue-500 pb-0.5">{t("navAbout")}</Link>
                    <Link href="/contact" className="hover:text-white transition-colors">{t("navContact")}</Link>
                    <LanguageSelector />
                    <Link href="/offer" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-full transition-all shadow-lg shadow-blue-600/20">
                        {t("navGetOffer")}
                    </Link>
                </div>
            </nav>

            <section className="container mx-auto px-6 pt-28 pb-20 text-center max-w-5xl">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-8">
                    <BadgeCheck className="w-3.5 h-3.5" /> {t("aboutStory") || "Our Story"}
                </div>
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50">
                    {t("aboutTitle")}
                </h1>
                <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                    {t("aboutSubtitle")}
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
                        <h2 className="text-4xl font-bold text-white mb-6 leading-tight">{t("aboutProblemTitle") || "The problem we're solving"}</h2>
                        <div className="space-y-4 text-slate-400 leading-relaxed text-lg">
                            <p>{t("aboutProblemDesc1") || "The secondary electronics market is broken. Marketplaces are flooded with fraud, buyers lowball, and sellers are left feeling robbed."}</p>
                            <p>{t("aboutProblemDesc2") || "We built Lotsitems on a fundamentally different principle: let the market decide the price — transparently, in real time, with no room for manipulation."}</p>
                            <p>{t("aboutProblemDesc3") || "Our AI establishes a fair baseline. Then verified vendors compete. The seller chooses the best offer. Our engineers verify the device. Everyone wins."}</p>
                        </div>
                        <Link href="/offer" className="inline-flex items-center gap-2 mt-8 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-full font-semibold transition-all shadow-lg shadow-blue-600/20">
                            {t("aboutProblemTry") || "Try it yourself"} <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/10 rounded-3xl blur-2xl" />
                        <div className="relative bg-slate-900/80 border border-slate-800 rounded-3xl p-8 space-y-4">
                            {[
                                { label: "Vendor A", amount: "$820", winner: false },
                                { label: "Vendor B", amount: "$895", winner: false },
                                { label: "Vendor C", amount: "$940", winner: true },
                            ].map((bid, i) => (
                                <div key={i} className={`flex justify-between items-center p-4 rounded-xl border ${bid.winner ? "bg-emerald-500/10 border-emerald-500/30" : "bg-slate-800/50 border-slate-700"}`}>
                                    <div>
                                        <p className="font-semibold text-white">{bid.label}</p>
                                        <p className="text-xs text-slate-500">{t("vendorBidder")}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold text-xl ${bid.winner ? "text-emerald-400" : "text-slate-300"}`}>{bid.amount}</p>
                                        <p className={`text-xs font-semibold ${bid.winner ? "text-emerald-400" : "text-slate-500"}`}>{bid.winner ? "Winner 🏆" : "Pending"}</p>
                                    </div>
                                </div>
                            ))}
                            <div className="pt-2 text-center text-xs text-slate-500 font-medium">{t("vendorMarketSubtitle")}</div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="container mx-auto px-6 py-24 border-t border-slate-800/50">
                <div className="text-center mb-16 max-w-2xl mx-auto">
                    <h2 className="text-4xl font-bold text-white mb-4">{t("aboutValuesTitle") || "What we stand for"}</h2>
                    <p className="text-slate-400 text-lg">{t("aboutValuesSubtitle") || "Four principles that guide every decision we make."}</p>
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
                    <h2 className="text-4xl font-bold text-white mb-4">{t("aboutTeamTitle") || "The people behind Lotsitems"}</h2>
                    <p className="text-slate-400 text-lg max-w-xl mx-auto">{t("aboutTeamSubtitle") || "A lean, ambitious team on a mission to make electronics resale radically fair."}</p>
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
                    <h2 className="text-4xl font-bold text-white mb-4">{t("aboutReadyTitle") || "Ready to get the best price for your device?"}</h2>
                    <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">{t("aboutReadySubtitle") || "Join thousands of sellers who discovered that competition always beats a single lowball offer."}</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/offer" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-semibold transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2">
                            {t("aboutReadyBtn") || "Get your offer now"} <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link href="/contact" className="bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 px-8 py-4 rounded-full font-semibold transition-colors flex items-center justify-center gap-2">
                            <Users className="w-4 h-4" /> {t("aboutTalkToUs") || "Talk to us"}
                        </Link>
                    </div>
                </div>
            </section>

            <footer className="border-t border-slate-800/50 py-8 text-center text-slate-500 text-sm">
                <p>{t("footerText")}</p>
            </footer>
        </div>
    );
}
