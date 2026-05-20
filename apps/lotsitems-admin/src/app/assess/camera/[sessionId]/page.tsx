"use client";

import { useState, useRef, useEffect, use } from "react";
import { Camera, CheckCircle2, Loader2, UploadCloud, Smartphone } from "lucide-react";

function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
}

export default function MobileCameraPage({ params }: { params: Promise<{ sessionId: string }> }) {
    const { sessionId } = use(params);
    const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setStatus("uploading");
        try {
            const base64 = await fileToBase64(file);
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/devices/handoff/${sessionId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ photoUrl: base64 }),
            });

            if (!res.ok) throw new Error("Failed to sync photo");
            setStatus("success");
        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message || "Something went wrong.");
            setStatus("error");
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-32 bg-blue-600/10 blur-[50px] pointer-events-none" />

                {status === "idle" && (
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 border border-blue-500/20">
                            <Smartphone className="w-10 h-10 text-blue-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Secure Mobile Upload</h1>
                        <p className="text-slate-400 mb-8">Take a clear photo of your device. It will instantly sync to your laptop screen.</p>
                        
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={handleCapture}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-4 font-bold text-lg transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                        >
                            <Camera className="w-5 h-5" />
                            Take Photo
                        </button>
                    </div>
                )}

                {status === "uploading" && (
                    <div className="relative z-10 flex flex-col items-center py-10">
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                        <h2 className="text-xl font-bold text-white mb-2">Syncing to Desktop...</h2>
                        <p className="text-slate-400">Please do not close this window.</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="relative z-10 flex flex-col items-center py-10">
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border-2 border-emerald-500/20 shadow-[0_0_50px_-15px_rgba(16,185,129,0.5)]">
                            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Upload Complete!</h2>
                        <p className="text-slate-400">You can safely close this tab and look back at your laptop.</p>
                    </div>
                )}

                {status === "error" && (
                    <div className="relative z-10 flex flex-col items-center py-10">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
                            <UploadCloud className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Upload Failed</h2>
                        <p className="text-slate-400 mb-6">{errorMsg}</p>
                        <button
                            onClick={() => setStatus("idle")}
                            className="w-full bg-slate-800 hover:bg-slate-700 text-white rounded-xl py-3 font-semibold transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
