"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import {
    Bot, User as UserIcon, Send, Sparkles, Loader2, DollarSign,
    Camera, ArrowLeft, CheckCircle2, AlertTriangle, ScanLine,
    UploadCloud, Image as ImageIcon, X, Smartphone
} from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type Message = {
    role: "user" | "ai";
    content: string | React.ReactNode;
};

// Each step in the conversation state machine
type JourneyStep =
    | "ASK_DEVICE"       // Step 1: what device?
    | "ASK_STORAGE"      // Step 2: storage / specs
    | "ASK_CONDITION"    // Step 3: visual scan or manual condition
    | "SCANNING"         // Step 3b: camera is "scanning"
    | "ASK_PRICE"        // Step 4: asking price
    | "FINAL_OFFER"      // Step 5: show price + accept button
    | "SUBMITTING"       // Submitting to API
    | "DONE";            // Ticket created

// Gathered device info across the conversation
type DeviceInfo = {
    deviceName: string;   // from step 1
    storage: string;      // from step 2
    condition: string;    // from step 3
    askedPrice: string;   // from step 4
    scannedPhoto: string | null; // base64 or object URL
    suggestedPrice?: number; // from vision AI
};

function adjustPriceForCondition(basePrice: number, originalCond: string, newCond: string): number {
    const multipliers: Record<string, number> = { Mint: 1.0, Good: 0.75, Poor: 0.4, Broken: 0.15 };
    const origMult = multipliers[originalCond] ?? 0.75;
    const newMult = multipliers[newCond] ?? 0.75;
    const safeOrigMult = origMult === 0 ? 0.75 : origMult;
    const mintBase = basePrice / safeOrigMult;
    return Math.round(mintBase * newMult);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
}

function parseConditionFromText(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes("mint") || lower.includes("perfect") || lower.includes("flawless")) return "Mint";
    if (lower.includes("broken") || lower.includes("crack") || lower.includes("shatter")) return "Broken";
    if (lower.includes("poor") || lower.includes("heavy wear") || lower.includes("damage")) return "Poor";
    return "Good";
}

function parseBrandFromDevice(name: string): string {
    const brands = ["Apple", "Samsung", "Google", "Sony", "OnePlus", "Xiaomi", "Huawei", "Nokia"];
    for (const b of brands) {
        if (name.toLowerCase().includes(b.toLowerCase())) return b;
    }
    return "Other";
}

