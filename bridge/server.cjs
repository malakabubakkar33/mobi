const express = require('express');
const cors = require('cors');
const http = require('http');
const https = require('https');
const os = require('os');
const net = require('net');
const path = require('path');
const QRCode = require('qrcode');
const { WebSocketServer, WebSocket } = require('ws');
const db = require('./db.cjs');

const PORT = process.env.BRIDGE_PORT || 4800;
const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// 1. Automatic LAN IP Detection
function getLanIp() {
  const interfaces = os.networkInterfaces();
  const candidates = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        if (iface.address.startsWith('192.168.')) {
          return iface.address;
        }
        if (iface.address.startsWith('10.') || iface.address.startsWith('172.')) {
          candidates.push(iface.address);
        } else {
          candidates.push(iface.address);
        }
      }
    }
  }

  return candidates.length > 0 ? candidates[0] : '127.0.0.1';
}

const HOST_IP = getLanIp();
console.log(`[MobiView Bridge] Initialized. Detected LAN IP: ${HOST_IP}`);

// 2. Local Dev Port Scanner
const COMMON_DEV_PORTS = [
  { port: 5173, name: 'Vite Dev Server', framework: 'Vite' },
  { port: 3000, name: 'Next.js / CRA', framework: 'Next.js' },
  { port: 8080, name: 'Vue / Webpack', framework: 'Vue CLI' },
  { port: 4173, name: 'Vite Preview', framework: 'Vite Preview' },
  { port: 8000, name: 'FastAPI / Django', framework: 'Python' },
  { port: 4200, name: 'Angular Dev Server', framework: 'Angular' },
  { port: 5000, name: 'Flask / ASP.NET', framework: 'Backend' },
  { port: 3001, name: 'Alternate Dev Server', framework: 'Node.js' },
];

async function checkPortIsAlive(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(350);

    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(port, '127.0.0.1');
  });
}

async function scanDevServers() {
  const results = [];
  for (const item of COMMON_DEV_PORTS) {
    const isAlive = await checkPortIsAlive(item.port);
    if (isAlive) {
      results.push({
        port: item.port,
        name: item.name,
        framework: item.framework,
        url: `http://localhost:${item.port}`,
        isAlive: true,
        detectedAt: Date.now(),
      });
    }
  }
  return results;
}

// 3. Status Endpoint
app.get('/api/status', async (req, res) => {
  const activeDevServers = await scanDevServers();
  res.json({
    connected: true,
    version: '1.0.0',
    hostIp: HOST_IP,
    bridgePort: PORT,
    lanUrl: `http://${HOST_IP}:${PORT}`,
    activeDevServers,
    connectedClientsCount: wsClients.size,
    timestamp: Date.now(),
  });
});

// 4. Scan Endpoint
app.get('/api/scan', async (req, res) => {
  const servers = await scanDevServers();
  res.json({ servers, hostIp: HOST_IP });
});

