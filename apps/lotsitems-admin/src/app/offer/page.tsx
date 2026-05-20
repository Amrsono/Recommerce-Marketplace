"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
    ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle, MonitorSmartphone,
    MapPin, DollarSign, CheckSquare, Camera, UploadCloud, Image as ImageIcon,
    Smartphone, Store, Home, Navigation
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";

// ---------------------------------------------------------------------------
// Mock store locations — replace with real data / API as needed
// ---------------------------------------------------------------------------
const STORES = [
    { id: "store-1", name: "Lotsitems — City Centre", address: "14 Market Street, London, EC2V 8DY", distance: "0.4 mi", hours: "Mon–Sat 9am–6pm" },
    { id: "store-2", name: "Lotsitems — East End",    address: "82 Whitechapel Rd, London, E1 1JX",  distance: "1.2 mi", hours: "Mon–Sat 10am–7pm" },
    { id: "store-3", name: "Lotsitems — South Bank",  address: "5 Bankside Walk, London, SE1 9PP",    distance: "1.9 mi", hours: "Mon–Sun 10am–6pm" },
    { id: "store-4", name: "Lotsitems — West End",    address: "201 Oxford Street, London, W1D 2LJ",  distance: "2.3 mi", hours: "Mon–Sat 9am–8pm" },
];

type EvaluationMethod = "home-visit" | "store" | "";

type OfferData = {
    make: string;
    model: string;
    storage: string;
    condition: string;
    askedPrice: string;
    photos: { front: string | null; back: string | null; box: string | null };
    evaluationMethod: EvaluationMethod;
    selectedStoreId: string;
    address: string;
    acceptFee: boolean;
};

