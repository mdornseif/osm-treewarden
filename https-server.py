#!/usr/bin/env python3
import http.server
import ssl
import socketserver
import os

# Configuration
PORT = 8443
CERT_FILE = 'cert.pem'
KEY_FILE = 'key.pem'

class HTTPServer(socketserver.TCPServer):
    def __init__(self, server_address, RequestHandlerClass):
        super().__init__(server_address, RequestHandlerClass)
        
        # Create SSL context
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.load_cert_chain(CERT_FILE, KEY_FILE)
        
        # Wrap socket with SSL
        self.socket = context.wrap_socket(self.socket, server_side=True)

if __name__ == '__main__':
    # Change to the directory containing this script
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Create server
    with HTTPServer(('localhost', PORT), http.server.SimpleHTTPRequestHandler) as httpd:
        print(f'🚀 HTTPS Server running on https://localhost:{PORT}')
        print(f'📁 Serving files from: {os.getcwd()}')
        print('⚠️  Note: You may see a security warning in your browser - this is normal for self-signed certificates')
        print('   Click "Advanced" and "Proceed to localhost" to continue')
        print('\n🔗 OAuth Callback URL for OSM registration:')
        print(f'   https://localhost:{PORT}/oauth-callback.html')
        print('\nPress Ctrl+C to stop the server')
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\n�� Server stopped') 