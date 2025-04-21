import fs from 'fs';
import path from 'path';

const CERT_DIR = path.join(process.cwd(), 'cert');

/*export const getCertificates = () => {
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
}; */

export const getCertificates = () => {
  try {
    const cert = Buffer.from(process.env.CERT_PEM_BASE64 || '', 'base64').toString('utf-8');
    const key = Buffer.from(process.env.KEY_PEM_BASE64 || '', 'base64').toString('utf-8');
    const ca = Buffer.from(process.env.CA_PEM_BASE64 || '', 'base64').toString('utf-8');

    return { cert, key, ca };
  } catch (error) {
    console.error('Error loading certificates:', error);
    throw new Error('Failed to load SSL certificates from env vars');
  }
};