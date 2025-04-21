import fs from 'fs';
import path from 'path';

const CERT_DIR = path.join(process.cwd(), 'cert');

export const getCertificates = () => {
  try {
    return {
      cert: fs.readFileSync(path.join(CERT_DIR, 'cert.pem')),
      key: fs.readFileSync(path.join(CERT_DIR, 'key_ffd2a608-0a6e-4ef2-9a27-a556fc4bca5b.pem')),
      ca: fs.readFileSync(path.join(CERT_DIR, 'DigiCertGlobalRootCA.crt')),
    };
  } catch (error) {
    console.error('Error loading certificates:', error);
    throw new Error('Failed to load SSL certificates');
  }
}; 