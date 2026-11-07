/* 550W 综合指挥系统 桌面版 - 主进程 */
const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const http = require('http');
const https = require('https');
const fs = require('fs');

const APP_DIR = path.join(__dirname, 'app');
const PORT_FILE = '550w.html';
const REMOTE_PAGE = 'https://xiaojiang269.github.io/official-site/550w.html';
const SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000;

function cacheFile() {
  return path.join(app.getPath('userData'), 'cache', PORT_FILE);
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff'
};

function startServer() {
  const server = http.createServer((req, res) => {
    try {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p === '/') p = '/' + PORT_FILE;
      let file = path.join(APP_DIR, p.replace(/^\/+/, ''));
      if (p === '/' + PORT_FILE) {
        const cf = cacheFile();
        if (fs.existsSync(cf)) file = cf;   /* 优先加载官网同步下来的最新页面 */
      }
      if (file !== cacheFile() && !file.startsWith(APP_DIR)) { res.writeHead(403); res.end('403'); return; }
      fs.readFile(file, (err, data) => {
        if (err) { res.writeHead(404); res.end('404 Not Found'); return; }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
        res.end(data);
      });
    } catch (e) {
      res.writeHead(500); res.end('500');
    }
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve(server.address().port);
    });
  });
}

let mainWindow = null;

/* 启动后在后台从官网拉取最新 550w.html：成功则缓存并立即刷新窗口，失败静默用内置页面 */
function syncLatestPage() {
  return new Promise((resolve) => {
    const cf = cacheFile();
    try {
      if (fs.existsSync(cf) && Date.now() - fs.statSync(cf).mtimeMs < SYNC_INTERVAL_MS) {
        return resolve(false);
      }
    } catch (e) { /* 缓存状态异常时继续尝试同步 */ }
    let settled = false;
    const done = (v) => { if (!settled) { settled = true; resolve(v); } };
    let req;
    try {
      req = https.get(REMOTE_PAGE + '?ts=' + Date.now(), { timeout: 6000 }, (res) => {
        if (res.statusCode !== 200) { res.resume(); return done(false); }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          if (buf.length < 50000 || buf.indexOf('550W') === -1) return done(false);
          try {
            let old = null;
            try { old = fs.readFileSync(cf); } catch (e) {}
            fs.mkdirSync(path.dirname(cf), { recursive: true });
            const tmp = cf + '.tmp';
            fs.writeFileSync(tmp, buf);
            fs.renameSync(tmp, cf);
            done(!old || !old.equals(buf));
          } catch (e) { done(false); }
        });
      });
      req.on('timeout', () => { req.destroy(); done(false); });
      req.on('error', () => done(false));
    } catch (e) { done(false); }
  });
}

function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1000,
    minHeight: 640,
    icon: path.join(__dirname, 'build', 'icon.ico'),
    autoHideMenuBar: true,
    backgroundColor: '#050608',
    title: '550W 综合指挥系统',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false
    }
  });
  mainWindow.loadURL('http://127.0.0.1:' + port + '/' + PORT_FILE);
  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);
  const port = await startServer();
  createWindow(port);
  syncLatestPage().then((changed) => {
    if (changed && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.reload();
    }
  });
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(port);
  });
});

app.on('window-all-closed', () => {
  app.quit();
});
