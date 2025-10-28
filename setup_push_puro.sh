#!/usr/bin/env bash
set -e

APP_NAME="manicure-studio"
PORT="${PORT:-3000}"

echo "==> Preparando pastas"
rm -rf client server package.json package-lock.json
mkdir -p client/public client/src server

echo "==> Criando package.json"
cat > package.json << 'JSON'
{
  "name": "manicure-studio-push-puro",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node server/index.js",
    "dev": "nodemon server/index.js",
    "gen:vapid": "node server/push.js --gen"
  },
  "engines": { "node": ">=20 <21" },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.19.2",
    "web-push": "^3.6.7"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}
JSON

echo "==> Criando Service Worker (client/public/sw.js)"
cat > client/public/sw.js << 'JS'
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// cache simples (opcional)
const CACHE_NAME = 'manicure-studio-v1';
const STATIC = ['/', '/index.html', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png'];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(STATIC)).then(()=>self.skipWaiting()));
});
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  event.respondWith(
    caches.match(req).then(cached => cached ||
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c=>c.put(req, copy));
        return res;
      }).catch(()=>caches.match('/index.html'))
    )
  );
});

// push receive
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch(e){}
  const title = data.title || 'Notificação';
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url: data.url || '/' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification?.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const had = list.find(c => c.url.includes(new URL(url, self.location.origin).pathname));
      if (had) { had.focus(); return; }
      return clients.openWindow(url);
    })
  );
});
JS

echo "==> Criando index.html (client/public/index.html)"
cat > client/public/index.html << 'HTML'
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <link rel="manifest" href="/manifest.json" />
  <title>Manicure Studio Lite</title>
</head>
<body>
  <h1 style="font-family: system-ui; text-align:center;">Manicure Studio Lite</h1>
  <p style="text-align:center;">PWA com Web Push nativo (sem OneSignal)</p>

  <div style="display:flex; gap:8px; justify-content:center;">
    <button id="btn-perm">Ativar notificações</button>
    <button id="btn-test">Enviar notificação de teste</button>
  </div>

  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js', { scope: '/' });
      });
    }
  </script>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
HTML

echo "==> Criando manifest.json e ícones de exemplo"
cat > client/public/manifest.json << 'JSON'
{
  "name": "Manicure Studio Lite",
  "short_name": "Studio Lite",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#e91e63",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
JSON

mkdir -p client/public/icons
# gera ícones “fakes” (1px) só pra não quebrar — substitua depois por ícones reais
printf '\x89PNG\r\n\x1a\n' > client/public/icons/icon-192.png
printf '\x89PNG\r\n\x1a\n' > client/public/icons/icon-512.png

echo "==> Criando client/src/main.js"
cat > client/src/main.js << 'JS'
import { ensurePushSubscription, sendTest } from './push.js';

document.getElementById('btn-perm').addEventListener('click', async () => {
  try {
    await ensurePushSubscription();
    alert('Notificações ativadas!');
  } catch (e) {
    alert('Falha ao ativar: ' + e.message);
  }
});
document.getElementById('btn-test').addEventListener('click', async () => {
  await sendTest();
});
JS

echo "==> Criando client/src/push.js"
cat > client/src/push.js << 'JS'
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i);
  return output;
}

export async function ensurePushSubscription() {
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Navegador sem suporte a Push');
  }
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error('Permissão negada');

  const reg = await navigator.serviceWorker.ready;

  const vapid = await fetch('/api/vapid-public-key').then(r=>r.json());
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapid.publicKey),
  });

  await fetch('/api/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sub),
  });
}

export async function sendTest() {
  await fetch('/api/send-test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Teste', body: 'Web Push nativo funcionando!', url: '/' })
  });
}
JS

echo "==> Criando server/push.js (VAPID + envio)"
cat > server/push.js << 'JS'
import fs from 'node:fs';
import path from 'node:path';
import webpush from 'web-push';

const DATA_DIR = path.resolve('server');
const VAPID_FILE = path.join(DATA_DIR, 'vapid.json');
const SUBS_FILE  = path.join(DATA_DIR, 'subs.json');

export function ensureFiles() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(SUBS_FILE)) fs.writeFileSync(SUBS_FILE, '[]');
  if (!fs.existsSync(VAPID_FILE)) {
    const keys = webpush.generateVAPIDKeys();
    fs.writeFileSync(VAPID_FILE, JSON.stringify({ subject: 'mailto:admin@manicureapp.site', ...keys }, null, 2));
  }
}

export function loadVapid() {
  ensureFiles();
  const { subject, publicKey, privateKey } = JSON.parse(fs.readFileSync(VAPID_FILE, 'utf-8'));
  const PUB = process.env.VAPID_PUBLIC_KEY  || publicKey;
  const PRI = process.env.VAPID_PRIVATE_KEY || privateKey;
  const SUB = process.env.VAPID_SUBJECT     || subject || 'mailto:admin@manicureapp.site';
  webpush.setVapidDetails(SUB, PUB, PRI);
  return { publicKey: PUB, privateKey: PRI, subject: SUB };
}

export function loadSubs() {
  ensureFiles();
  return JSON.parse(fs.readFileSync(SUBS_FILE, 'utf-8'));
}

export function saveSub(sub) {
  ensureFiles();
  const list = loadSubs();
  if (!list.find(s => s.endpoint === sub.endpoint)) {
    list.push(sub);
    fs.writeFileSync(SUBS_FILE, JSON.stringify(list, null, 2));
  }
}

export async function sendAll(payload) {
  const subs = loadSubs();
  const results = [];
  for (const s of subs) {
    try {
      await webpush.sendNotification(s, JSON.stringify(payload));
      results.push({ endpoint: s.endpoint, ok: true });
    } catch (e) {
      results.push({ endpoint: s.endpoint, ok: false, error: e.message });
    }
  }
  return results;
}

// CLI: gerar/mostrar chaves
if (process.argv.includes('--gen')) {
  ensureFiles();
  const { publicKey, privateKey } = loadVapid();
  console.log('VAPID_PUBLIC_KEY=', publicKey);
  console.log('VAPID_PRIVATE_KEY=', privateKey);
}
JS

echo "==> Criando server/index.js (Express + rotas)"
cat > server/index.js << 'JS'
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadVapid, saveSub, sendAll } from './push.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json());

// estáticos do client (ajuste se necessário)
app.use(express.static(path.join(__dirname, '..', 'client', 'public')));

app.get('/api/vapid-public-key', (req, res) => {
  const { publicKey } = loadVapid();
  res.json({ publicKey });
});

app.post('/api/subscribe', (req, res) => {
  try { saveSub(req.body); res.json({ ok: true }); }
  catch(e){ res.status(400).json({ ok:false, error: e.message }); }
});

app.post('/api/send-test', async (req, res) => {
  const { title='Teste', body='Notificação ativa!', url='/' } = req.body || {};
  try {
    const result = await sendAll({ title, body, url });
    res.json({ ok: true, result });
  } catch (e) {
    res.status(500).json({ ok:false, error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server on http://localhost:'+PORT));
JS

echo "==> Instalando dependências"
npm i
npm i -D nodemon

echo "==> Gerando/mostrando chaves VAPID"
npm run gen:vapid

echo "==> Pronto!"
echo
echo "Comandos úteis:"
echo "  npm run dev      # desenvolvimento (nodemon)"
echo "  npm start        # produção"
echo
echo "Acesse: http://localhost:${PORT} (ou seu domínio HTTPS no VPS)."
echo "Depois clique em 'Ativar notificações' e use 'Enviar notificação de teste'."
