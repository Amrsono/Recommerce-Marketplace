"use client";

import React, { useState, useEffect } from 'react';
import { Save, Key, Shield, AlertCircle, Palette, CheckCircle2, Moon, Sun, Sunset } from 'lucide-react';
import { useAdminTheme, AdminTheme, THEMES } from '@/contexts/ThemeContext';

const THEME_OPTIONS: { id: AdminTheme; label: string; desc: string; icon: React.ElementType; preview: { bg: string; sidebar: string; text: string; accent: string } }[] = [
  {
    id: 'dark',
    label: 'Midnight Dark',
    desc: 'Classic dark interface. Easy on the eyes during long sessions.',
    icon: Moon,
    preview: { bg: '#0a0a0f', sidebar: '#0f1117', text: '#f8fafc', accent: '#3b82f6' },
  },
  {
    id: 'medium',
    label: 'Cozy Dusk',
    desc: 'Warm purple-tinted tones. Premium and comfortable.',
    icon: Sunset,
    preview: { bg: '#2C2A35', sidebar: '#24222C', text: '#F0EAF8', accent: '#7c3aed' },
  },
  {
    id: 'light',
    label: 'Clean Light',
    desc: 'Crisp white interface. Professional and minimal.',
    icon: Sun,
    preview: { bg: '#f1f5f9', sidebar: '#ffffff', text: '#0f172a', accent: '#3b82f6' },
  },
];

export default function SettingsPage() {
  const { theme: activeTheme, config, setTheme } = useAdminTheme();

  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings`);
        const data = await res.json();
        if (data.success && data.settings?.AI_API_TOKEN) {
          setApiKey(data.settings.AI_API_TOKEN);
        }
      } catch (err) {
        console.error('Failed to fetch settings', err);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'AI_API_TOKEN', value: apiKey }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Settings saved successfully!');
      } else {
        setMessage('Failed to save settings.');
      }
    } catch (err) {
      console.error(err);
      setMessage('An error occurred while saving.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className={`text-3xl font-bold tracking-tight ${config.text}`}>System Settings</h1>
        <p className={config.textMuted}>Manage your global configurations, themes, and API integrations.</p>
      </div>

      {/* Theme Picker */}
      <div className={`border ${config.border} rounded-xl p-6 ${config.card}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-violet-500/10 rounded-lg">
            <Palette className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h2 className={`text-xl font-semibold ${config.text}`}>Dashboard Theme</h2>
            <p className={`text-sm ${config.textMuted}`}>Choose the colour scheme for your admin experience. Changes apply instantly.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {THEME_OPTIONS.map((opt) => {
            const isSelected = activeTheme === opt.id;
            const IconComponent = opt.icon;
            return (
              <button
                key={opt.id}
                onClick={() => setTheme(opt.id)}
                className={`relative group rounded-2xl overflow-hidden border-2 transition-all duration-200 text-left ${isSelected
                    ? 'border-blue-500 shadow-lg shadow-blue-500/20 scale-[1.02]'
                    : `border-transparent hover:border-slate-600 hover:scale-[1.01]`
                  }`}
              >
                {/* Mini Dashboard Preview */}
                <div className="h-28 relative" style={{ backgroundColor: opt.preview.bg }}>
                  {/* Mini sidebar */}
                  <div className="absolute left-0 top-0 bottom-0 w-10 flex flex-col gap-1.5 p-1.5" style={{ backgroundColor: opt.preview.sidebar }}>
                    <div className="w-full h-1.5 rounded-sm" style={{ backgroundColor: opt.preview.accent }} />
                    <div className="w-full h-1.5 rounded-sm opacity-40" style={{ backgroundColor: opt.preview.text }} />
                    <div className="w-full h-1.5 rounded-sm opacity-40" style={{ backgroundColor: opt.preview.text }} />
                    <div className="w-full h-1.5 rounded-sm opacity-40" style={{ backgroundColor: opt.preview.text }} />
                  </div>
                  {/* Mini content */}
                  <div className="absolute left-12 right-2 top-2 space-y-1.5">
                    <div className="h-3 w-16 rounded-sm opacity-80" style={{ backgroundColor: opt.preview.text }} />
                    <div className="h-8 w-full rounded-lg opacity-20" style={{ backgroundColor: opt.preview.text }} />
                    <div className="flex gap-1">
                      <div className="h-6 flex-1 rounded opacity-15" style={{ backgroundColor: opt.preview.text }} />
                      <div className="h-6 flex-1 rounded opacity-15" style={{ backgroundColor: opt.preview.text }} />
                    </div>
                  </div>
                  {/* Selected badge */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shadow-lg">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Label */}
                <div className={`p-3 ${isSelected ? 'bg-blue-500/10' : config.card} border-t ${isSelected ? 'border-blue-500/30' : config.border} transition-colors`}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <IconComponent className={`w-4 h-4 ${isSelected ? 'text-blue-400' : config.textMuted}`} />
                    <span className={`font-semibold text-sm ${isSelected ? 'text-blue-400' : config.text}`}>{opt.label}</span>
                  </div>
                  <p className={`text-xs ${config.textMuted} leading-relaxed`}>{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        <p className={`mt-4 text-xs ${config.textMuted} flex items-center gap-1.5`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Theme preference is saved to your browser automatically.
        </p>
      </div>

      {/* API Token */}
      <div className={`border ${config.border} rounded-xl p-6 ${config.card}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-500/10 rounded-lg">
            <Key className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className={`text-xl font-semibold ${config.text}`}>AI Integration</h2>
            <p className={`text-sm ${config.textMuted}`}>Configure the API token for the pricing model (Claude/OpenAI).</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className={`text-sm font-medium ${config.textMuted}`}>API Token</label>
            <div className="relative">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className={`w-full border rounded-lg px-4 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${activeTheme === 'light'
                    ? 'bg-slate-100 border-slate-300 text-slate-900 placeholder:text-slate-400'
                    : 'bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500'
                  }`}
                placeholder="sk-..."
              />
              <Shield className={`w-5 h-5 absolute left-3 top-3.5 ${config.textMuted}`} />
            </div>
            <p className={`text-xs flex items-center gap-1 mt-2 ${config.textMuted}`}>
              <AlertCircle className="w-3 h-3" />
              This token is stored securely in the database and never exposed to the client.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isLoading ? 'Saving...' : 'Save Settings'}
          </button>

          {message && (
            <p className={`text-sm mt-4 flex items-center gap-2 ${message.includes('success') ? 'text-emerald-400' : 'text-red-400'}`}>
              <CheckCircle2 className="w-4 h-4" />
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
