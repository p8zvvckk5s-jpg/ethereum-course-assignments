import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9333;
const account = '0x0000000000000000000000000000000000000001';
const browser = spawn(chrome, [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  '--remote-allow-origins=*',
  '--user-data-dir=' + process.env.TEMP + `\\casino-ui-repro-${process.pid}`,
  '--no-first-run',
  '--disable-gpu',
  'about:blank',
], { stdio: 'ignore' });

const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function getJson(url) {
  for (let i = 0; i < 40; i++) {
    try { return await (await fetch(url)).json(); } catch { await pause(100); }
  }
  throw new Error('Chrome DevTools did not start');
}

let nextId = 1;
const pending = new Map();
try {
  const tabs = await getJson(`http://127.0.0.1:${port}/json`);
  const page = tabs.find(tab => tab.type === 'page');
  if (!page) throw new Error('No Chrome page target found');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });
  ws.addEventListener('message', event => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
    }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `
    (() => {
      const account = '0x0000000000000000000000000000000000000001';
      const word = n => '0x' + BigInt(n).toString(16).padStart(64, '0');
      const tuple = (...items) => '0x' + items.map(item => word(item).slice(2)).join('');
      const values = {
        '0x8cd221c9': word(1),
        '0xc38a8afd': word(1000000000000000n),
        '0xe08a96cd': word(100),
        '0x2ca8c6d3': word(1),
        '0xfe5e1853': word(1000000000000000n),
        '0x8c65c81f': tuple(1, 1, 1000000000000000n, 0, 0, 0, 0, 0),
      };
      window.ethereum = {
        on() {}, removeListener() {},
        async request({ method, params = [] }) {
          if (method === 'eth_requestAccounts' || method === 'eth_accounts') return [account];
          if (method === 'eth_chainId') return '0xaa36a7';
          if (method === 'eth_blockNumber') return '0x1';
          if (method === 'eth_getCode') return '0x6000';
          if (method === 'eth_call') return values[params[0]?.data?.slice(0,10)] || word(1);
          throw new Error('Unexpected mocked RPC method: ' + method);
        }
      };
    })();
  ` });
  await send('Page.navigate', { url: 'http://127.0.0.1:8088/' });
  await pause(1200);
  await send('Runtime.evaluate', { expression: `[...document.querySelectorAll('button')].find(x => x.textContent.includes('Connect Sepolia wallet'))?.click()` });
  await pause(1200);
  const result = await send('Runtime.evaluate', {
    expression: `JSON.stringify({text: document.body.innerText, status: document.querySelector('#status')?.textContent, cards: [...document.querySelectorAll('.metric strong')].map(x => x.textContent)})`,
    returnByValue: true,
  });
  const state = JSON.parse(result.result.value);
  const connected = state.text.includes(account);
  const loaded = !state.cards.some(value => value.trim() === '—') && state.cards.length >= 3;
  console.log(JSON.stringify({ connected, loaded, cards: state.cards, status: state.status }, null, 2));
  assert.equal(connected, true, 'wallet account should be displayed after connecting');
  assert.equal(loaded, true, 'round, bet count, and pot must load after connecting');
  ws.close();
} finally {
  browser.kill();
}
