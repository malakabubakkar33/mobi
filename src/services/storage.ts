import { RecentItem } from '../types';

const STORAGE_KEYS = {
  RECENTS: 'mobiview_recent_urls',
  SETTINGS: 'mobiview_settings',
  LAST_URL: 'mobiview_last_url',
};

export const defaultPresets: RecentItem[] = [
  {
    id: 'preset-vite',
    url: 'http://localhost:5173',
    title: 'Vite Dev Server',
    timestamp: Date.now() - 1000 * 60 * 10,
    isLocalhost: true,
    port: 5173,
  },
  {
    id: 'preset-next',
    url: 'http://localhost:3000',
    title: 'Next.js Dev Server',
    timestamp: Date.now() - 1000 * 60 * 30,
    isLocalhost: true,
    port: 3000,
  },
  {
    id: 'preset-example',
    url: 'https://example.com',
    title: 'Example Domain (HTTPS)',
    timestamp: Date.now() - 1000 * 60 * 60,
    isLocalhost: false,
  },
  {
    id: 'preset-wikipedia',
    url: 'https://en.m.wikipedia.org',
    title: 'Wikipedia Mobile',
    timestamp: Date.now() - 1000 * 60 * 120,
    isLocalhost: false,
  }
];

export const storageService = {
  getRecents(): RecentItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RECENTS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.RECENTS, JSON.stringify(defaultPresets));
        return defaultPresets;
      }
      return JSON.parse(data);
    } catch {
      return defaultPresets;
    }
  },

  addRecent(url: string, title?: string): RecentItem[] {
    try {
      const recents = this.getRecents();
      let isLocalhost = false;
      let port: number | undefined;

      try {
        const parsed = new URL(url);
        isLocalhost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' || parsed.hostname.startsWith('192.168.');
        if (parsed.port) {
          port = parseInt(parsed.port, 10);
        }
      } catch {
        isLocalhost = url.includes('localhost') || url.includes('127.0.0.1');
      }

      const existingIndex = recents.findIndex((item) => item.url.toLowerCase() === url.toLowerCase());
      const newItem: RecentItem = {
        id: 'rec_' + Date.now(),
        url,
        title: title || (isLocalhost ? `Localhost ${port ? `:${port}` : ''}` : new URL(url).hostname),
        timestamp: Date.now(),
        isLocalhost,
        port,
      };

      let updated: RecentItem[];
      if (existingIndex >= 0) {
        updated = [newItem, ...recents.filter((_, i) => i !== existingIndex)];
      } else {
        updated = [newItem, ...recents.slice(0, 19)]; // Keep up to 20
      }

      localStorage.setItem(STORAGE_KEYS.RECENTS, JSON.stringify(updated));
      return updated;
    } catch {
      return [];
    }
  },

  removeRecent(id: string): RecentItem[] {
    try {
      const recents = this.getRecents().filter((item) => item.id !== id);
      localStorage.setItem(STORAGE_KEYS.RECENTS, JSON.stringify(recents));
      return recents;
    } catch {
      return [];
    }
  },

  clearRecents(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.RECENTS);
    } catch {}
  },

  getLastUrl(): string {
    return localStorage.getItem(STORAGE_KEYS.LAST_URL) || '';
  },

  setLastUrl(url: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_URL, url);
    } catch {}
  }
};

