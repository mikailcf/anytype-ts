#!/usr/bin/env node
// CDP drag-and-drop helper - usage: node drag.js <sourceSelector> <targetSelector> [options]
// Simulates drag and drop in the Anytype Electron window via CDP
//
// Options:
//   --type=html5    Use HTML5 drag-and-drop API (default)
//   --type=mouse    Use mouse events (mousedown/mousemove/mouseup)
//   --type=native   Use CDP Input domain for native mouse simulation (most reliable)
//   --delay=N       Delay in ms between events (default: 50)
//   --offset=X,Y    Offset from center of source element for mouse type
//   --steps=N       Number of intermediate steps for native drag (default: 10)
//
// Examples:
//   node drag.js '.card' '.column.dropzone'
//   node drag.js '.draggable' '.dropzone' --type=mouse --delay=100
//   node drag.js '[data-id="123"]' '[data-id="456"]' --type=native --steps=20
//   node drag.js '.handle' '.dropzone' --type=native --offset=10,0

const WebSocket = require('ws');
const http = require('http');

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node drag.js <sourceSelector> <targetSelector> [options]');
  console.error('');
  console.error('Options:');
  console.error('  --type=html5    Use HTML5 drag-and-drop API (default)');
  console.error('  --type=mouse    Use mouse events (mousedown/mousemove/mouseup)');
  console.error('  --type=native   Use CDP Input domain for native mouse simulation (most reliable)');
  console.error('  --delay=N       Delay in ms between events (default: 50)');
  console.error('  --offset=X,Y    Offset from center of source element for mouse type');
  console.error('  --steps=N       Number of intermediate steps for native drag (default: 10)');
  process.exit(1);
}

const sourceSelector = args[0];
const targetSelector = args[1];

// Parse options
let dragType = 'html5';
let delay = 50;
let offsetX = 0;
let offsetY = 0;
let steps = 10;

