/* 550W 综合指挥系统 桌面版 - 主进程 */
const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

const APP_DIR = path.join(__dirname, 'app');
const PORT_FILE = '550w.html';

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
      const file = path.join(APP_DIR, p.replace(/^\/+/, ''));
      if (!file.startsWith(APP_DIR)) { res.writeHead(403); res.end('403'); return; }
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
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(port);
  });
});

app.on('window-all-closed', () => {
  app.quit();
});
