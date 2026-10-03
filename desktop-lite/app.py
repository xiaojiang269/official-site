# -*- coding: utf-8 -*-
"""550W 综合指挥系统 轻量桌面版
内置本地 HTTP 服务加载 550w.html，用系统 WebView2 内核渲染（Windows 10/11 自带）。
"""
import os
import sys
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

import webview


def get_base_dir():
    if getattr(sys, 'frozen', False):  # PyInstaller 打包后
        return sys._MEIPASS
    return os.path.dirname(os.path.abspath(__file__))


APP_DIR = os.path.join(get_base_dir(), 'app')
PORT_FILE = '550w.html'


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=APP_DIR, **kwargs)

    def log_message(self, *args):
        pass  # 关闭访问日志


def start_server():
    httpd = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    port = httpd.server_address[1]
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return port


def main():
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
