export interface BridgeStatus {
  connected: boolean;
  version: string;
  hostIp: string;
  bridgePort: number;
  lanUrl: string;
  activeDevServers: DevServerInfo[];
  connectedClientsCount: number;
  lastPing: number;
}

export interface DevServerInfo {
  port: number;
  framework: string; // e.g. 'Vite', 'Next.js', 'React', 'Vue', 'Generic HTTP'
  url: string;
  isAlive: boolean;
  detectedAt?: number;
}

export interface MobileSession {
  id: string;
  token: string;
  targetUrl: string;
  previewUrl: string;
  qrCodeDataUrl: string;
  createdAt: number;
  expiresAt: number;
  pairedDevices: PairedDevice[];
}

export interface PairedDevice {
  id: string;
  deviceName: string;
  ip: string;
  connectedAt: number;
  lastActive: number;
  userAgent: string;
  isIPhone: boolean;
  batteryLevel?: number;
}

export interface RecentItem {
  id: string;
  url: string;
  title: string;
  timestamp: number;
  isLocalhost: boolean;
  port?: number;
}

export type ViewportMode = 'responsive' | 'iphone-15-pro' | 'iphone-se' | 'ipad-mini' | 'desktop';

export interface ViewportConfig {
  id: ViewportMode;
  name: string;
  width: number | '100%';
  height: number | '100%';
  devicePixelRatio?: number;
  icon?: string;
  isMobileDevice?: boolean;
}

