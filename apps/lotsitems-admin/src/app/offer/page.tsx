"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle, MonitorSmartphone, MapPin, DollarSign, CheckSquare, Camera, UploadCloud, Image as ImageIcon, Smartphone } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";

type OfferData = {
    make: string;
    model: string;
    storage: string;
    condition: string;
    askedPrice: string;
    photos: {
        front: string | null;
        back: string | null;
        box: string | null;
    };
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
        address: "",
        acceptFee: false,
    });

    const [handoffSessionId, setHandoffSessionId] = useState<string | null>(null);
    const [showQR, setShowQR] = useState(false);

    // Initialise handoff session when reaching step 3
    if (step === 3 && !handoffSessionId) {
        setHandoffSessionId(`sid_${Date.now()}_${Math.random().toString(36).substring(7)}`);
    }

    // Polling hook for mobile QR handoff sync
    // eslint-disable-next-line react-hooks/rules-of-hooks
    import("react").then(({ useEffect }) => {
        useEffect(() => {
            if (step !== 3 || !handoffSessionId || !showQR) return;

            const interval = setInterval(async () => {
                try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/devices/handoff/${handoffSessionId}`);
                    if (!res.ok) return;
                    const result = await res.json();
                    if (result.success && result.session.status === 'UPLOADED') {
                        // Assign the photo to the first empty slot
                        setData(prev => {
                            const p = { ...prev.photos };
                            if (!p.front) p.front = result.session.photoUrl;
                            else if (!p.back) p.back = result.session.photoUrl;
                            else if (!p.box) p.box = result.session.photoUrl;
                            return { ...prev, photos: p };
                        });
                        // Automatically generate a new session ID for the *next* photo scan
                        setHandoffSessionId(`sid_${Date.now()}_${Math.random().toString(36).substring(7)}`);
                    }
                } catch (err) {
                    console.error('Polling error', err);
                }
            }, 2000);

            return () => clearInterval(interval);
        }, [step, handoffSessionId, showQR, setData]);
    });

    // Redirect to login if user is not authenticated
    if (!isLoading && !user) {
        router.push("/auth?redirect=/offer");
        return null;
    }

    const updateData = (fields: Partial<OfferData>) => {
        setData((prev) => ({ ...prev, ...fields }));
    };

    const nextStep = () => {
        if (step === 1 && (!data.make || !data.model || !data.storage)) return;
        if (step === 2 && (!data.condition || !data.askedPrice)) return;
        // Step 3 (Photos) is purely optional
        if (step === 4 && !data.address) return;
        if (step === 5 && (!data.acceptFee && (data.condition === "Poor" || data.condition === "Broken"))) return;

        setStep((s) => s + 1);
    };

    const prevStep = () => setStep((s) => s - 1);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const apiData = {
                brand: data.make,
                model: `${data.model} (${data.storage})`,
                specs: { storage: data.storage, address: data.address, acceptFee: data.acceptFee, askedPrice: data.askedPrice },
                condition: data.condition,
                userEmail: user?.email,
                userName: user?.name,
            };

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/devices/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(apiData)
            });

            if (!res.ok) throw new Error('Submission failed');

            const result = await res.json();
            if (result.success && result.ticket) {
                setTicketId(result.ticket.id);
            }
            
            setStep(6); // Success step
        } catch (error) {
            console.error('Submission error:', error);
            alert('Failed to submit ticket. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const needsEngineerVisit = data.condition === "Poor" || data.condition === "Broken";

    const photosUploadedCount = [data.photos.front, data.photos.back, data.photos.box].filter(Boolean).length;

    return (
        <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none -z-10" />
            <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-emerald-600/5 blur-[150px] rounded-full pointer-events-none -z-10" />

            {/* Top Nav */}
            <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-20">
                <Link href="/" className="font-bold text-xl tracking-tight text-white flex items-center gap-3">
                    <div className="relative w-8 h-8 overflow-hidden rounded-md border border-slate-700 bg-slate-950">
                        <Image 
                            src="/logo.png" 
                            alt="Lotsitems Logo" 
                            fill 
                            className="object-contain"
                        />
                    </div>
                    Lotsitems
                </Link>
                {step < 6 && (
                    <div className="flex items-center gap-4">
                        <div className="text-sm font-medium text-slate-400 hidden sm:block">
                            Step {step} of 5
                        </div>
                        <Link href={user?.role === "ADMIN" ? "/admin" : (user?.role === "VENDOR" ? "/vendor" : "/profile")} className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white hover:scale-110 transition-all active:scale-95 shadow-lg shadow-blue-500/20 border border-white/5">
                            {user?.name?.[0]}
                        </Link>
                    </div>
                )}
            </div>

            <div className="w-full max-w-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl p-6 md:p-10 animate-in zoom-in-95 duration-500 relative z-10">

                {/* Step Progression Bar */}
                {step < 6 && (
                    <div className="flex gap-2 w-full mb-10">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div
                                key={i}
                                className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${i < step ? "bg-blue-600" : i === step ? "bg-blue-500/50" : "bg-slate-800"
                                    }`}
                            />
                        ))}
                    </div>
                )}

                {/* Step 1: Device Details */}
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
                            <p className="text-sm text-blue-300 text-center sm:text-left">
                                Want a faster, interactive experience?
                            </p>
                            <Link
                                href="/assess"
                                className="bg-blue-600 hover:bg-blue-500 text-white rounded-full px-5 py-2 text-sm font-semibold transition-colors whitespace-nowrap"
                            >
                                Switch to AI Chat Evaluation
                            </Link>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-300 mb-1.5 block">Make (Brand)</label>
                                <select
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-all appearance-none"
                                    value={data.make}
                                    onChange={(e) => updateData({ make: e.target.value })}
                                >
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
                                <input
                                    type="text"
                                    placeholder="e.g. iPhone 15 Pro Max"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-all"
                                    value={data.model}
                                    onChange={(e) => updateData({ model: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-300 mb-1.5 block">Storage / Memory</label>
                                <select
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-all appearance-none"
                                    value={data.storage}
                                    onChange={(e) => updateData({ storage: e.target.value })}
                                >
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

                {/* Step 2: Condition & Price */}
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
                                    {["Mint", "Good", "Poor", "Broken"].map((cond) => (
                                        <button
                                            key={cond}
                                            onClick={() => updateData({ condition: cond })}
                                            className={`p-4 rounded-xl border text-left transition-all ${data.condition === cond
                                                ? "bg-blue-600/10 border-blue-500 text-blue-400"
                                                : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                                                }`}
                                        >
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
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-300 mb-1.5 block">Your Asking Price (£)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className="text-slate-500">£</span>
                                    </div>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-all font-semibold text-lg"
                                        value={data.askedPrice}
                                        onChange={(e) => updateData({ askedPrice: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Photos */}
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
                            {[
                                { id: "front", label: "Front Screen" },
                                { id: "back", label: "Back Panel" },
                                { id: "box", label: "Original Box" }
                            ].map((photoType) => (
                                <div key={photoType.id} className="relative">
                                    <label className="text-sm font-medium text-slate-300 mb-2 block">{photoType.label}</label>
                                    <label
                                        className="flex flex-col items-center justify-center h-32 w-full bg-slate-950 border-2 border-dashed border-slate-700/60 rounded-xl hover:border-blue-500 hover:bg-blue-500/5 transition-all outline-none cursor-pointer group overflow-hidden relative"
                                    >
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const url = URL.createObjectURL(file);
                                                    updateData({
                                                        photos: { ...data.photos, [photoType.id]: url }
                                                    });
                                                }
                                            }}
                                        />

                                        {data.photos[photoType.id as keyof typeof data.photos] ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={data.photos[photoType.id as keyof typeof data.photos]!}
                                                alt={photoType.label}
                                                className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-50 transition-opacity"
                                            />
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

                        {/* Mobile QR Request Option */}
                        <div className="mt-6 flex flex-col items-center border border-slate-800 rounded-xl p-4 bg-slate-900/50">
                            <button
                                onClick={() => setShowQR(!showQR)}
                                className="w-full bg-slate-800 hover:bg-slate-700 text-white rounded-xl px-4 py-3 flex items-center justify-center gap-2 text-sm font-semibold transition-all active:scale-95"
                            >
                                <Smartphone className="w-5 h-5 text-blue-400" />
                                {showQR ? "Hide Mobile Scanner" : "Use Phone Camera Instead"}
                            </button>
                            
                            {showQR && handoffSessionId && (
                                <div className="mt-6 bg-white rounded-[24px] p-6 flex flex-col items-center animate-in zoom-in-95 duration-200">
                                    <QRCodeSVG value={`${typeof window !== 'undefined' ? window.location.origin : ''}/assess/camera/${handoffSessionId}`} size={180} level="H" />
                                    <p className="text-slate-900 font-bold text-sm mt-4 text-center">Scan with Phone Camera</p>
                                    <p className="text-slate-500 text-xs text-center mt-1 w-48">
                                        Take a photo on your phone and it will securely sync here.
                                    </p>
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

                {/* Step 4: Location */}
                {step === 4 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="mb-8 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                <MapPin className="w-6 h-6 text-emerald-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Pickup Location</h2>
                                <p className="text-slate-400">Where should we collect the device from?</p>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-300 mb-1.5 block">Full Address</label>
                            <textarea
                                rows={4}
                                placeholder="123 Example Street, London, EC1A 1BB"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-all resize-none"
                                value={data.address}
                                onChange={(e) => updateData({ address: e.target.value })}
                            />
                        </div>
                    </div>
                )}

                {/* Step 5: Final Summary & Fees */}
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
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Location</span>
                                    <span className="font-medium text-slate-200 max-w-[50%] text-right truncate" title={data.address}>{data.address}</span>
                                </div>
                            </div>
                        </div>

                        {needsEngineerVisit && (
                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 mb-6 flex gap-4 animate-in fade-in zoom-in-95 duration-500">
                                <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
                                <div>
                                    <h4 className="font-bold text-amber-500 mb-1">Mandatory Engineer Visit Info</h4>
                                    <p className="text-sm text-slate-300 leading-relaxed mb-4">
                                        Because you listed the device condition as <strong className="text-white">"{data.condition}"</strong>, an engineer is required to physically visit your address within the next 24 Hours to perform a deep diagnostics check before handing over the money.
                                    </p>

                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <div className="relative pt-0.5">
                                            <input
                                                type="checkbox"
                                                className="peer sr-only"
                                                checked={data.acceptFee}
                                                onChange={(e) => updateData({ acceptFee: e.target.checked })}
                                            />
                                            <div className="w-5 h-5 border-2 border-slate-600 rounded bg-slate-950 peer-checked:bg-amber-500 peer-checked:border-amber-500 transition-colors flex items-center justify-center">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-slate-900 opacity-0 peer-checked:opacity-100 transition-opacity" />
                                            </div>
                                        </div>
                                        <span className="text-sm text-amber-100/80 group-hover:text-amber-100 transition-colors">
                                            <strong className="text-amber-400">I acknowledge and accept</strong> the £150 operational dispatch fee which will be inherently deducted from my final payout.
                                        </span>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 6: Success Ticket View */}
                {step === 6 && (
                    <div className="space-y-6 text-center py-10 animate-in zoom-in-95 fade-in duration-500">
                        <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-emerald-500/20 shadow-[0_0_50px_-15px_rgba(16,185,129,0.5)]">
                            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-3">Ticket Successfully Created!</h2>
                        <p className="text-slate-400 max-w-sm mx-auto mb-8">
                            We've created ticket <strong className="text-slate-200">#{ticketId || `TKT-${(Math.random() * 10000).toFixed(0)}`}</strong> targeting your {data.model}.
                            {needsEngineerVisit
                                ? " Our engineer dispatch team has been notified and will contact you shortly to arrange a visit."
                                : " Expect an email shortly with the exact delivery label details."}
                        </p>
                        <div className="flex flex-col gap-3">
                             <Link
                                 href={user?.role === "ADMIN" ? "/admin" : (user?.role === "VENDOR" ? "/vendor" : "/profile")}
                                 className="bg-slate-800 hover:bg-slate-700 text-white rounded-full px-6 py-3 font-semibold transition-colors"
                             >
                                Track your order
                            </Link>
                            <Link
                                href="/"
                                className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
                            >
                                Return to Landing Page
                            </Link>
                        </div>
                    </div>
                )}

                {/* Action Controls */}
                {step < 6 && (
                    <div className="mt-10 pt-6 border-t border-slate-800/60 flex justify-between items-center">
                        {step > 1 ? (
                            <button
                                onClick={prevStep}
                                className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium text-slate-400 hover:text-white transition-colors hover:bg-white/5"
                            >
                                <ArrowLeft className="w-4 h-4" /> Back
                            </button>
                        ) : <div />}

                        <button
                            onClick={step === 5 ? handleSubmit : nextStep}
                            disabled={isSubmitting}
                            className={`flex items-center gap-2 px-8 py-3 rounded-full text-sm font-semibold transition-all ${isSubmitting
                                ? "bg-blue-600/50 text-white/50 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_-5px_rgba(37,99,235,0.5)]"
                                }`}
                        >
                            {isSubmitting ? (
                                "Creating Ticket..."
                            ) : step === 5 ? (
                                "Submit Request"
                            ) : (
                                <>Next Step <ArrowRight className="w-4 h-4" /></>
                            )}
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}
