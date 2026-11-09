import React, { useState } from 'react';
import {
  BridgeStatus,
  RecentItem,
  DevServerInfo
} from '../types';
import { DevServersBanner } from './DevServersBanner';
import {
  Globe,
  ArrowRight,
  Wifi,
  Server,
  Clock,
  Sparkles,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Trash2
} from 'lucide-react';

interface HomeScreenProps {
  onNavigate: (url: string) => void;
  bridgeStatus: BridgeStatus | null;
  recentItems: RecentItem[];
  onRemoveRecent: (id: string) => void;
  onClearRecents: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigate,
  bridgeStatus,
  recentItems,
  onRemoveRecent,
  onClearRecents,
}) => {
  const [inputUrl, setInputUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    let clean = inputUrl.trim();
    if (!clean) {
      setErrorMsg('Please enter a website or localhost URL');
      return;
    }

    // Auto prepend protocol if omitted
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      if (
        clean.startsWith('localhost') ||
        clean.startsWith('127.0.0.1') ||
        clean.startsWith('192.168.') ||
        clean.startsWith('10.') ||
        clean.startsWith('172.')
      ) {
        clean = 'http://' + clean;
      } else {
        clean = 'https://' + clean;
      }
    }

    // Basic URL validation
    try {
      new URL(clean);
      onNavigate(clean);
    } catch {
      setErrorMsg('Please enter a valid URL (e.g. http://localhost:5173 or https://example.com)');
    }
  };

  const handleSelectPreset = (url: string) => {
    setInputUrl(url);
    onNavigate(url);
  };

  const isBridgeConnected = bridgeStatus?.connected ?? false;

  return (
    <div className="min-h-screen bg-white text-mobi-charcoal flex flex-col justify-between selection:bg-mobi-green-light selection:text-mobi-green">
      {/* Top Subtle Status Bar */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-mobi-border/60">
        <div className="flex items-center gap-2.5">
          {/* MobiView Icon Badge */}
          <div className="w-7 h-7 rounded-lg bg-mobi-green flex items-center justify-center text-white shadow-xs">
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="18" height="18" x="3" y="3" rx="4" />
              <path d="M7 8h10" />
              <path d="M12 12v4" />
              <path d="M10 16h4" />
            </svg>
          </div>
          <span className="font-bold text-sm tracking-tight text-mobi-charcoal">
            MobiView
          </span>
        </div>

        {/* Real Local Bridge Indicator */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-xs border transition-all ${
              isBridgeConnected
                ? 'bg-mobi-green-subtle border-mobi-green-border text-mobi-green'
                : 'bg-mobi-gray-50 border-mobi-border text-mobi-charcoal-light'
            }`}
          >
            <span className="relative flex h-2 w-2">
              {isBridgeConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mobi-green opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isBridgeConnected ? 'bg-mobi-green' : 'bg-mobi-charcoal-light'
                }`}
              ></span>
            </span>
            <span className="font-medium text-[11px]">
              {isBridgeConnected
                ? `Local Bridge Active • ${bridgeStatus?.hostIp}:${bridgeStatus?.bridgePort}`
                : 'Local Bridge Connecting...'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Centered Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-2xl mx-auto w-full text-center">
        {/* Brand Logo & Hero */}
        <div className="mb-8 flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-mobi-green-light border border-mobi-green-border flex items-center justify-center text-mobi-green shadow-soft mb-5">
            <Smartphone className="w-7 h-7" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-mobi-charcoal mb-2.5">
            Test Your Website Anywhere.
          </h1>
          <p className="text-sm sm:text-base text-mobi-charcoal-light max-w-md">
            Enter a URL to instantly preview your website.
          </p>
        </div>

        {/* Active Local Dev Servers Banner (if any detected) */}
        {bridgeStatus && bridgeStatus.activeDevServers && (
          <DevServersBanner
            servers={bridgeStatus.activeDevServers}
            onSelectServer={handleSelectPreset}
          />
        )}

        {/* Large Browser-Style URL Input */}
        <form onSubmit={handleSubmit} className="w-full mb-4">
          <div className="relative flex items-center bg-white border border-mobi-border focus-within:border-mobi-green rounded-2xl p-2 shadow-url-bar focus-within:shadow-url-focus transition-all">
            <div className="pl-3 pr-2 text-mobi-charcoal-light">
              <Globe className="w-5 h-5 text-mobi-green" />
            </div>

            <input
              type="text"
              value={inputUrl}
              onChange={(e) => {
                setInputUrl(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="Enter website URL or localhost..."
              className="flex-1 bg-transparent text-sm sm:text-base font-mono text-mobi-charcoal placeholder:text-mobi-charcoal-light/70 outline-none px-2"
              autoFocus
            />

            <button
              type="submit"
              className="px-5 py-2.5 bg-mobi-green hover:bg-mobi-green-dark text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 shadow-subtle hover:shadow-soft active:scale-98"
            >
              <span>Go</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-600 mt-2 text-left px-2 flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" />
              <span>{errorMsg}</span>
            </p>
          )}
        </form>

        {/* Quick Format Hints */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-mobi-charcoal-light font-mono mb-8">
          <span className="text-mobi-charcoal-light/80 font-sans">Supports:</span>
          <button
            onClick={() => handleSelectPreset('http://localhost:5173')}
            className="hover:text-mobi-green underline underline-offset-2 transition-colors"
          >
            http://localhost:5173
          </button>
          <span>•</span>
          <button
            onClick={() => handleSelectPreset('http://localhost:3000')}
            className="hover:text-mobi-green underline underline-offset-2 transition-colors"
          >
            http://localhost:3000
          </button>
          <span>•</span>
          <button
            onClick={() => handleSelectPreset('https://example.com')}
            className="hover:text-mobi-green underline underline-offset-2 transition-colors"
          >
            https://example.com
          </button>
        </div>

        {/* Recent & Preset Sessions List */}
        {recentItems.length > 0 && (
          <div className="w-full text-left">
            <div className="flex items-center justify-between mb-2.5 px-1">
              <span className="text-xs font-semibold text-mobi-charcoal flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-mobi-charcoal-light" />
                Recent & Quick Presets
              </span>
              <button
                onClick={onClearRecents}
                className="text-[11px] text-mobi-charcoal-light hover:text-rose-600 transition-colors"
              >
                Clear
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {recentItems.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectPreset(item.url)}
                  className="flex items-center justify-between p-3 bg-white hover:bg-mobi-green-subtle/50 border border-mobi-border hover:border-mobi-green-border rounded-xl cursor-pointer transition-all shadow-subtle group text-left"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-7 h-7 rounded-lg bg-mobi-gray-50 group-hover:bg-mobi-green-light flex items-center justify-center text-mobi-charcoal-light group-hover:text-mobi-green transition-colors flex-shrink-0">
                      {item.isLocalhost ? (
                        <Server className="w-3.5 h-3.5" />
                      ) : (
                        <Globe className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-medium text-mobi-charcoal group-hover:text-mobi-green transition-colors truncate">
                        {item.title}
                      </div>
                      <div className="text-[11px] font-mono text-mobi-charcoal-light truncate">
                        {item.url}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveRecent(item.id);
                    }}
                    title="Remove"
                    className="opacity-0 group-hover:opacity-100 p-1 text-mobi-charcoal-light hover:text-rose-600 rounded transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="w-full py-4 px-6 text-center text-xs text-mobi-charcoal-light border-t border-mobi-border/60 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span className="font-medium text-[11px]">
          MobiView — "Your Website. Your Mobile. Your Preview."
        </span>
        <div className="flex items-center gap-3 text-[11px]">
          <span>Node.js Local Bridge</span>
          <span>•</span>
          <span>Native Safari Pairings</span>
          <span>•</span>
          <span>HMR WebSocket Support</span>
        </div>
      </footer>
    </div>
  );
};

