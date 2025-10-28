import fs from 'node:fs';
import path from 'node:path';
import webpush from 'web-push';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VAPID_FILE = path.join(__dirname, 'vapid.json');
const SUBS_FILE = path.join(__dirname, 'subs.json');

interface VapidConfig {
  publicKey: string;
  privateKey: string;
  subject: string;
}

interface PushSubscription {
  endpoint: string;
  keys?: {
    p256dh: string;
    auth: string;
  };
}

function ensureVapid(): VapidConfig {
  let vapid: VapidConfig;
  
  if (fs.existsSync(VAPID_FILE)) {
    vapid = JSON.parse(fs.readFileSync(VAPID_FILE, 'utf-8'));
  } else {
    const keys = webpush.generateVAPIDKeys();
    vapid = {
      publicKey: keys.publicKey,
      privateKey: keys.privateKey,
      subject: process.env.VAPID_SUBJECT || 'mailto:you@example.com',
    };
    fs.writeFileSync(VAPID_FILE, JSON.stringify(vapid, null, 2));
    console.log('✅ Generated new VAPID keys and saved to', VAPID_FILE);
  }
  
  webpush.setVapidDetails(
    vapid.subject,
    process.env.VAPID_PUBLIC_KEY || vapid.publicKey,
    process.env.VAPID_PRIVATE_KEY || vapid.privateKey
  );
  
  return vapid;
}

export function getPublicKey(): string {
  const vapid = ensureVapid();
  return process.env.VAPID_PUBLIC_KEY || vapid.publicKey;
}

export async function saveSubscription(sub: PushSubscription): Promise<void> {
  const list = loadAll();
  const key = sub?.endpoint;
  
  if (!key) {
    throw new Error('Invalid subscription: missing endpoint');
  }
  
  if (!list.find((s) => s.endpoint === key)) {
    list.push(sub);
    fs.writeFileSync(SUBS_FILE, JSON.stringify(list, null, 2));
    console.log('✅ New push subscription saved');
  }
}

export function loadAll(): PushSubscription[] {
  if (!fs.existsSync(SUBS_FILE)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(SUBS_FILE, 'utf-8'));
}

export async function sendToAll(payload: { title: string; body: string; url?: string }) {
  ensureVapid();
  const subs = loadAll();
  const payloadString = JSON.stringify(payload);
  const results: Array<{ endpoint: string; ok: boolean; error?: string }> = [];
  
  for (const sub of subs) {
    if (!sub.keys || !sub.keys.p256dh || !sub.keys.auth) {
      results.push({ endpoint: sub.endpoint, ok: false, error: 'Invalid subscription keys' });
      continue;
    }
    
    try {
      await webpush.sendNotification(sub as any, payloadString);
      results.push({ endpoint: sub.endpoint, ok: true });
      console.log('✅ Notification sent to:', sub.endpoint.substring(0, 50) + '...');
    } catch (e: any) {
      results.push({ endpoint: sub.endpoint, ok: false, error: e.message });
      console.error('❌ Failed to send notification:', e.message);
    }
  }
  
  return results;
}

export async function sendNotification(title: string, message: string): Promise<void> {
  await sendToAll({ title, body: message, url: '/' });
}

export async function sendInactiveClientNotification(clienteNome: string): Promise<void> {
  await sendNotification(
    'Sentimos sua falta! 💅',
    `Olá ${clienteNome}! Faz tempo que você não agenda um horário conosco. Que tal agendar seu próximo atendimento?`
  );
}

if (process.argv.includes('--gen')) {
  const keys = webpush.generateVAPIDKeys();
  console.log('VAPID_PUBLIC_KEY=', keys.publicKey);
  console.log('VAPID_PRIVATE_KEY=', keys.privateKey);
  
  const vapid: VapidConfig = {
    publicKey: keys.publicKey,
    privateKey: keys.privateKey,
    subject: process.env.VAPID_SUBJECT || 'mailto:you@example.com',
  };
  
  fs.writeFileSync(VAPID_FILE, JSON.stringify(vapid, null, 2));
  console.log('\n✅ VAPID keys generated and saved to', VAPID_FILE);
}
