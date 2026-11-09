import React, { useState, useEffect, useRef } from 'react';
import { ViewportMode } from '../types';
import { VIEWPORTS } from './ViewportSwitcher';
import {
  AlertTriangle,
  RotateCw,
  ExternalLink,
  ShieldAlert,
  Server,
  WifiOff
} from 'lucide-react';

interface BrowserViewProps {
  url: string;
  viewportMode: ViewportMode;
  isLandscape: boolean;
  reloadTrigger: number;
  onLoadingStateChange: (isLoading: boolean) => void;
  onNavigate: (newUrl: string) => void;
}

export const BrowserView: React.FC<BrowserViewProps> = ({
  url,
  viewportMode,
  isLandscape,
  reloadTrigger,
  onLoadingStateChange,
  onNavigate,
}) => {
  const [loadError, setLoadError] = useState<string | null>(null);
  const [useProxy, setUseProxy] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const activeViewport = VIEWPORTS[viewportMode];
  const isDevice = viewportMode !== 'responsive';

  // Calculate container dimensions
  let width = activeViewport.width;
  let height = activeViewport.height;

  if (isLandscape && typeof width === 'number' && typeof height === 'number') {
    const temp = width;
    width = height;
    height = temp;
  }

  // Determine actual src URL (direct or via smart proxy if requested/needed)
  const isLocalhost =
    url.includes('localhost') ||
    url.includes('127.0.0.1') ||
    url.includes('192.168.');

  // For localhost, developers want direct rendering. For arbitrary deployed sites with strict CSP/X-Frame-Options, smart proxy renders it.
  const effectiveSrc = useProxy
    ? `/api/proxy?url=${encodeURIComponent(url)}`
    : url;

  useEffect(() => {
    setLoadError(null);
    onLoadingStateChange(true);

    const timer = setTimeout(() => {
      onLoadingStateChange(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, [url, reloadTrigger, useProxy]);

  const handleIframeLoad = () => {
    onLoadingStateChange(false);
    setLoadError(null);
  };

  const handleIframeError = () => {
    onLoadingStateChange(false);
    if (!useProxy && !isLocalhost) {
      // Try switching to smart proxy to bypass X-Frame-Options
      setUseProxy(true);
    } else {
      setLoadError('Failed to load target website.');
    }
  };

  return (
    <main className="flex-1 w-full h-[calc(100vh-48px)] bg-mobi-gray-100 flex items-center justify-center overflow-auto p-0 transition-all select-none">
      {isDevice ? (
        // Mobile / Tablet Device Frame Mockup
        <div className="py-6 px-4 flex flex-col items-center">
          <div className="text-[11px] font-mono text-mobi-charcoal-light mb-2 flex items-center gap-2">
            <span>{activeViewport.name}</span>
            <span>•</span>
            <span>
              {width} × {height} pt
            </span>
            {useProxy && (
              <span className="px-1.5 py-0.2 bg-mobi-green-light text-mobi-green text-[10px] rounded font-sans font-semibold">
                Proxy Assisted
              </span>
            )}
          </div>

          <div
            style={{
              width: typeof width === 'number' ? `${width}px` : '100%',
              height: typeof height === 'number' ? `${height}px` : '100%',
            }}
            className="relative bg-white rounded-[38px] shadow-elevated border-8 border-mobi-charcoal overflow-hidden flex flex-col transition-all duration-300"
          >
            {/* iPhone Dynamic Island / Speaker notch */}
            {activeViewport.isMobileDevice && !isLandscape && (
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-4 bg-mobi-charcoal rounded-full z-20 flex items-center justify-end px-2">
                <div className="w-2 h-2 rounded-full bg-mobi-charcoal-muted/80"></div>
              </div>
            )}

            {/* Browser Render Surface */}
            <iframe
              key={`${effectiveSrc}-${reloadTrigger}`}
              ref={iframeRef}
              src={effectiveSrc}
              title="MobiView Device Surface"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              className="w-full h-full border-none bg-white"
            />
          </div>
        </div>
      ) : (
        // Full Window Fluid Canvas
        <div className="w-full h-full relative bg-white">
          <iframe
            key={`${effectiveSrc}-${reloadTrigger}`}
            ref={iframeRef}
            src={effectiveSrc}
            title="MobiView Full Browser Surface"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            className="w-full h-full border-none bg-white"
          />
        </div>
      )}

      {/* Connection / Loading Error Overlay */}
      {loadError && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-30 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-mobi-border rounded-2xl p-6 text-center shadow-elevated">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-semibold text-mobi-charcoal mb-1">
              Could not open website
            </h3>
            <p className="text-xs text-mobi-charcoal-light font-mono mb-4 break-all bg-mobi-gray-50 p-2 rounded-lg border border-mobi-border">
              {url}
            </p>

            <div className="text-left text-xs text-mobi-charcoal-muted bg-mobi-green-subtle border border-mobi-green-border rounded-xl p-3 mb-5 space-y-1.5">
              <div className="font-semibold text-mobi-green flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5" />
                <span>If testing localhost:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-mobi-charcoal">
                <li>Verify your dev server is running (<code className="font-mono text-mobi-green">npm run dev</code>).</li>
                <li>Verify the port is correct (e.g. 5173, 3000, 8080).</li>
                <li>Make sure the server hasn't crashed.</li>
              </ul>
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setUseProxy(!useProxy)}
                className="px-3 py-1.5 border border-mobi-border hover:border-mobi-green text-mobi-charcoal rounded-lg text-xs font-medium transition-all"
              >
                {useProxy ? 'Try Direct Load' : 'Try Proxy Mode'}
              </button>

              <button
                onClick={() => window.open(url, '_blank')}
                className="px-3 py-1.5 bg-mobi-green text-white rounded-lg text-xs font-medium hover:bg-mobi-green-dark transition-all flex items-center gap-1.5"
              >
                <span>Open in Tab</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

