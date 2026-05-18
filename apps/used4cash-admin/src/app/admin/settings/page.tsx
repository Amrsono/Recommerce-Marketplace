"use client";

import React, { useState, useEffect } from 'react';
import { Save, Key, Shield, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Fetch existing token
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-slate-400">Manage your global API keys and configurations securely.</p>
      </div>

      <div className="grid gap-6 max-w-3xl">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Key className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">AI Integration</h2>
              <p className="text-sm text-slate-400">Configure the API token for the pricing model (Claude/OpenAI).</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">API Token</label>
              <div className="relative">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="sk-..."
                />
                <Shield className="w-5 h-5 text-slate-500 absolute left-3 top-3.5" />
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-2">
                <AlertCircle className="w-3 h-3" />
                This token is stored securely in the database and is never exposed to the client interface.
              </p>
            </div>

            <button
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isLoading ? 'Saving...' : 'Save Settings'}
            </button>
            
            {message && (
              <p className={`text-sm mt-4 ${message.includes('success') ? 'text-green-400' : 'text-red-400'}`}>
                {message}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
