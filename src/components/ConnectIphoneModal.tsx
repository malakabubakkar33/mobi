import React, { useState } from 'react';
import { MobileSession, BridgeStatus } from '../types';
import {
  X,
  Smartphone,
  Copy,
  Check,
  Wifi,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Clock,
  Sparkles
} from 'lucide-react';

interface ConnectIphoneModalProps {
  session: MobileSession | null;
  bridgeStatus: BridgeStatus | null;
  onClose: () => void;
  onRefreshSession: () => void;
}

export const ConnectIphoneModal: React.FC<ConnectIphoneModalProps> = ({
  session,
  bridgeStatus,
  onClose,
  onRefreshSession,
}) => {
  const [copied, setCopied] = useState(false);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  if (!session) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(session.previewUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasConnectedDevices = session.pairedDevices && session.pairedDevices.length > 0;
  const isLanOnline = bridgeStatus?.connected && bridgeStatus.hostIp !== '127.0.0.1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white border border-mobi-border rounded-2xl shadow-elevated overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-mobi-border bg-mobi-gray-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-mobi-green-light border border-mobi-green-border flex items-center justify-center text-mobi-green">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-mobi-charcoal">Connect iPhone</h3>
              <p className="text-[11px] text-mobi-charcoal-light">Real Safari testing over local Wi-Fi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-mobi-charcoal-light hover:text-mobi-charcoal hover:bg-mobi-gray-100 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col items-center text-center">
          {/* Target URL Pill */}
          <div className="w-full mb-4 px-3 py-1.5 bg-mobi-gray-50 border border-mobi-border rounded-lg flex items-center justify-between text-xs">
            <span className="text-mobi-charcoal-light font-medium truncate max-w-[280px]">
              Target: <span className="font-mono text-mobi-charcoal">{session.targetUrl}</span>
            </span>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-mobi-green">
              <ShieldCheck className="w-3.5 h-3.5" />
              Paired Bridge
            </span>
          </div>

          {/* QR Code Container */}
          <div className="relative p-3 bg-white border border-mobi-border rounded-xl shadow-subtle mb-4 group">
            {session.qrCodeDataUrl ? (
              <img
                src={session.qrCodeDataUrl}
                alt="Scan to preview on iPhone"
                className="w-52 h-52 rounded-lg"
              />
            ) : (
              <div className="w-52 h-52 flex flex-col items-center justify-center bg-mobi-gray-50 rounded-lg text-mobi-charcoal-light">
                <RefreshCw className="w-6 h-6 animate-spin mb-2 text-mobi-green" />
                <span className="text-xs">Generating Pairing QR...</span>
              </div>
            )}
            
            {/* Center phone icon badge */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-9 h-9 rounded-full bg-white shadow-md border border-mobi-green-border flex items-center justify-center text-mobi-green">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Instructions */}
          <p className="text-xs text-mobi-charcoal font-medium mb-1">
            Scan this code with the Camera app on your iPhone
          </p>
          <p className="text-[11px] text-mobi-charcoal-light mb-4 flex items-center gap-1.5 justify-center">
            <Wifi className="w-3 h-3 text-mobi-green" />
            Make sure your iPhone and PC are connected to the same Wi-Fi
          </p>

          {/* Copyable Preview Link */}
          <div className="w-full flex items-center gap-2 p-1.5 pl-3 bg-mobi-gray-50 border border-mobi-border rounded-lg mb-4 text-xs">
            <span className="font-mono text-mobi-charcoal-muted truncate text-[11px] flex-1 text-left">
              {session.previewUrl}
            </span>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                copied
                  ? 'bg-mobi-green text-white'
                  : 'bg-white border border-mobi-border text-mobi-charcoal hover:border-mobi-green hover:text-mobi-green'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Connected Devices Status */}
          <div className="w-full p-3 bg-white border border-mobi-border rounded-xl text-left mb-3">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-mobi-charcoal flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${hasConnectedDevices ? 'bg-mobi-green animate-pulse' : 'bg-mobi-gray-300'}`} />
                Connected Devices
              </span>
              <span className="text-[11px] text-mobi-charcoal-light">
                {hasConnectedDevices ? `${session.pairedDevices.length} active` : 'Waiting for scan...'}
              </span>
            </div>

            {hasConnectedDevices ? (
              <div className="space-y-1.5 mt-2">
                {session.pairedDevices.map((dev) => (
                  <div key={dev.id} className="flex items-center justify-between p-2 bg-mobi-green-subtle border border-mobi-green-border rounded-lg text-xs">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-3.5 h-3.5 text-mobi-green" />
                      <div>
                        <div className="font-medium text-mobi-charcoal">{dev.deviceName}</div>
                        <div className="text-[10px] text-mobi-charcoal-light font-mono">{dev.ip}</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-white border border-mobi-green-border text-mobi-green text-[10px] font-semibold rounded-full">
                      Live Safari
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-mobi-charcoal-light">
                When you scan on your iPhone, the connection will appear here automatically.
              </p>
            )}
          </div>

          {/* Troubleshooting Accordion */}
          <div className="w-full text-left">
            <button
              onClick={() => setShowTroubleshooting(!showTroubleshooting)}
              className="text-[11px] text-mobi-charcoal-light hover:text-mobi-green flex items-center gap-1 transition-colors"
            >
              <AlertCircle className="w-3 h-3" />
              <span>iPhone can't reach this page? Troubleshooting tips</span>
            </button>

            {showTroubleshooting && (
              <div className="mt-2 p-3 bg-mobi-gray-50 border border-mobi-border rounded-lg text-[11px] text-mobi-charcoal-muted space-y-1.5 animate-in fade-in duration-150">
                <p>
                  <strong>1. Wi-Fi Network:</strong> iPhone must be on the same local Wi-Fi router as this PC ({bridgeStatus?.hostIp || '192.168.x.x'}).
                </p>
                <p>
                  <strong>2. Windows Firewall:</strong> Windows may prompt to allow Node.js on Private Networks. Ensure inbound TCP port 4800 is allowed.
                </p>
                <p>
                  <strong>3. Cellular Data:</strong> Disable cellular data temporarily if Safari tries to route through 5G/LTE instead of local Wi-Fi.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-mobi-border bg-mobi-gray-50/50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-mobi-charcoal-light text-[11px]">
            <Clock className="w-3.5 h-3.5" />
            <span>Expires in 4 hours</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onRefreshSession}
              className="px-3 py-1.5 text-xs text-mobi-charcoal font-medium hover:text-mobi-green transition-colors"
            >
              Regenerate Token
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-mobi-green text-white text-xs font-semibold rounded-lg hover:bg-mobi-green-dark transition-colors shadow-subtle"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

