const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, 'cert/key_ffd2a608-0a6e-4ef2-9a27-a556fc4bca5b.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'cert/cert.pem')),
  ca: fs.readFileSync(path.join(__dirname, 'cert/DigiCertGlobalRootCA.crt')),
  requestCert: false, // Don't require client certificates
  rejectUnauthorized: false, // Allow connections without valid client certs for testing
  minVersion: 'TLSv1.2',
  ciphers: 'HIGH:!aNULL:!MD5:!RC4'
};

// For debugging TLS/SSL issues
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

app.prepare().then(() => {
  const server = createServer(httpsOptions, async (req, res) => {
    try {
      // Set CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      // Log request details
      console.log('Request received:', {
        url: req.url,
        method: req.method,
        headers: req.headers
      });

      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', err);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
      }
    }
  });

  server.on('tlsClientError', (err, tlsSocket) => {
    console.error('TLS Client Error:', err);
  });

  server.on('error', (err) => {
    console.error('Server Error:', err);
  });

  server.listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on https://localhost:3000');
  });
}); 