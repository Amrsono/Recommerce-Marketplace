"use client";

import { Check, Clock, Truck, CreditCard, ShieldCheck } from 'lucide-react';

type OrderStatus = 'OPEN' | 'PRICING_ESTIMATED' | 'ENGINEER_VISIT_SCHEDULED' | 'RESOLVED';

interface OrderTrackerProps {
    status: OrderStatus;
}

const steps = [
    { id: 'OPEN', label: 'Evaluation', icon: Clock },
    { id: 'PRICING_ESTIMATED', label: 'Offer Ready', icon: ShieldCheck },
    { id: 'ENGINEER_VISIT_SCHEDULED', label: 'Pickup', icon: Truck },
    { id: 'RESOLVED', label: 'Paid', icon: CreditCard },
];

export default function OrderTracker({ status }: OrderTrackerProps) {
    const currentStepIndex = steps.findIndex(s => s.id === status);

    return (
        <div className="w-full py-8">
            <div className="relative flex justify-between">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-800 -translate-y-1/2 z-0" />
                <div 
                    className="absolute top-1/2 left-0 h-0.5 bg-blue-500 -translate-y-1/2 z-0 transition-all duration-700 ease-in-out" 
                    style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                />

                {steps.map((step, index) => {
                    const isCompleted = index < currentStepIndex;
                    const isActive = index === currentStepIndex;
                    const Icon = step.icon;

                    return (
                        <div key={step.id} className="relative z-10 flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                                isCompleted || isActive 
                                    ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' 
                                    : 'bg-slate-900 border-slate-700 text-slate-500'
                            }`}>
                                {isCompleted ? (
                                    <Check className="w-5 h-5" />
                                ) : (
                                    <Icon className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />
                                )}
                            </div>
                            <span className={`mt-3 text-xs font-semibold tracking-wider uppercase ${
                                isActive ? 'text-blue-400' : isCompleted ? 'text-slate-300' : 'text-slate-500'
                            }`}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