function estimatePrice(condition: string, deviceName: string): number {
    const lower = deviceName.toLowerCase();
    // Very rough tiers based on device name keywords
    let base = 400;
    if (lower.includes("pro max") || lower.includes("ultra") || lower.includes("m3")) base = 900;
    else if (lower.includes("pro") || lower.includes("plus")) base = 700;
    else if (lower.includes("macbook") || lower.includes("ipad")) base = 650;

    const multiplier: Record<string, number> = {
        Mint: 1.0, Good: 0.75, Poor: 0.35, Broken: 0.15,
    };
    return Math.round(base * (multiplier[condition] ?? 0.75));
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AssessPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    const [step, setStep] = useState<JourneyStep>("ASK_DEVICE");
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "ai",
            content: "Hi there! I'm your AI Assessment Agent. What device are you looking to sell today? (e.g. \"iPhone 15 Pro Max\", \"Samsung Galaxy S24 Ultra\")"
        }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [ticketId, setTicketId] = useState<string | null>(null);
    const [handoffSessionId, setHandoffSessionId] = useState<string | null>(null);

    const [device, setDevice] = useState<DeviceInfo>({
        deviceName: "", storage: "", condition: "", askedPrice: "", scannedPhoto: null
    });

    // For camera / file upload in the scan step
    const [scanState, setScanState] = useState<"idle" | "analysing" | "done">("idle");
    const [scanPhotoUrl, setScanPhotoUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // ─── Auth guard ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (!isLoading && !user) router.push("/auth");
    }, [user, isLoading, router]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    // ─── Polling for mobile handoff sync ────────────────────────────────────
    useEffect(() => {
        if (step !== "ASK_CONDITION" || !handoffSessionId) return;

        const interval = setInterval(async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/devices/handoff/${handoffSessionId}`);
                if (!res.ok) return;
                const data = await res.json();
                if (data.success && data.session.status === 'UPLOADED') {
                    clearInterval(interval);
                    handleMobileUpload(data.session.photoUrl);
                }
            } catch (err) {
                console.error('Polling error', err);
            }
        }, 2000);

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step, handoffSessionId]);

    // ─── Core: add AI reply after a delay ───────────────────────────────────
    const aiReply = useCallback((content: string | React.ReactNode, delay = 1200) => {
        setIsTyping(true);
        setTimeout(() => {
            setMessages(prev => [...prev, { role: "ai", content }]);
            setIsTyping(false);
        }, delay);
    }, []);

    // ─── Handle user text send ───────────────────────────────────────────────
    const handleSend = () => {
        const text = input.trim();
        if (!text || isTyping || step === "SCANNING" || step === "SUBMITTING" || step === "DONE") return;

        setMessages(prev => [...prev, { role: "user", content: text }]);
        setInput("");

        if (step === "ASK_DEVICE") {
            setDevice(d => ({ ...d, deviceName: text }));
            setStep("ASK_STORAGE");
            aiReply(`Great choice! I've noted the **${text}**. What storage / memory configuration is it? (e.g. 256GB, 128GB / 8GB RAM)`);

        } else if (step === "ASK_STORAGE") {
            setDevice(d => ({ ...d, storage: text }));
            setStep("ASK_CONDITION");
            const sid = `sid_${Date.now()}`;
            setHandoffSessionId(sid);
            aiReply(<ConditionPrompt onScan={triggerScan} sessionId={sid} onPresetSelect={handlePresetSelect} />, 1000);

        } else if (step === "ASK_CONDITION") {
            // Manual condition entry
            const cond = parseConditionFromText(text);
            setDevice(d => ({ ...d, condition: cond }));
            setStep("ASK_PRICE");
            aiReply(`Got it — I'm logging the condition as **${cond}**. What's your asking price in £? (Enter numbers only, e.g. 450)`);

        } else if (step === "ASK_PRICE") {
            const price = text.replace(/[^0-9.]/g, "");
            setDevice(d => ({ ...d, askedPrice: price || text }));
            setStep("FINAL_OFFER");

            // Show the final offer card
            const finalDevice = { ...device, askedPrice: price || text };
            const cond = finalDevice.condition || "Good";
            const estimated = device.suggestedPrice ?? estimatePrice(cond, finalDevice.deviceName);
            aiReply(<FinalOfferCard
                device={device.deviceName}
                storage={device.storage}
                condition={cond}
                askedPrice={price || text}
                estimatedPrice={estimated}
                photoUrl={scanPhotoUrl}
                onAccept={() => submitOffer(finalDevice, estimated)}
                deviceDetails={device}
            />, 1400);
        }
    };

    // ─── Visual scan flow ────────────────────────────────────────────────────
    const triggerScan = () => {
        fileInputRef.current?.click();
    };

    const updateDeviceConditionAndProceed = useCallback((cond: string, backendPrice: number, originalCond: string) => {
        const finalPrice = cond === originalCond ? backendPrice : adjustPriceForCondition(backendPrice, originalCond, cond);
        
        setDevice(d => ({ 
            ...d, 
            condition: cond,
            suggestedPrice: finalPrice
        }));
        setScanState("done");
        setStep("ASK_PRICE");
        aiReply(`Condition locked as **${cond}**. What's your asking price in £? (Enter numbers only, e.g. 450)`);
    }, [aiReply]);

    const processImageEvaluation = useCallback(async (base64Data: string, displayUrl: string) => {
        setScanPhotoUrl(displayUrl);
        setScanState("analysing");
        setIsTyping(true);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
            const response = await fetch(`${apiUrl}/devices/evaluate-image`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    image: base64Data,
                    deviceName: device.deviceName,
                    storage: device.storage
                })
            });

            if (!response.ok) {
                throw new Error("Failed to evaluate image");
            }

            const data = await response.json();
            setIsTyping(false);

            if (data.success) {
                if (!data.isReal) {
                    setScanState("idle");
                    setMessages(prev => [...prev, {
                        role: "ai",
                        content: (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                                    <AlertTriangle className="w-4.5 h-4.5 animate-bounce" />
                                    Image Verification Required
                                </div>
                                <p className="text-slate-300 text-sm">
                                    {data.retryMessage || `Oops! That photo doesn't look like a mobile phone, tablet, or laptop. To help us give you the most accurate price, could you please take a clear, well-lit photo of your device's front or back and try again? We'd love to help you get some quick cash for your tech!`}
                                </p>
                                <div className="border-t border-slate-800/80 pt-3 mt-1">
                                    <ConditionPrompt onScan={triggerScan} sessionId={handoffSessionId || undefined} onPresetSelect={handlePresetSelect} />
                                </div>
                            </div>
                        )
                    }]);
                } else {
                    setScanState("done");
                    setDevice(d => ({ 
                        ...d, 
                        scannedPhoto: base64Data,
                        condition: data.condition,
                        suggestedPrice: data.suggestedPrice
                    }));

                    setMessages(prev => [...prev, {
                        role: "ai",
                        content: (
                            <ScanResultCard 
                                initialCondition={data.condition}
                                reasoning={data.reasoning}
                                onConfirm={(cond) => {
                                    updateDeviceConditionAndProceed(cond, data.suggestedPrice, data.condition);
                                }} 
                            />
                        )
                    }]);
                }
            } else {
                throw new Error(data.error || "Evaluation failed");
            }
        } catch (err) {
            console.error("Image evaluation error:", err);
            setIsTyping(false);
            setScanState("idle");
            setMessages(prev => [...prev, {
                role: "ai",
                content: `Sorry, we encountered a technical issue while evaluating the image. Please try uploading again or type your condition manually.`
            }]);
        }
    }, [device.deviceName, device.storage, handoffSessionId, updateDeviceConditionAndProceed]);

    function handlePresetSelect(presetType: string) {
        let base64 = "";
        let displayName = "";
        let displayUrl = "";

        if (presetType === "mint-iphone") {
            base64 = "data:image/jpeg;base64,mint_iphone_preset_data_" + "A".repeat(1100);
            displayName = "📱 Real iPhone 15 Pro (Mint)";
            displayUrl = "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&auto=format&fit=crop&q=60";
        } else if (presetType === "broken-galaxy") {
            base64 = "data:image/jpeg;base64,broken_galaxy_preset_data_" + "A".repeat(1100);
            displayName = "💥 Real Galaxy S24 Ultra (Cracked Screen)";
            displayUrl = "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&auto=format&fit=crop&q=60";
        } else if (presetType === "pizza") {
            base64 = "data:image/jpeg;base64,fake_pizza_preset_data_" + "A".repeat(1100);
            displayName = "🍕 Fake Photo (Pizza Slice)";
            displayUrl = "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=60";
        } else if (presetType === "document") {
            base64 = "data:image/jpeg;base64,fake_document_preset_data_" + "A".repeat(1100);
            displayName = "📄 Fake Photo (Screenshot/Document)";
            displayUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=60";
        }

        setMessages(prev => [...prev, {
            role: "user",
            content: (
                <div className="space-y-2">
                    <p className="text-sm opacity-80">📸 Preset submitted: <strong>{displayName}</strong></p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={displayUrl} alt="Preset scan" className="rounded-xl max-h-48 object-cover w-full" />
                </div>
            )
        }]);

        processImageEvaluation(base64, displayUrl);
    }

    const handleMobileUpload = useCallback((base64Url: string) => {
        setScanPhotoUrl(base64Url);
        setScanState("analysing");
        setDevice(d => ({ ...d, scannedPhoto: base64Url }));

        setMessages(prev => [...prev, {
            role: "user",
            content: (
                <div className="space-y-2">
                    <p className="text-sm opacity-80">📸 Photo synced from mobile</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={base64Url} alt="Device scan" className="rounded-xl max-h-48 object-cover w-full" />
                </div>
            )
        }]);

        processImageEvaluation(base64Url, base64Url);
    }, [processImageEvaluation]);

    const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const url = URL.createObjectURL(file);
        setScanPhotoUrl(url);
        setScanState("analysing");

        let base64 = "";
        try {
            base64 = await fileToBase64(file);
            setDevice(d => ({ ...d, scannedPhoto: base64 }));
        } catch (err) {
            console.error("File conversion failed:", err);
            return;
        }

        setMessages(prev => [...prev, {
            role: "user",
            content: (
                <div className="space-y-2">
                    <p className="text-sm opacity-80">📸 Photo submitted for analysis</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="Device scan" className="rounded-xl max-h-48 object-cover w-full" />
                </div>
            )
        }]);

        processImageEvaluation(base64, url);
    };

    // ─── Submit ticket ───────────────────────────────────────────────────────
    const submitOffer = async (finalDevice: DeviceInfo, estimatedPrice: number) => {
        setStep("SUBMITTING");
        const apiData = {
            brand: parseBrandFromDevice(finalDevice.deviceName),
            model: `${finalDevice.deviceName} ${finalDevice.storage}`.trim(),
            specs: {
                storage: finalDevice.storage,
                condition: finalDevice.condition,
                askedPrice: finalDevice.askedPrice,
                estimatedPrice,
                scannedPhoto: finalDevice.scannedPhoto, // PERSISTED PHOTO
            },
            condition: finalDevice.condition,
            userEmail: user?.email,
            userName: user?.name,
        };

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/devices/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(apiData),
            });
            if (!res.ok) throw new Error("Submission failed");
            const result = await res.json();
            if (result.success && result.ticket) {
                setTicketId(result.ticket.id);
                setStep("DONE");
            }
        } catch (err) {
            console.error(err);
            setStep("FINAL_OFFER");
            alert("Failed to submit. Please try again.");
        }
    };

    if (isLoading || !user) return null;

    const inputDisabled = isTyping || step === "SCANNING" || step === "SUBMITTING" || step === "DONE" || step === "FINAL_OFFER" || step === "ASK_CONDITION";

    return (
        <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
            {/* Hidden file input for photo scan */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileSelected}
            />

            {/* Header */}
            <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md p-4 sticky top-0 z-10 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Link href="/" className="p-2 -ml-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex items-center gap-2">
                        <Bot className="w-6 h-6 text-blue-500" />
                        <h1 className="font-bold text-white hidden sm:block">AI Device Evaluation</h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <StepPills current={step} />
                    <Link href={user?.role === "ADMIN" ? "/admin" : (user?.role === "VENDOR" ? "/vendor" : "/profile")} className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white hover:scale-110 transition-all active:scale-95 shadow-lg shadow-blue-500/20 border border-white/5 ml-2">
                        {user.name?.[0]}
                    </Link>
                    <span className="text-sm font-medium text-slate-400 hidden md:block">{user.name}</span>
                </div>
            </header>

            {/* Chat Area */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center">
                <div className="w-full max-w-3xl space-y-6">
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                            {msg.role === "ai" && (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shrink-0 mt-1 shadow-lg">
                                    <Bot className="w-5 h-5 text-white" />
                                </div>
                            )}
                            <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${msg.role === "user"
                                ? "bg-blue-600 text-white rounded-tr-none shadow-lg"
                                : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none"
                                }`}>
                                {msg.content}
                            </div>
                            {msg.role === "user" && (
                                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center shrink-0 mt-1">
                                    <UserIcon className="w-5 h-5 text-white" />
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Typing indicator */}
                    {isTyping && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shrink-0 mt-1">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-4 flex items-center gap-2">
                                <span className="flex gap-1">
                                    {[0, 1, 2].map(i => (
                                        <span key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                                    ))}
                                </span>
                                <span className="text-sm text-slate-400 ml-1">
                                    {scanState === "analysing" ? "Analysing photo with Vision AI…" : "Thinking…"}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Done state */}
                    {step === "DONE" && ticketId && (
                        <div className="mt-6 animate-in zoom-in-95 fade-in duration-500 text-center bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-8">
                            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-emerald-500/20 shadow-[0_0_50px_-15px_rgba(16,185,129,0.5)]">
                                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Ticket Successfully Created!</h2>
                            <p className="text-slate-400 mb-6">
                                Your reference is <strong className="text-emerald-400 font-mono">#{ticketId.slice(0, 8).toUpperCase()}</strong>. Our team will be in touch within 24 hours.
                            </p>
                             <Link href={user?.role === "ADMIN" ? "/admin" : (user?.role === "VENDOR" ? "/vendor" : "/profile")} className="bg-blue-600 hover:bg-blue-500 text-white rounded-full px-6 py-3 font-semibold transition-colors text-sm inline-block">
                                 Track your order
                             </Link>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </main>

            {/* Input */}
            <footer className="p-4 bg-slate-900/50 backdrop-blur-md border-t border-slate-800">
                <div className="max-w-3xl mx-auto">
                    {inputDisabled && step !== "DONE" && step !== "SUBMITTING" && (
                        <p className="text-xs text-center text-slate-500 mb-2">
                            {step === "ASK_CONDITION" ? "Please use the scan button or type your condition above ↑" : "Use the options in the chat above ↑"}
                        </p>
                    )}
                    <div className="relative">
                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleSend()}
                            placeholder={inputDisabled ? "Respond using the options above…" : "Type your message…"}
                            disabled={inputDisabled}
                            className="w-full bg-slate-950 border border-slate-800 rounded-full px-6 py-4 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pr-16 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || inputDisabled}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-full p-2.5 transition-colors"
                        >
                            <Send className="w-4 h-4 ml-0.5" />
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
}

// ─── Sub-components rendered inside chat messages ─────────────────────────────
// These are declared outside the main component so they're stable references

function StepPills({ current }: { current: string }) {
    const steps = [
        { id: "ASK_DEVICE", label: "Device" },
        { id: "ASK_STORAGE", label: "Specs" },
        { id: "ASK_CONDITION", label: "Condition" },
        { id: "ASK_PRICE", label: "Price" },
        { id: "FINAL_OFFER", label: "Offer" },
    ];
    const activeIndex = steps.findIndex(s => s.id === current);
    return (
        <div className="hidden sm:flex gap-1 items-center">
            {steps.map((s, i) => (
                <div key={s.id} className={`transition-all rounded-full text-[10px] font-medium px-2.5 py-1 ${i < activeIndex
                    ? "bg-emerald-500/20 text-emerald-400"
                    : i === activeIndex
                        ? "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/40"
                        : "bg-slate-800 text-slate-500"
                    }`}>
                    {s.label}
                </div>
            ))}
        </div>
    );
}

function ConditionPrompt({ 
    onScan, 
    sessionId, 
    onPresetSelect 
}: { 
    onScan: () => void; 
    sessionId?: string; 
    onPresetSelect?: (presetType: string) => void;
}) {
    const [showQR, setShowQR] = useState(false);
    const domain = typeof window !== 'undefined' ? window.location.origin : '';
    const qrUrl = `${domain}/assess/camera/${sessionId}`;

    return (
        <div className="space-y-4">
            <p>
                Now let&apos;s assess the condition. You can <strong className="text-white">upload a photo</strong>, use your phone camera, or just type the condition below (Mint / Good / Poor / Broken).
            </p>
            <div className="flex gap-2">
                <button
                    onClick={onScan}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white rounded-xl px-4 py-3.5 flex items-center justify-center gap-2 text-sm font-semibold transition-all active:scale-95 border border-slate-700/50"
                >
                    <UploadCloud className="w-5 h-5 text-blue-400" />
                    From PC
                </button>
                {sessionId && (
                    <button
                        onClick={() => setShowQR(!showQR)}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl px-4 py-3.5 flex items-center justify-center gap-2 text-sm font-semibold transition-all shadow-lg active:scale-95"
                    >
                        <Smartphone className="w-5 h-5 animate-pulse" />
                        Use Phone
                    </button>
                )}
            </div>
            
            {showQR && sessionId && (
                <div className="bg-white rounded-[24px] p-6 flex flex-col items-center animate-in zoom-in-95 duration-200 shadow-xl mx-auto w-fit">
                    <QRCodeSVG value={qrUrl} size={180} level="H" />
                    <p className="text-slate-900 font-bold text-sm mt-4 text-center">Scan with Phone Camera</p>
                    <p className="text-slate-500 text-xs text-center mt-1">Leave this page open to sync automatically</p>
                </div>
            )}

            {/* Quick Test Presets (Wow-Factor UI block) */}
            <div className="border-t border-slate-800/80 pt-4 mt-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    Quick Test Presets (Instant AI Evaluation)
                </p>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => onPresetSelect?.("mint-iphone")}
                        className="bg-slate-900/60 hover:bg-slate-800/80 border border-emerald-500/30 hover:border-emerald-500/60 rounded-xl p-3 text-left transition-all hover:scale-[1.02] active:scale-95 flex flex-col justify-between h-20"
                    >
                        <div className="flex justify-between items-start w-full">
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Mint Preset</span>
                            <span className="text-sm">📱</span>
                        </div>
                        <div className="text-xs text-slate-300 font-semibold truncate w-full">Real iPhone (Mint)</div>
                    </button>
                    <button
                        onClick={() => onPresetSelect?.("broken-galaxy")}
                        className="bg-slate-900/60 hover:bg-slate-800/80 border border-red-500/30 hover:border-red-500/60 rounded-xl p-3 text-left transition-all hover:scale-[1.02] active:scale-95 flex flex-col justify-between h-20"
                    >
                        <div className="flex justify-between items-start w-full">
                            <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Broken Preset</span>
                            <span className="text-sm">💥</span>
                        </div>
                        <div className="text-xs text-slate-300 font-semibold truncate w-full">Real Galaxy (Cracked)</div>
                    </button>
                    <button
                        onClick={() => onPresetSelect?.("pizza")}
                        className="bg-slate-900/60 hover:bg-slate-800/80 border border-amber-500/30 hover:border-amber-500/60 rounded-xl p-3 text-left transition-all hover:scale-[1.02] active:scale-95 flex flex-col justify-between h-20"
                    >
                        <div className="flex justify-between items-start w-full">
                            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Fake Preset</span>
                            <span className="text-sm">🍕</span>
                        </div>
                        <div className="text-xs text-slate-300 font-semibold truncate w-full">Pizza Photo</div>
                    </button>
                    <button
                        onClick={() => onPresetSelect?.("document")}
                        className="bg-slate-900/60 hover:bg-slate-800/80 border border-amber-500/30 hover:border-amber-500/60 rounded-xl p-3 text-left transition-all hover:scale-[1.02] active:scale-95 flex flex-col justify-between h-20"
                    >
                        <div className="flex justify-between items-start w-full">
                            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Fake Preset</span>
                            <span className="text-sm">📄</span>
                        </div>
                        <div className="text-xs text-slate-300 font-semibold truncate w-full">Screenshot/Doc</div>
                    </button>
                </div>
            </div>
            
            <p className="text-xs text-slate-400 text-center">
                Or just type: <span className="text-slate-300 font-medium">Mint</span>, <span className="text-slate-300 font-medium">Good</span>, <span className="text-slate-300 font-medium">Poor</span>, or <span className="text-slate-300 font-medium">Broken</span>
            </p>
        </div>
    );
}

function ScanResultCard({ 
    initialCondition, 
    reasoning, 
    onConfirm 
}: { 
    initialCondition: string; 
    reasoning: string; 
    onConfirm: (condition: string) => void;
}) {
    const [confirmed, setConfirmed] = useState(false);
    const [selected, setSelected] = useState(initialCondition);

    const conditions = [
        { label: "Mint", desc: "No visible scratches or dents", color: "emerald" },
        { label: "Good", desc: "Minor surface marks only", color: "blue" },
        { label: "Poor", desc: "Moderate wear or damage visible", color: "amber" },
        { label: "Broken", desc: "Cracks, non-functional areas", color: "red" },
    ];
    
    const colorMap: Record<string, string> = {
        emerald: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10",
        blue: "border-blue-500/20 bg-blue-500/5 text-blue-400 hover:bg-blue-500/10",
        amber: "border-amber-500/20 bg-amber-500/5 text-amber-400 hover:bg-amber-500/10",
        red: "border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10",
    };

    const activeColorMap: Record<string, string> = {
        emerald: "border-emerald-500 bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30",
        blue: "border-blue-500 bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/30",
        amber: "border-amber-500 bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30",
        red: "border-red-500 bg-red-500/15 text-red-300 ring-1 ring-red-500/30",
    };

    if (confirmed) {
        return (
            <div className="space-y-1.5">
                <p className="text-emerald-400 font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4.5 h-4.5" /> Condition confirmed as <strong className="underline decoration-wavy decoration-emerald-500/50">{selected}</strong>!
                </p>
                <p className="text-slate-400 text-xs italic font-normal ml-6">"{reasoning}"</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
                <Sparkles className="w-4.5 h-4.5 animate-pulse" />
                Vision AI Analysis Complete
            </div>
            <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800/80 space-y-1">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">AI Detected Condition</p>
                <p className="text-white font-bold text-sm flex items-center gap-2">
                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${initialCondition === 'Mint' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : initialCondition === 'Good' ? 'bg-blue-500 shadow-lg shadow-blue-500/50' : initialCondition === 'Poor' ? 'bg-amber-500 shadow-lg shadow-amber-500/50' : 'bg-red-500 shadow-lg shadow-red-500/50'}`}></span>
                    {initialCondition}
                </p>
                <p className="text-slate-300 text-xs mt-1.5 leading-relaxed italic">
                    "{reasoning}"
                </p>
            </div>
            <p className="text-slate-300 text-xs">
                Please confirm or correct the condition of your device to lock the estimate:
            </p>
            <div className="grid grid-cols-2 gap-2">
                {conditions.map(c => {
                    const isActive = selected === c.label;
                    return (
                        <button
                            key={c.label}
                            onClick={() => { setSelected(c.label); setConfirmed(true); onConfirm(c.label); }}
                            className={`border rounded-xl p-3 text-left transition-all hover:scale-[1.02] active:scale-95 ${isActive ? activeColorMap[c.color] : colorMap[c.color]}`}
                        >
                            <div className="font-semibold text-sm">{c.label}</div>
                            <div className="text-xs opacity-75 mt-0.5">{c.desc}</div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function FinalOfferCard({
    device, storage, condition, askedPrice, estimatedPrice, photoUrl, onAccept, deviceDetails
}: {
    device: string; storage: string; condition: string;
    askedPrice: string; estimatedPrice: number; photoUrl: string | null;
    onAccept: () => Promise<void>;
    deviceDetails: any; // Added deviceDetails prop
}) {
    const { user } = useAuth(); // Added useAuth hook
    const router = useRouter(); // Added useRouter hook
    const [accepting, setAccepting] = useState(false);
    const [rejecting, setRejecting] = useState(false); // Added rejecting state
    const [accepted, setAccepted] = useState(false);
    const needsEngineer = condition === "Poor" || condition === "Broken";
    const gap = Math.abs(estimatedPrice - parseFloat(askedPrice));
    const overpriced = parseFloat(askedPrice) > estimatedPrice * 1.2;

    const handleAcceptEstimate = async () => { // Renamed handleClick to handleAcceptEstimate for clarity
        setAccepting(true);
        try {
            await onAccept();
            setAccepted(true);
        } finally {
            setAccepting(false);
        }
    };

    const handleRejectEstimate = async () => {
        setRejecting(true);
        try {
            // First, login/create user
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/profile/setup-test-user`, { method: 'POST' });

            // Create the device and ticket directly with REJECTED status
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/devices/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    brand: deviceDetails.brand,
                    model: deviceDetails.model,
                    condition: deviceDetails.condition,
                    specs: {
                        storage: deviceDetails.storage,
                        ram: deviceDetails.ram
                    },
                    estimatedPrice,
                    status: 'REJECTED',
                    userEmail: user?.email || 'test@test.com', // Use actual user email if available
                    userName: user?.name || 'test' // Use actual user name if available
                })
            });
            router.push('/profile');
        } catch (err) {
            console.error('Failed to reject device:', err);
            setRejecting(false);
        }
    };

    return (
        <div className="space-y-4 bg-gradient-to-b from-blue-900/20 to-slate-900/40 p-5 rounded-2xl border border-blue-500/20">
            <div className="flex items-center gap-2 text-blue-400 font-semibold uppercase tracking-wider text-xs">
                <Sparkles className="w-4 h-4" />
                Final AI Evaluation Complete
            </div>

            {/* Device summary */}
            <div className="flex gap-3 items-start">
                {photoUrl && (
                    <img src={photoUrl} alt="Device" className="w-16 h-16 rounded-xl object-cover border border-slate-700 shrink-0" />
                )}
                <div>
                    <h3 className="font-bold text-white text-base">{device}</h3>
                    <p className="text-slate-400 text-xs mt-0.5">{storage} · {condition} condition</p>
                </div>
            </div>

            {/* Price breakdown */}
            <div className="bg-slate-950 rounded-xl p-4 space-y-2.5 text-sm">
                <div className="flex justify-between">
                    <span className="text-slate-400">Your asking price</span>
                    <span className="text-slate-200 font-medium">£{askedPrice}</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-2.5">
                    <span className="text-slate-400">AI Market Estimate</span>
                    <span className="text-emerald-400 font-bold text-lg">£{estimatedPrice.toLocaleString()}</span>
                </div>
                {overpriced && (
                    <p className="text-amber-400 text-xs flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        Your asking price is above market rate — accepting may take longer.
                    </p>
                )}
            </div>

            {/* Engineer visit warning */}
            {needsEngineer && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-sm">
                    <p className="font-bold text-amber-400 flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-4 h-4" /> Mandatory Engineer Visit
                    </p>
                    <p className="text-slate-300">
                        Due to <strong>{condition}</strong> condition, an engineer will visit within 24 hours before payment is released. A £150 inspection fee will be deducted from your payout.
                    </p>
                </div>
            )}

            <div className="flex flex-col gap-2 mt-4">
                <button
                    onClick={handleAcceptEstimate}
                    disabled={accepting || rejecting || accepted}
                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-400 text-white rounded-xl px-4 py-4 font-bold text-base transition-all shadow-lg shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-2"
                >
                    {accepting ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Creating ticket…</>
                    ) : accepted ? (
                        <><CheckCircle2 className="w-5 h-5" /> Accepted!</>
                    ) : (
                        <>Accept Offer — £{estimatedPrice.toLocaleString()}</>
                    )}
                </button>
                <button
                    onClick={handleRejectEstimate}
                    disabled={accepting || rejecting || accepted}
                    className="w-full bg-slate-800 hover:bg-slate-700 hover:text-red-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-300 rounded-xl px-4 py-3.5 font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    {rejecting ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Rejecting…</>
                    ) : (
                        <><X className="w-4 h-4" /> Reject Offer</>
                    )}
                </button>
            </div>
            <p className="text-xs text-center text-slate-500 mt-4">By accepting you agree to our terms. Payment processed within 5 business days.</p>
        </div>
    );
}