for (const arg of args.slice(2)) {
  if (arg.startsWith('--type=')) {
    dragType = arg.split('=')[1];
  } else if (arg.startsWith('--delay=')) {
    delay = parseInt(arg.split('=')[1], 10);
  } else if (arg.startsWith('--offset=')) {
    const [x, y] = arg.split('=')[1].split(',').map(Number);
    offsetX = x || 0;
    offsetY = y || 0;
  } else if (arg.startsWith('--steps=')) {
    steps = parseInt(arg.split('=')[1], 10);
  }
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

const dragHTML5 = `
(function(sourceSelector, targetSelector, delay) {
  const source = document.querySelector(sourceSelector);
  const target = document.querySelector(targetSelector);

  if (!source) return 'Error: Source element not found: ' + sourceSelector;
  if (!target) return 'Error: Target element not found: ' + targetSelector;

  const dataTransfer = new DataTransfer();
  dataTransfer.setData('text/plain', '');

  const dragStart = new DragEvent('dragstart', {
    bubbles: true,
    cancelable: true,
    dataTransfer: dataTransfer
  });

  const dragEnter = new DragEvent('dragenter', {
    bubbles: true,
    cancelable: true,
    dataTransfer: dataTransfer
  });

  const dragOver = new DragEvent('dragover', {
    bubbles: true,
    cancelable: true,
    dataTransfer: dataTransfer
  });

  const drop = new DragEvent('drop', {
    bubbles: true,
    cancelable: true,
    dataTransfer: dataTransfer
  });

  const dragEnd = new DragEvent('dragend', {
    bubbles: true,
    cancelable: true,
    dataTransfer: dataTransfer
  });

  source.dispatchEvent(dragStart);

  return new Promise(resolve => {
    setTimeout(() => {
      target.dispatchEvent(dragEnter);
      setTimeout(() => {
        target.dispatchEvent(dragOver);
        setTimeout(() => {
          target.dispatchEvent(drop);
          setTimeout(() => {
            source.dispatchEvent(dragEnd);
            resolve('HTML5 drag complete: ' + sourceSelector + ' -> ' + targetSelector);
          }, delay);
        }, delay);
      }, delay);
    }, delay);
  });
})('${sourceSelector}', '${targetSelector}', ${delay})
`;

const dragMouse = `
(function(sourceSelector, targetSelector, delay, offsetX, offsetY) {
  const source = document.querySelector(sourceSelector);
  const target = document.querySelector(targetSelector);

  if (!source) return 'Error: Source element not found: ' + sourceSelector;
  if (!target) return 'Error: Target element not found: ' + targetSelector;

  const sourceRect = source.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();

  const startX = sourceRect.left + sourceRect.width / 2 + offsetX;
  const startY = sourceRect.top + sourceRect.height / 2 + offsetY;
  const endX = targetRect.left + targetRect.width / 2;
  const endY = targetRect.top + targetRect.height / 2;

  const mouseDown = new MouseEvent('mousedown', {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX: startX,
    clientY: startY,
    button: 0
  });

  const mouseMove = new MouseEvent('mousemove', {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX: endX,
    clientY: endY,
    button: 0
  });

  const mouseUp = new MouseEvent('mouseup', {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX: endX,
    clientY: endY,
    button: 0
  });

  source.dispatchEvent(mouseDown);

  return new Promise(resolve => {
    setTimeout(() => {
      document.dispatchEvent(mouseMove);
      setTimeout(() => {
        document.dispatchEvent(mouseUp);
        resolve('Mouse drag complete: ' + sourceSelector + ' -> ' + targetSelector);
      }, delay);
    }, delay);
  });
})('${sourceSelector}', '${targetSelector}', ${delay}, ${offsetX}, ${offsetY})
`;

// Get element positions for native drag
const getPositionsExpr = `
(function(sourceSelector, targetSelector, offsetX, offsetY) {
  const source = document.querySelector(sourceSelector);
  const target = document.querySelector(targetSelector);

  if (!source) return JSON.stringify({ error: 'Source element not found: ' + sourceSelector });
  if (!target) return JSON.stringify({ error: 'Target element not found: ' + targetSelector });

  const sourceRect = source.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();

  return JSON.stringify({
    startX: sourceRect.left + sourceRect.width / 2 + offsetX,
    startY: sourceRect.top + sourceRect.height / 2 + offsetY,
    endX: targetRect.left + targetRect.width / 2,
    endY: targetRect.top + targetRect.height / 2
  });
})('${sourceSelector}', '${targetSelector}', ${offsetX}, ${offsetY})
`;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function nativeDrag(ws, startX, startY, endX, endY, delay, steps) {
  const send = (msg) => ws.send(JSON.stringify(msg));

  // Mouse pressed at start position
  send({
    id: 1,
    method: 'Input.dispatchMouseEvent',
    params: { type: 'mousePressed', x: startX, y: startY, button: 'left', clickCount: 1 }
  });

  await sleep(delay);

  // Move mouse in steps from start to end
  for (let i = 1; i <= steps; i++) {
    const progress = i / steps;
    const x = startX + (endX - startX) * progress;
    const y = startY + (endY - startY) * progress;

    send({
      id: 10 + i,
      method: 'Input.dispatchMouseEvent',
      params: { type: 'mouseMoved', x, y, button: 'left' }
    });

    await sleep(delay / steps);
  }

  await sleep(delay);

  // Mouse released at end position
  send({
    id: 2,
    method: 'Input.dispatchMouseEvent',
    params: { type: 'mouseReleased', x: endX, y: endY, button: 'left' }
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

  if (dragType === 'native') {
    // Native drag using CDP Input domain
    ws.on('open', async () => {
      // First get the positions
      ws.send(JSON.stringify({ id: 100, method: 'Runtime.evaluate', params: { expression: getPositionsExpr } }));
    });

    ws.on('message', async (data) => {
      const msg = JSON.parse(data);
      if (msg.id === 100) {
        if (msg.result?.exceptionDetails) {
          console.error('Error:', msg.result.exceptionDetails.exception?.description || msg.result.exceptionDetails.text);
          ws.close();
          return;
        }

        const positions = JSON.parse(msg.result.result.value);
        if (positions.error) {
          console.error('Error:', positions.error);
          ws.close();
          return;
        }

        // Execute native drag
        await nativeDrag(ws, positions.startX, positions.startY, positions.endX, positions.endY, delay, steps);

        // Wait a bit then close
        await sleep(100);
        console.log('Native drag complete: ' + sourceSelector + ' -> ' + targetSelector);
        ws.close();
      }
    });
  } else {
    // HTML5 or synthetic mouse events
    const expr = dragType === 'mouse' ? dragMouse : dragHTML5;

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
  }

  ws.on('close', () => process.exit(0));
  ws.on('error', (err) => { console.error('WS error:', err.message); process.exit(1); });
  setTimeout(() => { console.error('Timeout'); process.exit(1); }, 15000);
}

main().catch(err => { console.error(err.message); process.exit(1); });
