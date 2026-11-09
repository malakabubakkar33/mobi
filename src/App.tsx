import React, { useState, useEffect, useCallback } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { BrowserToolbar } from './components/BrowserToolbar';
import { BrowserView } from './components/BrowserView';
import { ConnectIphoneModal } from './components/ConnectIphoneModal';
import { bridgeClient } from './services/bridgeClient';
import { storageService } from './services/storage';
import { BridgeStatus, MobileSession, RecentItem, ViewportMode } from './types';

export const App: React.FC = () => {
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [historyStack, setHistoryStack] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus | null>(null);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);

  const [mobileSession, setMobileSession] = useState<MobileSession | null>(null);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);

  const [viewportMode, setViewportMode] = useState<ViewportMode>('responsive');
  const [isLandscape, setIsLandscape] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Load initial storage and poll bridge status
  useEffect(() => {
    setRecentItems(storageService.getRecents());

    const updateBridge = async () => {
      const status = await bridgeClient.getStatus();
      setBridgeStatus(status);
    };

    updateBridge();
    const interval = setInterval(updateBridge, 6000);

    return () => clearInterval(interval);
  }, []);

  // Subscribe to real-time WebSocket events from bridge
  useEffect(() => {
    bridgeClient.connectWebSocket(mobileSession?.token, (event) => {
      if (event.type === 'DEVICE_PAIRED') {
        const { device } = event.data;
        setMobileSession((prev) => {
          if (!prev) return prev;
          const devices = prev.pairedDevices || [];
          const exists = devices.some((d) => d.id === device.id);
          const updatedDevices = exists
            ? devices.map((d) => (d.id === device.id ? { ...d, ...device } : d))
            : [...devices, device];
          return { ...prev, pairedDevices: updatedDevices };
        });
      }
    });

    return () => {
      // Keep socket open or managed
    };
  }, [mobileSession?.token]);

  // Navigate to URL
  const handleNavigate = useCallback((url: string) => {
    let clean = url.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      if (
        clean.startsWith('localhost') ||
        clean.startsWith('127.0.0.1') ||
        clean.startsWith('192.168.')
      ) {
        clean = 'http://' + clean;
      } else {
        clean = 'https://' + clean;
      }
    }

    setActiveUrl(clean);
    storageService.setLastUrl(clean);
    const updatedRecents = storageService.addRecent(clean);
    setRecentItems(updatedRecents);

    // Update history stack
    setHistoryStack((prev) => {
      const nextStack = prev.slice(0, historyIndex + 1);
      nextStack.push(clean);
      return nextStack;
    });
    setHistoryIndex((prev) => prev + 1);

    // Auto update or invalidate mobile session target
    if (mobileSession) {
      bridgeClient.createSession(clean).then(setMobileSession).catch(() => {});
    }
  }, [historyIndex, mobileSession]);

  const handleGoBack = () => {
    if (historyIndex > 0) {
      const prevUrl = historyStack[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setActiveUrl(prevUrl);
    }
  };

  const handleGoForward = () => {
    if (historyIndex < historyStack.length - 1) {
      const nextUrl = historyStack[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setActiveUrl(nextUrl);
    }
  };

  const handleReload = () => {
    setReloadTrigger((prev) => prev + 1);
  };

  const handleGoHome = () => {
    setActiveUrl(null);
  };

  const handleOpenMobileModal = async () => {
    if (!activeUrl) return;

    // Create session if not already generated or target changed
    if (!mobileSession || mobileSession.targetUrl !== activeUrl) {
      const session = await bridgeClient.createSession(activeUrl);
      setMobileSession(session);
    }

    setIsMobileModalOpen(true);
  };

  const handleRefreshSession = async () => {
    if (!activeUrl) return;
    const session = await bridgeClient.createSession(activeUrl);
    setMobileSession(session);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleRemoveRecent = (id: string) => {
    const updated = storageService.removeRecent(id);
    setRecentItems(updated);
  };

  const handleClearRecents = () => {
    storageService.clearRecents();
    setRecentItems([]);
  };

  return (
    <div className="w-full h-screen bg-white text-mobi-charcoal overflow-hidden flex flex-col font-sans">
      {!activeUrl ? (
        <HomeScreen
          onNavigate={handleNavigate}
          bridgeStatus={bridgeStatus}
          recentItems={recentItems}
          onRemoveRecent={handleRemoveRecent}
          onClearRecents={handleClearRecents}
        />
      ) : (
        <div className="w-full h-full flex flex-col">
          <BrowserToolbar
            currentUrl={activeUrl}
            onNavigate={handleNavigate}
            onGoBack={handleGoBack}
            onGoForward={handleGoForward}
            onReload={handleReload}
            onGoHome={handleGoHome}
            onOpenMobileModal={handleOpenMobileModal}
            pairedDevicesCount={mobileSession?.pairedDevices?.length || 0}
            isLoading={isLoading}
            viewportMode={viewportMode}
            onSelectViewport={setViewportMode}
            isLandscape={isLandscape}
            onToggleOrientation={() => setIsLandscape(!isLandscape)}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
          />

          <BrowserView
            url={activeUrl}
            viewportMode={viewportMode}
            isLandscape={isLandscape}
            reloadTrigger={reloadTrigger}
            onLoadingStateChange={setIsLoading}
            onNavigate={handleNavigate}
          />
        </div>
      )}

      {/* Connect iPhone Modal */}
      {isMobileModalOpen && (
        <ConnectIphoneModal
          session={mobileSession}
          bridgeStatus={bridgeStatus}
          onClose={() => setIsMobileModalOpen(false)}
          onRefreshSession={handleRefreshSession}
        />
      )}
    </div>
  );
};

