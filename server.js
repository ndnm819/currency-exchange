const https = require('https');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const port = process.env.PORT || 3000;

// Check if certificate files exist
const certPath = path.join(__dirname, 'cert');
const keyPath = path.join(certPath, 'key_ffd2a608-0a6e-4ef2-9a27-a556fc4bca5b.pem');
const certPathFile = path.join(certPath, 'cert.pem');
const caPath = path.join(certPath, 'DigiCertGlobalRootCA.crt');

if (!fs.existsSync(keyPath) || !fs.existsSync(certPathFile) || !fs.existsSync(caPath)) {
  console.error('SSL certificate files not found. Please ensure all certificate files are present in the cert directory.');
  process.exit(1);
}

const httpsOptions = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPathFile),
  ca: fs.readFileSync(caPath),
  rejectUnauthorized: true
};

app.prepare().then(() => {
  const server = https.createServer(httpsOptions, (req, res) => {
    // Set secure headers
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Configure CORS with specific allowed origins
    const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['https://localhost:3000'];
    const origin = req.headers.origin;
    
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    console.log(`Request received: ${req.method} ${req.url}`);
    handle(req, res);
  });

  server.listen(port, '0.0.0.0', (err) => {
    if (err) {
      console.error('Error starting server:', err);
      process.exit(1);
    }
    console.log(`> Ready on https://localhost:${port}`);
  });

  server.on('error', (error) => {
    console.error('Server error:', error);
  });
}); 