export default function OfferJourney() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [ticketId, setTicketId] = useState<string | null>(null);
    const [data, setData] = useState<OfferData>({
        make: "",
        model: "",
        storage: "",
        condition: "",
        askedPrice: "",
        photos: { front: null, back: null, box: null },
        evaluationMethod: "",
        selectedStoreId: "",
        address: "",
        acceptFee: false,
    });

    const [handoffSessionId, setHandoffSessionId] = useState<string | null>(null);
    const [showQR, setShowQR] = useState(false);

    if (step === 3 && !handoffSessionId) {
        setHandoffSessionId(`sid_${Date.now()}_${Math.random().toString(36).substring(7)}`);
    }

    useEffect(() => {
        if (step !== 3 || !handoffSessionId || !showQR) return;
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/devices/handoff/${handoffSessionId}`);
                if (!res.ok) return;
                const result = await res.json();
                if (result.success && result.session.status === "UPLOADED") {
                    setData(prev => {
                        const p = { ...prev.photos };
                        if (!p.front) p.front = result.session.photoUrl;
                        else if (!p.back) p.back = result.session.photoUrl;
                        else if (!p.box) p.box = result.session.photoUrl;
                        return { ...prev, photos: p };
                    });
                    setHandoffSessionId(`sid_${Date.now()}_${Math.random().toString(36).substring(7)}`);
                }
            } catch (err) {
                console.error("Polling error", err);
            }
        }, 2000);
        return () => clearInterval(interval);
    }, [step, handoffSessionId, showQR, setData]);

    if (!isLoading && !user) {
        router.push("/auth?redirect=/offer");
        return null;
    }

    const updateData = (fields: Partial<OfferData>) => setData(prev => ({ ...prev, ...fields }));

    const needsEvaluation = data.condition === "Poor" || data.condition === "Broken";

    const nextStep = () => {
        if (step === 1 && (!data.make || !data.model || !data.storage)) return;
        if (step === 2 && (!data.condition || !data.askedPrice)) return;
        // Step 3 (Photos) is optional
        if (step === 4) {
            if (needsEvaluation && !data.evaluationMethod) return;
            if (data.evaluationMethod === "home-visit" && !data.address) return;
            if (data.evaluationMethod === "store" && !data.selectedStoreId) return;
            // Non-Poor/Broken still need address for pickup
            if (!needsEvaluation && !data.address) return;
        }
        if (step === 5 && needsEvaluation && data.evaluationMethod === "home-visit" && !data.acceptFee) return;
        setStep(s => s + 1);
    };

    const prevStep = () => setStep(s => s - 1);

    const selectedStore = STORES.find(s => s.id === data.selectedStoreId);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const apiData = {
                brand: data.make,
                model: `${data.model} (${data.storage})`,
                specs: {
                    storage: data.storage,
                    address: data.evaluationMethod === "store" ? selectedStore?.address : data.address,
                    acceptFee: data.acceptFee,
                    askedPrice: data.askedPrice,
                    evaluationMethod: data.evaluationMethod || "home-visit",
                    storeName: selectedStore?.name ?? null,
                },
                condition: data.condition,
                userEmail: user?.email,
                userName: user?.name,
            };

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/devices/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(apiData),
            });

            if (!res.ok) throw new Error("Submission failed");
            const result = await res.json();
            if (result.success && result.ticket) setTicketId(result.ticket.id);
            setStep(6);
        } catch (error) {
            console.error("Submission error:", error);
            alert("Failed to submit ticket. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const photosUploadedCount = [data.photos.front, data.photos.back, data.photos.box].filter(Boolean).length;

    return (
        <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none -z-10" />
            <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-emerald-600/5 blur-[150px] rounded-full pointer-events-none -z-10" />

            {/* Top Nav */}
            <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-20">
                <Link href="/" className="font-bold text-xl tracking-tight text-white flex items-center gap-3">
                    <div className="relative w-8 h-8 overflow-hidden rounded-md border border-slate-700 bg-slate-950">
                        <Image src="/logo.png" alt="Lotsitems Logo" fill className="object-contain" />
                    </div>
                    Lotsitems
                </Link>
                {step < 6 && (
                    <div className="flex items-center gap-4">
                        <div className="text-sm font-medium text-slate-400 hidden sm:block">Step {step} of 5</div>
                        <Link
                            href={user?.role === "ADMIN" ? "/admin" : user?.role === "VENDOR" ? "/vendor" : "/profile"}
                            className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white hover:scale-110 transition-all active:scale-95 shadow-lg shadow-blue-500/20 border border-white/5"
                        >
                            {user?.name?.[0]}
                        </Link>
                    </div>
                )}
            </div>

            <div className="w-full max-w-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl p-6 md:p-10 animate-in zoom-in-95 duration-500 relative z-10">

                {/* Progress bar */}
                {step < 6 && (
                    <div className="flex gap-2 w-full mb-10">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div
                                key={i}
                                className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${i < step ? "bg-blue-600" : i === step ? "bg-blue-500/50" : "bg-slate-800"}`}
                            />
                        ))}
                    </div>
                )}

                {/* ── Step 1: Device Details ── */}
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="mb-8 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                <MonitorSmartphone className="w-6 h-6 text-blue-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">What are you selling?</h2>
                                <p className="text-slate-400">Tell us the make, model, and specs of your device.</p>
                            </div>
                        </div>

                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <p className="text-sm text-blue-300 text-center sm:text-left">Want a faster, interactive experience?</p>
                            <Link href="/assess" className="bg-blue-600 hover:bg-blue-500 text-white rounded-full px-5 py-2 text-sm font-semibold transition-colors whitespace-nowrap">
                                Switch to AI Chat Evaluation
                            </Link>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-300 mb-1.5 block">Make (Brand)</label>
                                <select className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-all appearance-none" value={data.make} onChange={e => updateData({ make: e.target.value })}>
                                    <option value="" disabled>Select Make...</option>
                                    <option value="Apple">Apple</option>
                                    <option value="Samsung">Samsung</option>
                                    <option value="Google">Google</option>
                                    <option value="Sony">Sony</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-300 mb-1.5 block">Exact Model</label>
                                <input type="text" placeholder="e.g. iPhone 15 Pro Max" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-all" value={data.model} onChange={e => updateData({ model: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-300 mb-1.5 block">Storage / Memory</label>
                                <select className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-all appearance-none" value={data.storage} onChange={e => updateData({ storage: e.target.value })}>
                                    <option value="" disabled>Select Storage...</option>
                                    <option value="64GB">64GB</option>
                                    <option value="128GB">128GB</option>
                                    <option value="256GB">256GB</option>
                                    <option value="512GB">512GB</option>
                                    <option value="1TB+">1TB or higher</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Step 2: Condition & Price ── */}
                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="mb-8 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                                <DollarSign className="w-6 h-6 text-purple-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Condition & Pricing</h2>
                                <p className="text-slate-400">Be honest with the condition to get the most accurate quote.</p>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className="text-sm font-medium text-slate-300 mb-3 block">Device Condition</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {["Mint", "Good", "Poor", "Broken"].map(cond => (
                                        <button key={cond} onClick={() => updateData({ condition: cond, evaluationMethod: "" })}
                                            className={`p-4 rounded-xl border text-left transition-all ${data.condition === cond ? "bg-blue-600/10 border-blue-500 text-blue-400" : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"}`}>
                                            <div className="font-semibold text-slate-200 mb-1">{cond}</div>
                                            <div className="text-xs">
                                                {cond === "Mint" && "Flawless screen & body, fully functional"}
                                                {cond === "Good" && "Light scratches, completely functional"}
                                                {cond === "Poor" && "Heavy wear or deep scratches, functional"}
                                                {cond === "Broken" && "Cracked screen, battery issues, won't turn on"}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                {needsEvaluation && (
                                    <div className="mt-3 flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5">
                                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                                        <p className="text-xs text-amber-300">This condition requires a physical evaluation — you'll choose how in Step 4.</p>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-300 mb-1.5 block">Your Asking Price (£)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className="text-slate-500">£</span>
                                    </div>
                                    <input type="number" placeholder="0.00" className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-all font-semibold text-lg" value={data.askedPrice} onChange={e => updateData({ askedPrice: e.target.value })} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Step 3: Photos ── */}
                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="mb-8 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                                <Camera className="w-6 h-6 text-orange-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Device Photos (Optional)</h2>
                                <p className="text-slate-400">Upload visuals to fast-track your AI evaluation and validation.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[{ id: "front", label: "Front Screen" }, { id: "back", label: "Back Panel" }, { id: "box", label: "Original Box" }].map(photoType => (
                                <div key={photoType.id} className="relative">
                                    <label className="text-sm font-medium text-slate-300 mb-2 block">{photoType.label}</label>
                                    <label className="flex flex-col items-center justify-center h-32 w-full bg-slate-950 border-2 border-dashed border-slate-700/60 rounded-xl hover:border-blue-500 hover:bg-blue-500/5 transition-all cursor-pointer group overflow-hidden relative">
                                        <input type="file" accept="image/*" className="hidden" onChange={e => {
                                            const file = e.target.files?.[0];
                                            if (file) updateData({ photos: { ...data.photos, [photoType.id]: URL.createObjectURL(file) } });
                                        }} />
                                        {data.photos[photoType.id as keyof typeof data.photos] ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={data.photos[photoType.id as keyof typeof data.photos]!} alt={photoType.label} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-50 transition-opacity" />
                                        ) : (
                                            <>
                                                <UploadCloud className="w-6 h-6 text-slate-500 group-hover:text-blue-500 mb-2 transition-colors" />
                                                <span className="text-xs text-slate-400 group-hover:text-blue-400 transition-colors">Tap to upload</span>
                                            </>
                                        )}
                                        {data.photos[photoType.id as keyof typeof data.photos] && (
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="bg-slate-900/80 px-3 py-1.5 rounded-full text-xs text-white font-medium flex items-center gap-1.5 backdrop-blur-sm">
                                                    <ImageIcon className="w-3 h-3" /> Replace
                                                </span>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 flex flex-col items-center border border-slate-800 rounded-xl p-4 bg-slate-900/50">
                            <button onClick={() => setShowQR(!showQR)} className="w-full bg-slate-800 hover:bg-slate-700 text-white rounded-xl px-4 py-3 flex items-center justify-center gap-2 text-sm font-semibold transition-all active:scale-95">
                                <Smartphone className="w-5 h-5 text-blue-400" />
                                {showQR ? "Hide Mobile Scanner" : "Use Phone Camera Instead"}
                            </button>
                            {showQR && handoffSessionId && (
                                <div className="mt-6 bg-white rounded-[24px] p-6 flex flex-col items-center animate-in zoom-in-95 duration-200">
                                    <QRCodeSVG value={`${typeof window !== "undefined" ? window.location.origin : ""}/assess/camera/${handoffSessionId}`} size={180} level="H" />
                                    <p className="text-slate-900 font-bold text-sm mt-4 text-center">Scan with Phone Camera</p>
                                    <p className="text-slate-500 text-xs text-center mt-1 w-48">Take a photo on your phone and it will securely sync here.</p>
                                </div>
                            )}
                        </div>

                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mt-6">
                            <p className="text-sm text-blue-300 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                                Clear photos assist the vision AI agent in matching your quoted asking price instantly.
                            </p>
                        </div>
                    </div>
                )}

                {/* ── Step 4: Pickup / Evaluation ── */}
                {step === 4 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="mb-8 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                <MapPin className="w-6 h-6 text-emerald-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">
                                    {needsEvaluation ? "Evaluation Method" : "Pickup Location"}
                                </h2>
                                <p className="text-slate-400">
                                    {needsEvaluation
                                        ? "Choose how you'd like your device to be assessed."
                                        : "Where should we collect the device from?"}
                                </p>
                            </div>
                        </div>

                        {/* For Poor / Broken: show evaluation method chooser first */}
                        {needsEvaluation && (
                            <div className="space-y-4">
                                <label className="text-sm font-semibold text-slate-300 block">How would you like your device evaluated?</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Home visit option */}
                                    <button
                                        onClick={() => updateData({ evaluationMethod: "home-visit", selectedStoreId: "" })}
                                        className={`group relative p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
                                            data.evaluationMethod === "home-visit"
                                                ? "border-blue-500 bg-blue-500/10"
                                                : "border-slate-700 bg-slate-950 hover:border-slate-600"
                                        }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${data.evaluationMethod === "home-visit" ? "bg-blue-500/20" : "bg-slate-800"}`}>
                                            <Home className={`w-5 h-5 ${data.evaluationMethod === "home-visit" ? "text-blue-400" : "text-slate-400"}`} />
                                        </div>
                                        <h3 className="font-bold text-white mb-1">Engineer Home Visit</h3>
                                        <p className="text-xs text-slate-400 leading-relaxed">An expert engineer visits your home address within 24 hours. A £150 dispatch fee applies.</p>
                                        {data.evaluationMethod === "home-visit" && (
                                            <div className="absolute top-3 right-3">
                                                <CheckCircle2 className="w-5 h-5 text-blue-400" />
                                            </div>
                                        )}
                                    </button>

                                    {/* Store visit option */}
                                    <button
                                        onClick={() => updateData({ evaluationMethod: "store", address: "" })}
                                        className={`group relative p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
                                            data.evaluationMethod === "store"
                                                ? "border-emerald-500 bg-emerald-500/10"
                                                : "border-slate-700 bg-slate-950 hover:border-slate-600"
                                        }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${data.evaluationMethod === "store" ? "bg-emerald-500/20" : "bg-slate-800"}`}>
                                            <Store className={`w-5 h-5 ${data.evaluationMethod === "store" ? "text-emerald-400" : "text-slate-400"}`} />
                                        </div>
                                        <h3 className="font-bold text-white mb-1">Visit Nearest Store</h3>
                                        <p className="text-xs text-slate-400 leading-relaxed">Drop your device at one of our stores. No dispatch fee — walk in any time during opening hours.</p>
                                        {data.evaluationMethod === "store" && (
                                            <div className="absolute top-3 right-3">
                                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                            </div>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Home visit — address input */}
                        {(data.evaluationMethod === "home-visit" || !needsEvaluation) && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <label className="text-sm font-medium text-slate-300 mb-1.5 block">
                                    {needsEvaluation ? "Your Home Address" : "Full Pickup Address"}
                                </label>
                                <textarea
                                    rows={4}
                                    placeholder="123 Example Street, London, EC1A 1BB"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-all resize-none"
                                    value={data.address}
                                    onChange={e => updateData({ address: e.target.value })}
                                />
                            </div>
                        )}

                        {/* Store visit — store picker */}
                        {data.evaluationMethod === "store" && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <label className="text-sm font-medium text-slate-300 block flex items-center gap-1.5">
                                    <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                                    Select Your Nearest Store
                                </label>
                                <div className="space-y-2">
                                    {STORES.map(store => (
                                        <button
                                            key={store.id}
                                            onClick={() => updateData({ selectedStoreId: store.id })}
                                            className={`w-full p-4 rounded-xl border text-left transition-all duration-200 ${
                                                data.selectedStoreId === store.id
                                                    ? "border-emerald-500 bg-emerald-500/10"
                                                    : "border-slate-800 bg-slate-950 hover:border-slate-700"
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <Store className={`w-3.5 h-3.5 shrink-0 ${data.selectedStoreId === store.id ? "text-emerald-400" : "text-slate-500"}`} />
                                                        <span className="font-semibold text-sm text-white">{store.name}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-400 ml-5">{store.address}</p>
                                                    <p className="text-xs text-slate-500 ml-5 mt-1">{store.hours}</p>
                                                </div>
                                                <div className="shrink-0 text-right">
                                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${data.selectedStoreId === store.id ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-400"}`}>
                                                        {store.distance}
                                                    </span>
                                                </div>
                                            </div>
                                            {data.selectedStoreId === store.id && (
                                                <div className="mt-2 ml-5 flex items-center gap-1.5 text-emerald-400">
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    <span className="text-xs font-semibold">Selected</span>
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-slate-500 text-center pt-1">Distances are approximate. No appointment needed — just walk in.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Step 5: Summary & Fees ── */}
                {step === 5 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="mb-8 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                <CheckSquare className="w-6 h-6 text-blue-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Almost done</h2>
                                <p className="text-slate-400">Review your ticket request and accept the terms.</p>
                            </div>
                        </div>

                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 mb-6">
                            <h3 className="text-lg font-bold text-white mb-4">Ticket Summary</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between border-b border-slate-800 pb-3">
                                    <span className="text-slate-400">Device</span>
                                    <span className="font-medium text-slate-200">{data.make} {data.model} ({data.storage})</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-800 pb-3">
                                    <span className="text-slate-400">Condition</span>
                                    <span className="font-medium text-slate-200">{data.condition}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-800 pb-3">
                                    <span className="text-slate-400">Photos Included</span>
                                    <span className="font-medium text-slate-200">{photosUploadedCount}/3 Uploaded</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-800 pb-3">
                                    <span className="text-slate-400">Expected Value</span>
                                    <span className="font-bold text-emerald-400">£{data.askedPrice}</span>
                                </div>

                                {/* Evaluation / Pickup method */}
                                {needsEvaluation ? (
                                    <div className="flex justify-between border-b border-slate-800 pb-3">
                                        <span className="text-slate-400">Evaluation Method</span>
                                        <span className={`font-medium flex items-center gap-1.5 ${data.evaluationMethod === "store" ? "text-emerald-400" : "text-blue-400"}`}>
                                            {data.evaluationMethod === "store"
                                                ? <><Store className="w-3.5 h-3.5" /> Store Visit</>
                                                : <><Home className="w-3.5 h-3.5" /> Home Visit</>
                                            }
                                        </span>
                                    </div>
                                ) : null}

                                <div className="flex justify-between">
                                    <span className="text-slate-400">{data.evaluationMethod === "store" ? "Selected Store" : "Location"}</span>
                                    <span className="font-medium text-slate-200 max-w-[55%] text-right truncate" title={data.evaluationMethod === "store" ? selectedStore?.address : data.address}>
                                        {data.evaluationMethod === "store" ? selectedStore?.name : data.address}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Engineer home visit warning — only if home-visit chosen */}
                        {needsEvaluation && data.evaluationMethod === "home-visit" && (
                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 mb-6 flex gap-4 animate-in fade-in zoom-in-95 duration-500">
                                <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
                                <div>
                                    <h4 className="font-bold text-amber-500 mb-1">Mandatory Engineer Visit — Fee Notice</h4>
                                    <p className="text-sm text-slate-300 leading-relaxed mb-4">
                                        Because you listed the device condition as <strong className="text-white">"{data.condition}"</strong>, an engineer will visit your address within 24 hours to perform a deep diagnostics check before releasing payment.
                                    </p>
                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <div className="relative pt-0.5">
                                            <input type="checkbox" className="peer sr-only" checked={data.acceptFee} onChange={e => updateData({ acceptFee: e.target.checked })} />
                                            <div className="w-5 h-5 border-2 border-slate-600 rounded bg-slate-950 peer-checked:bg-amber-500 peer-checked:border-amber-500 transition-colors flex items-center justify-center">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-slate-900 opacity-0 peer-checked:opacity-100 transition-opacity" />
                                            </div>
                                        </div>
                                        <span className="text-sm text-amber-100/80 group-hover:text-amber-100 transition-colors">
                                            <strong className="text-amber-400">I acknowledge and accept</strong> the £150 operational dispatch fee which will be deducted from my final payout.
                                        </span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Store visit confirmation banner */}
                        {needsEvaluation && data.evaluationMethod === "store" && (
                            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5 mb-6 flex gap-4 animate-in fade-in zoom-in-95 duration-500">
                                <Store className="w-6 h-6 text-emerald-400 shrink-0 mt-1" />
                                <div>
                                    <h4 className="font-bold text-emerald-400 mb-1">In-Store Evaluation — No Fee</h4>
                                    <p className="text-sm text-slate-300 leading-relaxed">
                                        You've chosen to bring your device to <strong className="text-white">{selectedStore?.name}</strong>. Simply walk in during opening hours — <span className="text-emerald-300">{selectedStore?.hours}</span>. Our team will evaluate it on the spot and you'll receive your offer within minutes.
                                    </p>
                                    <p className="text-xs text-emerald-400/70 mt-2">📍 {selectedStore?.address}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Step 6: Success ── */}
                {step === 6 && (
                    <div className="space-y-6 text-center py-10 animate-in zoom-in-95 fade-in duration-500">
                        <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-emerald-500/20 shadow-[0_0_50px_-15px_rgba(16,185,129,0.5)]">
                            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-3">Ticket Successfully Created!</h2>
                        <p className="text-slate-400 max-w-sm mx-auto mb-8">
                            We've created ticket <strong className="text-slate-200">#{ticketId || `TKT-${(Math.random() * 10000).toFixed(0)}`}</strong> for your {data.model}.{" "}
                            {data.evaluationMethod === "store"
                                ? <>Visit <span className="text-emerald-400 font-semibold">{selectedStore?.name}</span> at your convenience to complete the evaluation.</>
                                : data.condition === "Poor" || data.condition === "Broken"
                                    ? "Our engineer dispatch team has been notified and will contact you to arrange a visit."
                                    : "Expect an email shortly with the exact delivery label details."}
                        </p>
                        {data.evaluationMethod === "store" && selectedStore && (
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-left max-w-xs mx-auto mb-6">
                                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Your Store</p>
                                <p className="text-sm font-bold text-white">{selectedStore.name}</p>
                                <p className="text-xs text-slate-400">{selectedStore.address}</p>
                                <p className="text-xs text-emerald-400 mt-1">{selectedStore.hours}</p>
                            </div>
                        )}
                        <div className="flex flex-col gap-3">
                            <Link href={user?.role === "ADMIN" ? "/admin" : user?.role === "VENDOR" ? "/vendor" : "/profile"} className="bg-slate-800 hover:bg-slate-700 text-white rounded-full px-6 py-3 font-semibold transition-colors">
                                Track your order
                            </Link>
                            <Link href="/" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">Return to Landing Page</Link>
                        </div>
                    </div>
                )}

                {/* Action controls */}
                {step < 6 && (
                    <div className="mt-10 pt-6 border-t border-slate-800/60 flex justify-between items-center">
                        {step > 1 ? (
                            <button onClick={prevStep} className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium text-slate-400 hover:text-white transition-colors hover:bg-white/5">
                                <ArrowLeft className="w-4 h-4" /> Back
                            </button>
                        ) : <div />}
                        <button
                            onClick={step === 5 ? handleSubmit : nextStep}
                            disabled={isSubmitting}
                            className={`flex items-center gap-2 px-8 py-3 rounded-full text-sm font-semibold transition-all ${
                                isSubmitting ? "bg-blue-600/50 text-white/50 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_-5px_rgba(37,99,235,0.5)]"
                            }`}
                        >
                            {isSubmitting ? "Creating Ticket..." : step === 5 ? "Submit Request" : <><span>Next Step</span><ArrowRight className="w-4 h-4" /></>}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