// 5. Session Creation Endpoint (QR Code + Pairing Token)
app.post('/api/session/create', async (req, res) => {
  try {
    let { targetUrl } = req.body;
    if (!targetUrl || typeof targetUrl !== 'string') {
      return res.status(400).json({ error: 'targetUrl is required' });
    }

    targetUrl = targetUrl.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'http://' + targetUrl;
    }

    const token = 'mobi_' + Math.random().toString(36).substring(2, 10);
    const sessionId = 'sess_' + Date.now();
    const expiresAt = Date.now() + 1000 * 60 * 60 * 4; // 4 hours

    const previewUrl = `http://${HOST_IP}:${PORT}/preview/${token}`;

    // Generate high resolution QR Code with MobiView Green
    const qrCodeDataUrl = await QRCode.toDataURL(previewUrl, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 320,
      color: {
        dark: '#168447',
        light: '#FFFFFF',
      },
    });

    const session = {
      id: sessionId,
      token,
      targetUrl,
      previewUrl,
      qrCodeDataUrl,
      createdAt: Date.now(),
      expiresAt,
      pairedDevices: [],
    };

    db.createSession(session);
    db.addHistory(targetUrl);

    console.log(`[MobiView Bridge] Created session ${token} for ${targetUrl}`);
    res.json(session);
  } catch (err) {
    console.error('[MobiView Bridge] Error creating session:', err);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// 6. iPhone Heartbeat / Ping Endpoint
app.post('/api/session/:token/ping', (req, res) => {
  const { token } = req.params;
  const session = db.getSession(token);
  if (!session) {
    return res.status(404).json({ error: 'Session not found or expired' });
  }

  const userAgent = req.headers['user-agent'] || 'Unknown';
  const isIPhone = /iPhone|iPad|iPod/.test(userAgent);
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';

  const deviceInfo = {
    id: req.body.deviceId || 'dev_' + Buffer.from(clientIp + userAgent).toString('base64').substring(0, 10),
    deviceName: isIPhone ? 'Apple iPhone (Safari)' : 'Mobile Safari/Browser',
    ip: clientIp,
    userAgent,
    isIPhone,
    batteryLevel: req.body.batteryLevel,
    screen: req.body.screen || {},
  };

  db.recordDevice(token, deviceInfo);

  // Notify Desktop UI via WebSocket
  broadcastToSession(token, {
    type: 'DEVICE_PAIRED',
    data: {
      sessionToken: token,
      device: deviceInfo,
      timestamp: Date.now(),
    },
  });

  res.json({ ok: true, status: 'active', serverTime: Date.now() });
});

// 7. Desktop Smart Proxy (Strips X-Frame-Options and CSP for universal browser view)
app.get('/api/proxy', (req, res) => {
  let targetUrl = req.query.url;
  if (!targetUrl || typeof targetUrl !== 'string') {
    return res.status(400).send('URL query parameter required');
  }

  targetUrl = targetUrl.trim();
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'http://' + targetUrl;
  }

  try {
    const parsedTarget = new URL(targetUrl);
    const client = parsedTarget.protocol === 'https:' ? https : http;

    const options = {
      hostname: parsedTarget.hostname,
      port: parsedTarget.port || (parsedTarget.protocol === 'https:' ? 443 : 80),
      path: parsedTarget.pathname + parsedTarget.search,
      method: req.method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 MobiView/1.0',
        'Accept': req.headers['accept'] || '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    };
    if (parsedTarget.protocol === 'https:') {
      options.servername = parsedTarget.hostname;
    }

    const proxyReq = client.request(options, (proxyRes) => {
      const responseHeaders = { ...proxyRes.headers };

      delete responseHeaders['x-frame-options'];
      delete responseHeaders['content-security-policy'];
      delete responseHeaders['content-security-policy-report-only'];
      delete responseHeaders['cross-origin-opener-policy'];
      delete responseHeaders['cross-origin-embedder-policy'];

      responseHeaders['access-control-allow-origin'] = '*';
      responseHeaders['access-control-allow-methods'] = 'GET, POST, OPTIONS, PUT, DELETE';
      responseHeaders['access-control-allow-headers'] = '*';

      res.writeHead(proxyRes.statusCode, responseHeaders);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error(`[MobiView Proxy] Request error for ${targetUrl}:`, err.message);
      res.status(502).send(`
        <div style="font-family: -apple-system, sans-serif; padding: 40px; text-align: center; color: #20252D;">
          <h2>Unable to Connect to Target</h2>
          <p style="color: #737B85;">Could not reach ${targetUrl}</p>
        </div>
      `);
    });

    proxyReq.end();
  } catch (err) {
    res.status(500).send('Internal proxy error: ' + err.message);
  }
});

// 8. Mobile Safari Testing Interface (/preview/:token)
app.get('/preview/:token', (req, res) => {
  const { token } = req.params;
  const session = db.getSession(token);

  if (!session) {
    return res.status(404).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <title>MobiView — Session Expired</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #FFFFFF; color: #20252D; text-align: center; padding: 60px 20px; }
            .card { max-width: 380px; margin: 0 auto; border: 1px solid #E8EBE9; border-radius: 16px; padding: 28px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
            .icon { font-size: 44px; margin-bottom: 16px; }
            h2 { margin: 0 0 10px 0; font-size: 20px; font-weight: 700; color: #20252D; }
            p { color: #737B85; font-size: 14px; line-height: 1.5; margin-bottom: 24px; }
            a { display: inline-block; background: #168447; color: white; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">⏱️</div>
            <h2>Session Expired</h2>
            <p>This MobiView preview session has expired or is invalid. Please scan a fresh QR code from your desktop screen.</p>
            <a href="/">Open MobiView</a>
          </div>
        </body>
      </html>
    `);
  }

  // Register device immediately
  const userAgent = req.headers['user-agent'] || '';
  const isIPhone = /iPhone|iPad|iPod/.test(userAgent);
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';

  db.recordDevice(token, {
    id: 'dev_' + Buffer.from(clientIp + userAgent).toString('base64').substring(0, 10),
    deviceName: isIPhone ? 'Apple iPhone (Safari)' : 'Mobile Safari/Browser',
    ip: clientIp,
    userAgent,
    isIPhone,
    lastActive: Date.now(),
  });

  broadcastToSession(token, {
    type: 'DEVICE_PAIRED',
    data: {
      sessionToken: token,
      device: {
        id: 'dev_' + Buffer.from(clientIp + userAgent).toString('base64').substring(0, 10),
        deviceName: isIPhone ? 'Apple iPhone (Safari)' : 'Mobile Safari/Browser',
        ip: clientIp,
        isIPhone,
      },
      timestamp: Date.now(),
    },
  });

  const contentSrc = `/preview-content/${token}`;

  // Render Full-Screen Safari Testing Page with Collapsible MobiView Testing Toolbar
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>MobiView — ${session.targetUrl}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    
    /* Top Floating Testing Toolbar */
    #mobi-toolbar {
      position: fixed;
      top: env(safe-area-inset-top, 12px);
      left: 50%;
      transform: translateX(-50%);
      z-index: 999999;
      background: rgba(255, 255, 255, 0.94);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid #E8EBE9;
      border-radius: 9999px;
      padding: 6px 14px;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04);
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      user-select: none;
      -webkit-user-select: none;
      max-width: 95vw;
    }

    #mobi-toolbar.minimized {
      transform: translateX(-50%) scale(0.85);
      opacity: 0.45;
      padding: 6px 10px;
    }

    #mobi-toolbar.minimized:active, #mobi-toolbar.minimized:hover {
      opacity: 1;
      transform: translateX(-50%) scale(1);
    }

    .brand-pill {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      font-weight: 700;
      color: #168447;
      background: #E8F6EC;
      padding: 4px 8px;
      border-radius: 9999px;
      border: 1px solid #d0ebd8;
    }

    .pulse-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #168447;
      box-shadow: 0 0 0 2px rgba(22, 132, 71, 0.25);
    }

    .dims-pill {
      font-size: 10px;
      font-family: ui-monospace, Menlo, Monaco, Consolas, monospace;
      color: #737B85;
      display: none;
    }
    @media (min-width: 360px) {
      .dims-pill { display: inline-block; }
    }

    .btn {
      background: none;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 4px 8px;
      border-radius: 8px;
      color: #20252D;
      font-size: 12px;
      font-weight: 500;
      transition: background 0.15s;
    }
    .btn:active {
      background: #E8F6EC;
      color: #168447;
    }

    /* Website Rendering Frame */
    #mobi-frame {
      width: 100%;
      height: 100%;
      border: none;
      display: block;
      background: #FFFFFF;
    }
  </style>
</head>
<body>
  <!-- MOBIVIEW TESTING TOOLBAR (Section 7 Requirements) -->
  <header id="mobi-toolbar">
    <div class="brand-pill" title="Connected to MobiView Local Bridge">
      <span class="pulse-dot"></span>
      <span>MobiView</span>
    </div>

    <span class="dims-pill" id="mobi-dims"></span>

    <!-- 1. Reload website -->
    <button class="btn" id="btn-reload" title="Reload Website">
      🔄 Reload
    </button>

    <!-- 2. Open in Safari directly -->
    <button class="btn" id="btn-safari" title="Open in Safari">
      ↗ Safari
    </button>

    <!-- 3. Copy preview link -->
    <button class="btn" id="btn-copy" title="Copy Preview Link">
      📋 Copy
    </button>

    <!-- 4. Return to MobiView / Minimize -->
    <button class="btn" id="btn-toggle" title="Toggle Toolbar">
      ✕
    </button>
  </header>

  <!-- Full-Screen Browsing Surface -->
  <iframe
    id="mobi-frame"
    src="${contentSrc}"
    allow="geolocation; microphone; camera; midi; vr; accelerometer; gyroscope; payment; ambient-light-sensor"
    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
  ></iframe>

  <script>
    (function() {
      var token = "${token}";
      var targetUrl = "${session.targetUrl}";
      var frame = document.getElementById('mobi-frame');
      var toolbar = document.getElementById('mobi-toolbar');
      var dimsEl = document.getElementById('mobi-dims');
      var btnReload = document.getElementById('btn-reload');
      var btnSafari = document.getElementById('btn-safari');
      var btnCopy = document.getElementById('btn-copy');
      var btnToggle = document.getElementById('btn-toggle');

      function updateDims() {
        if (dimsEl) {
          dimsEl.textContent = window.innerWidth + ' × ' + window.innerHeight;
        }
      }
      window.addEventListener('resize', updateDims);
      updateDims();

      // Reload website
      btnReload.addEventListener('click', function(e) {
        e.stopPropagation();
        frame.src = frame.src;
      });

      // Open in Safari
      btnSafari.addEventListener('click', function(e) {
        e.stopPropagation();
        window.location.href = targetUrl;
      });

      // Copy preview link
      btnCopy.addEventListener('click', function(e) {
        e.stopPropagation();
        navigator.clipboard.writeText(window.location.href).then(function() {
          btnCopy.textContent = '✓ Copied';
          setTimeout(function() { btnCopy.textContent = '📋 Copy'; }, 2000);
        });
      });

      // Return to MobiView / Minimize toolbar
      btnToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        if (toolbar.classList.contains('minimized')) {
          toolbar.classList.remove('minimized');
          btnToggle.textContent = '✕';
        } else {
          toolbar.classList.add('minimized');
          btnToggle.textContent = '⋯';
        }
      });

      // Heartbeat to Desktop Bridge
      function sendHeartbeat() {
        fetch('/api/session/' + token + '/ping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            screen: {
              width: window.innerWidth,
              height: window.innerHeight,
              dpr: window.devicePixelRatio || 1
            }
          })
        }).catch(function() {});
      }

      sendHeartbeat();
      setInterval(sendHeartbeat, 8000);
    })();
  </script>
</body>
</html>
  `);
});

// 9. Mobile Preview Content Proxy (/preview-content/:token)
app.use('/preview-content/:token', (req, res) => {
  const { token } = req.params;
  const session = db.getSession(token);

  if (!session) {
    return res.status(404).send('Session not found or expired');
  }

  const targetUrl = session.targetUrl;
  const targetParsed = new URL(targetUrl);
  const client = targetParsed.protocol === 'https:' ? https : http;

  const targetPath = (req.url === '/' ? targetParsed.pathname : path.posix.join(targetParsed.pathname, req.url));

  const fwdHeaders = { ...req.headers };
  delete fwdHeaders['host'];
  delete fwdHeaders['connection'];
  delete fwdHeaders['accept-encoding'];
  fwdHeaders['host'] = targetParsed.host;

  const options = {
    hostname: targetParsed.hostname,
    port: targetParsed.port || (targetParsed.protocol === 'https:' ? 443 : 80),
    path: targetPath,
    method: req.method,
    headers: fwdHeaders,
  };
  if (targetParsed.protocol === 'https:') {
    options.servername = targetParsed.hostname;
  }

  const proxyReq = client.request(options, (proxyRes) => {
    const headers = { ...proxyRes.headers };
    delete headers['x-frame-options'];
    delete headers['content-security-policy'];
    delete headers['content-security-policy-report-only'];

    res.writeHead(proxyRes.statusCode, headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error(`[MobiView Bridge] Preview content error:`, err.message);
    res.status(502).send('Error connecting to target');
  });

  if (req.method === 'POST' || req.method === 'PUT') {
    req.pipe(proxyReq);
  } else {
    proxyReq.end();
  }
});

// 10. Serve built frontend in production
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Fallback to index.html for SPA routes (Express 5 compatible)
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/preview') || req.path.startsWith('/mobi-ws')) {
    return next();
  }
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.redirect('http://localhost:5173');
    }
  });
});

