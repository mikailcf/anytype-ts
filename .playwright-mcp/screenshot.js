#!/usr/bin/env node
// CDP screenshot helper - usage: node screenshot.js [output.png]
// Captures screenshot of the Anytype Electron window via CDP

const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');

const output = process.argv[2] || '/tmp/anytype-screenshot.png';

function getTargets() {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function main() {
  const targets = await getTargets();
  const target = targets.find(t => t.title && t.title.includes('Anytype') && t.type === 'page');
  if (!target) {
    console.error('No Anytype target found.');
    process.exit(1);
  }

  const ws = new WebSocket(target.webSocketDebuggerUrl);

  ws.on('open', () => {
    ws.send(JSON.stringify({ id: 1, method: 'Page.captureScreenshot', params: { format: 'png' } }));
  });

  ws.on('message', (data) => {
    const msg = JSON.parse(data);
    if (msg.id === 1 && msg.result) {
      fs.writeFileSync(output, Buffer.from(msg.result.data, 'base64'));
      console.log('Screenshot saved to', output);
      ws.close();
    }
  });

  ws.on('close', () => process.exit(0));
  ws.on('error', (err) => { console.error('WS error:', err.message); process.exit(1); });
  setTimeout(() => { console.error('Timeout'); process.exit(1); }, 10000);
}

main().catch(err => { console.error(err.message); process.exit(1); });
