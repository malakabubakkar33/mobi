import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Home,
  Smartphone,
  Maximize,
  Minimize,
  Lock,
  Globe,
  Server,
  Copy,
  Check,
  X,
  ArrowRightCircle,
  ExternalLink
} from 'lucide-react';
import { ViewportMode } from '../types';
import { ViewportSwitcher } from './ViewportSwitcher';

interface BrowserToolbarProps {
  currentUrl: string;
  onNavigate: (newUrl: string) => void;
  onGoBack: () => void;
  onGoForward: () => void;
  onReload: () => void;
  onGoHome: () => void;
  onOpenMobileModal: () => void;
  pairedDevicesCount: number;
  isLoading: boolean;
  viewportMode: ViewportMode;
  onSelectViewport: (mode: ViewportMode) => void;
  isLandscape: boolean;
  onToggleOrientation: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const BrowserToolbar: React.FC<BrowserToolbarProps> = ({
  currentUrl,
  onNavigate,
  onGoBack,
  onGoForward,
  onReload,
  onGoHome,
  onOpenMobileModal,
  pairedDevicesCount,
  isLoading,
  viewportMode,
  onSelectViewport,
  isLandscape,
  onToggleOrientation,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const [inputUrl, setInputUrl] = useState(currentUrl);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setInputUrl(currentUrl);
  }, [currentUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      onNavigate(inputUrl.trim());
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isLocalhost =
    currentUrl.includes('localhost') ||
    currentUrl.includes('127.0.0.1') ||
    currentUrl.includes('192.168.');
  const isHttps = currentUrl.startsWith('https://');

  return (
    <header className="w-full bg-white border-b border-mobi-border select-none z-30 flex-shrink-0 transition-all">
      {/* Top Loading Progress Line */}
      {isLoading && (
        <div className="h-0.5 w-full bg-mobi-green-light overflow-hidden">
          <div className="h-full bg-mobi-green animate-pulse w-2/3 transition-all duration-300"></div>
        </div>
      )}

      <div className="h-12 px-3 flex items-center justify-between gap-2">
        {/* Navigation Controls Group */}
        <div className="flex items-center gap-1">
          <button
            onClick={onGoHome}
            title="Home"
            className="p-1.5 rounded-lg text-mobi-charcoal-light hover:text-mobi-charcoal hover:bg-mobi-gray-100 transition-colors"
          >
            <Home className="w-4 h-4" />
          </button>

          <button
            onClick={onGoBack}
            title="Back"
            className="p-1.5 rounded-lg text-mobi-charcoal-light hover:text-mobi-charcoal hover:bg-mobi-gray-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <button
            onClick={onGoForward}
            title="Forward"
            className="p-1.5 rounded-lg text-mobi-charcoal-light hover:text-mobi-charcoal hover:bg-mobi-gray-100 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onReload}
            title="Reload website"
            className="p-1.5 rounded-lg text-mobi-charcoal-light hover:text-mobi-charcoal hover:bg-mobi-gray-100 transition-colors"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-mobi-green' : ''}`} />
          </button>
        </div>

        {/* Address Bar Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 max-w-3xl flex items-center bg-mobi-gray-50 hover:bg-white focus-within:bg-white border border-mobi-border focus-within:border-mobi-green focus-within:ring-2 focus-within:ring-mobi-green-light rounded-xl h-8 px-2.5 transition-all shadow-xs"
        >
          {/* Security / Localhost Icon */}
          <div className="flex items-center gap-1.5 pr-2 text-mobi-charcoal-light">
            {isLocalhost ? (
              <span className="flex items-center gap-1 text-[11px] font-medium text-mobi-green px-1.5 py-0.5 rounded bg-mobi-green-light border border-mobi-green-border">
                <Server className="w-3 h-3" />
                <span className="hidden sm:inline font-mono">local</span>
              </span>
            ) : isHttps ? (
              <span className="flex items-center gap-1 text-[11px] font-medium text-mobi-charcoal-muted">
                <Lock className="w-3 h-3 text-mobi-green" />
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-medium text-mobi-charcoal-light">
                <Globe className="w-3 h-3" />
              </span>
            )}
          </div>

          {/* URL Input */}
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="Enter website URL or localhost:port..."
            className="flex-1 bg-transparent text-xs font-mono text-mobi-charcoal outline-none placeholder:text-mobi-charcoal-light"
          />

          {/* Quick Actions inside address bar */}
          <div className="flex items-center gap-1 pl-1">
            {inputUrl && (
              <button
                type="button"
                onClick={() => setInputUrl('')}
                title="Clear"
                className="p-1 text-mobi-charcoal-light hover:text-mobi-charcoal rounded hover:bg-mobi-gray-200 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}

            <button
              type="button"
              onClick={handleCopy}
              title="Copy URL"
              className="p-1 text-mobi-charcoal-light hover:text-mobi-green rounded hover:bg-mobi-gray-100 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-mobi-green" /> : <Copy className="w-3 h-3" />}
            </button>

            <button
              type="button"
              onClick={() => window.open(currentUrl, '_blank')}
              title="Open in new native tab"
              className="p-1 text-mobi-charcoal-light hover:text-mobi-charcoal rounded hover:bg-mobi-gray-100 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
            </button>

            <button
              type="submit"
              title="Go"
              className="ml-1 px-2.5 py-1 bg-mobi-green hover:bg-mobi-green-dark text-white rounded-md text-[11px] font-semibold transition-all flex items-center gap-1 shadow-xs"
            >
              <span>Go</span>
            </button>
          </div>
        </form>

        {/* Viewport & Testing Controls */}
        <div className="flex items-center gap-2">
          {/* Viewport Switcher */}
          <div className="hidden sm:block">
            <ViewportSwitcher
              currentMode={viewportMode}
              onSelectMode={onSelectViewport}
              isLandscape={isLandscape}
              onToggleOrientation={onToggleOrientation}
            />
          </div>

          {/* Connect iPhone Button */}
          <button
            onClick={onOpenMobileModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border shadow-xs ${
              pairedDevicesCount > 0
                ? 'bg-mobi-green text-white border-mobi-green hover:bg-mobi-green-dark'
                : 'bg-mobi-green-light text-mobi-green border-mobi-green-border hover:bg-mobi-green hover:text-white'
            }`}
            title="Connect iPhone for live Safari testing"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Connect iPhone</span>
            {pairedDevicesCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-white animate-ping ml-0.5"></span>
            )}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Exit full screen' : 'Full screen'}
            className="p-1.5 rounded-lg text-mobi-charcoal-light hover:text-mobi-charcoal hover:bg-mobi-gray-100 transition-colors"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};