// 11. Create HTTP Server & WebSocket Server
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

const wsClients = new Set();
const sessionSubscriptions = new Map(); // token -> Set(ws)

wss.on('connection', (ws) => {
  wsClients.add(ws);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.type === 'SUBSCRIBE_SESSION') {
        const { sessionId } = data;
        if (!sessionSubscriptions.has(sessionId)) {
          sessionSubscriptions.set(sessionId, new Set());
        }
        sessionSubscriptions.get(sessionId).add(ws);
      }
    } catch {}
  });

  ws.on('close', () => {
    wsClients.delete(ws);
    for (const [key, set] of sessionSubscriptions.entries()) {
      set.delete(ws);
      if (set.size === 0) sessionSubscriptions.delete(key);
    }
  });
});

function broadcastToSession(token, payload) {
  const subscribers = sessionSubscriptions.get(token);
  const msg = JSON.stringify(payload);
  if (subscribers) {
    subscribers.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
  }
  wsClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

// 12. WebSocket Upgrade Handler
server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;

  if (pathname === '/mobi-ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
    return;
  }

  // Dev server HMR WebSocket proxy (for Vite / Next.js)
  const previewMatch = pathname.match(/^\/preview-content\/([^/]+)/);
  if (previewMatch) {
    const token = previewMatch[1];
    const session = db.getSession(token);
    if (session) {
      const targetParsed = new URL(session.targetUrl);
      const targetPort = targetParsed.port || (targetParsed.protocol === 'https:' ? 443 : 80);

      const proxySocket = net.connect(targetPort, targetParsed.hostname, () => {
        proxySocket.write(
          `${request.method} ${request.url} HTTP/1.1\r\n` +
          `Host: ${targetParsed.host}\r\n` +
          Object.entries(request.headers)
            .filter(([k]) => k.toLowerCase() !== 'host')
            .map(([k, v]) => `${k}: ${v}`)
            .join('\r\n') +
          '\r\n\r\n'
        );
        proxySocket.pipe(socket);
        socket.pipe(proxySocket);
      });

      proxySocket.on('error', () => {
        socket.destroy();
      });
      return;
    }
  }

  socket.destroy();
});

// Start Server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`  🚀 MobiView Local Bridge Agent Running!`);
  console.log(`  • Local:    http://localhost:${PORT}`);
  console.log(`  • LAN IP:   http://${HOST_IP}:${PORT}`);
  console.log(`  • Status:   Active & Ready for iPhone Pairings`);
  console.log(`=======================================================`);
});
