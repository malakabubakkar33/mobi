import { BridgeStatus, MobileSession } from '../types';

const BRIDGE_API_BASE = 'http://localhost:4800';

class BridgeClient {
  private ws: WebSocket | null = null;
  private listeners: ((event: { type: string; data: any }) => void)[] = [];
  private currentStatus: BridgeStatus | null = null;

  async getStatus(): Promise<BridgeStatus> {
    try {
      const response = await fetch(`${BRIDGE_API_BASE}/api/status`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(3000),
      });

      if (!response.ok) {
        throw new Error(`Bridge returned HTTP ${response.status}`);
      }

      const data = await response.json();
      this.currentStatus = {
        connected: true,
        version: data.version || '1.0.0',
        hostIp: data.hostIp || '127.0.0.1',
        bridgePort: data.bridgePort || 4800,
        lanUrl: data.lanUrl || `http://${data.hostIp || '127.0.0.1'}:4800`,
        activeDevServers: data.activeDevServers || [],
        connectedClientsCount: data.connectedClientsCount || 0,
        lastPing: Date.now(),
      };
      return this.currentStatus;
    } catch (err) {
      // Return offline status with clean diagnostics
      return {
        connected: false,
        version: '1.0.0',
        hostIp: '127.0.0.1',
        bridgePort: 4800,
        lanUrl: 'http://localhost:4800',
        activeDevServers: [],
        connectedClientsCount: 0,
        lastPing: 0,
      };
    }
  }

  async createSession(targetUrl: string): Promise<MobileSession> {
    try {
      const response = await fetch(`${BRIDGE_API_BASE}/api/session/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ targetUrl }),
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to create session (${response.status})`);
      }

      const session: MobileSession = await response.json();
      return session;
    } catch (err: any) {
      console.warn('Bridge API session creation failed, using client fallback:', err);
      // Fallback local session generation
      const token = 'mobi_' + Math.random().toString(36).substring(2, 9);
      const hostIp = this.currentStatus?.hostIp || '127.0.0.1';
      const previewUrl = `http://${hostIp}:4800/preview/${token}`;

      return {
        id: 'sess_' + Date.now(),
        token,
        targetUrl,
        previewUrl,
        qrCodeDataUrl: '', // Will be rendered by QRCode component
        createdAt: Date.now(),
        expiresAt: Date.now() + 1000 * 60 * 60 * 2, // 2 hours
        pairedDevices: [],
      };
    }
  }

  async scanDevServers(): Promise<any[]> {
    try {
      const response = await fetch(`${BRIDGE_API_BASE}/api/scan`, {
        signal: AbortSignal.timeout(4000),
      });
      if (response.ok) {
        const data = await response.json();
        return data.servers || [];
      }
    } catch {}
    return [];
  }

  connectWebSocket(sessionId?: string, onEvent?: (event: { type: string; data: any }) => void) {
    if (onEvent) {
      this.listeners.push(onEvent);
    }

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      if (sessionId && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'SUBSCRIBE_SESSION', sessionId }));
      }
      return;
    }

    try {
      const wsUrl = `ws://localhost:4800/mobi-ws`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        if (sessionId) {
          this.ws?.send(JSON.stringify({ type: 'SUBSCRIBE_SESSION', sessionId }));
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          this.listeners.forEach((listener) => listener(payload));
        } catch {}
      };

      this.ws.onclose = () => {
        this.ws = null;
        // Exponential reconnect
        setTimeout(() => {
          if (this.listeners.length > 0) {
            this.connectWebSocket(sessionId);
          }
        }, 3000);
      };

      this.ws.onerror = () => {
        this.ws = null;
      };
    } catch (e) {
      console.warn('WS bridge connection error', e);
    }
  }

  disconnectWebSocket() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
    this.listeners = [];
  }
}

export const bridgeClient = new BridgeClient();

