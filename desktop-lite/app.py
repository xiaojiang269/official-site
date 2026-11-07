# -*- coding: utf-8 -*-
"""550W 综合指挥系统 轻量桌面版
内置本地 HTTP 服务加载 550w.html，用系统 WebView2 内核渲染（Windows 10/11 自带）。
"""
import os
import sys
import threading
import time
import urllib.request
import tempfile
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

import webview


def get_base_dir():
    if getattr(sys, 'frozen', False):  # PyInstaller 打包后
        return sys._MEIPASS
    return os.path.dirname(os.path.abspath(__file__))


APP_DIR = os.path.join(get_base_dir(), 'app')
PORT_FILE = '550w.html'
REMOTE_PAGE = 'https://xiaojiang269.github.io/official-site/550w.html'
SYNC_INTERVAL = 0  # 每次启动都检查官网页面，保证网页端改动重启即生效
CACHE_DIR = os.path.join(os.environ.get('LOCALAPPDATA') or tempfile.gettempdir(), '550W')
CACHE_FILE = os.path.join(CACHE_DIR, PORT_FILE)


def sync_latest_page():
    """后台从官网拉取最新页面，成功后写入缓存；失败完全静默，不影响启动。"""
    try:
        if os.path.exists(CACHE_FILE) and time.time() - os.path.getmtime(CACHE_FILE) < SYNC_INTERVAL:
            return
        req = urllib.request.Request(
            REMOTE_PAGE + '?ts=%d' % int(time.time()),
            headers={'User-Agent': '550W-Desktop'}
        )
        with urllib.request.urlopen(req, timeout=6) as resp:
            data = resp.read()
        if len(data) < 50000 or b'550W' not in data[:3000]:
            return
        try:
            with open(CACHE_FILE, 'rb') as f:
                if f.read() == data:
                    return  # 内容未变，不重复写盘
        except Exception:
            pass
        os.makedirs(CACHE_DIR, exist_ok=True)
        tmp = CACHE_FILE + '.tmp'
        with open(tmp, 'wb') as f:
            f.write(data)
        os.replace(tmp, CACHE_FILE)
    except Exception:
        pass


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=APP_DIR, **kwargs)

    def do_GET(self):
        path_only = self.path.split('?')[0]
        if path_only in ('/', '/' + PORT_FILE) and os.path.exists(CACHE_FILE):
            try:
                with open(CACHE_FILE, 'rb') as f:
                    data = f.read()
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.send_header('Content-Length', str(len(data)))
                self.end_headers()
                self.wfile.write(data)
                return
            except Exception:
                pass
        super().do_GET()

    def log_message(self, *args):
        pass  # 关闭访问日志


def start_server():
    httpd = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    port = httpd.server_address[1]
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return port


def main():
    threading.Thread(target=sync_latest_page, daemon=True).start()
    port = start_server()
    url = 'http://127.0.0.1:%d/%s' % (port, PORT_FILE)
    webview.create_window(
        '550W 综合指挥系统',
        url,
        width=1440,
        height=900,
        min_size=(1000, 640),
        background_color='#050608'
    )
    webview.start()


if __name__ == '__main__':
    main()
