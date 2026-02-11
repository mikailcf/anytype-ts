#!/usr/bin/env node
// CDP helper - usage: node cdp.js <expression>
// Connects to Electron via CDP on port 9222, evaluates expression, prints result

const WebSocket = require('ws');
const http = require('http');

const expr = process.argv.slice(2).join(' ');
if (!expr) {
  console.error('Usage: node cdp.js <javascript expression>');
  process.exit(1);
}

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
    console.error('No Anytype target found. Targets:', targets.map(t => t.title));
    process.exit(1);
  }

  const ws = new WebSocket(target.webSocketDebuggerUrl);

  ws.on('open', () => {
    ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: expr, awaitPromise: true } }));
  });

  ws.on('message', (data) => {
    const msg = JSON.parse(data);
    if (msg.id === 1) {
      if (msg.result?.exceptionDetails) {
        console.error('Error:', msg.result.exceptionDetails.exception?.description || msg.result.exceptionDetails.text);
      } else if (msg.result?.result) {
        console.log(msg.result.result.value !== undefined ? msg.result.result.value : JSON.stringify(msg.result.result));
      }
      ws.close();
    }
  });

  ws.on('close', () => process.exit(0));
  ws.on('error', (err) => { console.error('WS error:', err.message); process.exit(1); });
  setTimeout(() => { console.error('Timeout'); process.exit(1); }, 10000);
}

main().catch(err => { console.error(err.message); process.exit(1); });
