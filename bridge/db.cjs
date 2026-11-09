const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'mobiview_data.json');

// Default initial state
const defaultState = {
  sessions: {},
  settings: {
    bridgePort: 4800,
    preferredIp: null,
    corsAllowAll: true,
  },
  history: [],
};

class LocalDatabase {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return { ...defaultState, ...JSON.parse(raw) };
      }
    } catch (err) {
      console.warn('[DB] Failed to read db file, creating new:', err.message);
    }
    this.save(defaultState);
    return { ...defaultState };
  }

  save(dataToSave = this.data) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DB] Failed to save db file:', err.message);
    }
  }

  createSession(session) {
    this.data.sessions[session.token] = session;
    this.save();
    return session;
  }

  getSession(token) {
    const session = this.data.sessions[token];
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      delete this.data.sessions[token];
      this.save();
      return null;
    }
    return session;
  }

  recordDevice(token, deviceInfo) {
    const session = this.getSession(token);
    if (!session) return null;

    if (!session.pairedDevices) session.pairedDevices = [];
    const existing = session.pairedDevices.findIndex((d) => d.id === deviceInfo.id);
    if (existing >= 0) {
      session.pairedDevices[existing] = { ...session.pairedDevices[existing], ...deviceInfo, lastActive: Date.now() };
    } else {
      session.pairedDevices.push({ ...deviceInfo, connectedAt: Date.now(), lastActive: Date.now() });
    }
    this.save();
    return session;
  }

  addHistory(url, title = '') {
    if (!url) return;
    const now = Date.now();
    const existingIndex = this.data.history.findIndex((h) => h.url === url);
    const item = {
      id: 'hist_' + now,
      url,
      title: title || url,
      timestamp: now,
      isLocalhost: url.includes('localhost') || url.includes('127.0.0.1'),
    };

    if (existingIndex >= 0) {
      this.data.history[existingIndex] = item;
    } else {
      this.data.history.unshift(item);
      if (this.data.history.length > 50) this.data.history.pop();
    }
    this.save();
  }

  getHistory() {
    return this.data.history;
  }
}

module.exports = new LocalDatabase();
