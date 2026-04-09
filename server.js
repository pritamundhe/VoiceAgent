const express = require('express');
const { WebSocketServer, WebSocket } = require('ws');
const https = require('https');
const querystring = require('querystring');
require('dotenv').config();

const app = express();
const port = 3000;

// Add CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

app.use(express.static('public'));
app.use(express.json());

// ── Grammar Check proxy ──────────────────────────────────────────────────────
// Forwards text to the free LanguageTool public API and returns matches.
app.post('/api/grammar', (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) return res.json({ matches: [] });

  const body = querystring.stringify({
    text,
    language: 'en-US',
    disabledRules: 'WHITESPACE_RULE,PUNCTUATION_PARAGRAPH_END'
  });

  const options = {
    hostname: 'api.languagetool.org',
    path: '/v2/check',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(body)
    }
  };

  const ltReq = https.request(options, (ltRes) => {
    let raw = '';
    ltRes.on('data', (chunk) => raw += chunk);
    ltRes.on('end', () => {
      try {
        const data = JSON.parse(raw);
        res.json({ matches: data.matches || [] });
      } catch (e) {
        res.json({ matches: [] });
      }
    });
  });

  ltReq.on('error', (e) => {
    console.error('LanguageTool error:', e.message);
    res.json({ matches: [] });
  });

  ltReq.write(body);
  ltReq.end();
});

const server = app.listen(port, () => {
  console.log(`✅ Server listening at http://localhost:${port}`);
});

const wss = new WebSocketServer({ server });

wss.on('connection', (clientWs) => {
  console.log('📱 Browser client connected');

  const aaiUrl = `wss://streaming.assemblyai.com/v3/ws?sample_rate=16000&speech_model=u3-rt-pro`;

  const aaiWs = new WebSocket(aaiUrl, {
    headers: { Authorization: process.env.ASSEMBLYAI_API_KEY }
  });

  aaiWs.on('open', () => {
    console.log('🔗 Connected to AssemblyAI Universal Streaming');
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ type: 'ProxyOpened' }));
    }
  });

  aaiWs.on('message', (data, isBinary) => {
    console.log('📩 AssemblyAI msg:', isBinary ? '[binary]' : data.toString().substring(0, 200));
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(data, { binary: isBinary });
    }
  });

  aaiWs.on('close', (code, reason) => {
    const isNormal = code === 1000 || code === 1005 || code === 1001;
    if (isNormal) {
      console.log(`🏁 AssemblyAI Session Ended (Code: ${code})`);
    } else {
      console.log(`❌ AssemblyAI closed unexpectedly - Code: ${code}, Reason: ${reason.toString()}`);
    }
    if (clientWs.readyState === WebSocket.OPEN) clientWs.close(code);
  });

  aaiWs.on('error', (error) => {
    console.error('⚠️ AssemblyAI WS Error:', error.message);
    if (clientWs.readyState === WebSocket.OPEN) clientWs.close(1011, error.message);
  });

  clientWs.on('message', (data, isBinary) => {
    if (aaiWs.readyState === WebSocket.OPEN) {
      aaiWs.send(data, { binary: isBinary });
    }
  });

  clientWs.on('close', (code) => {
    console.log(`🔌 Browser client disconnected (code: ${code})`);
    if (aaiWs.readyState === WebSocket.OPEN) {
      try {
        aaiWs.send(JSON.stringify({ type: 'Terminate' }));
      } catch (e) {}
      setTimeout(() => {
        if (aaiWs.readyState !== WebSocket.CLOSED) aaiWs.close();
      }, 500);
    }
  });

  clientWs.on('error', (err) => {
    console.error('⚠️ Client WS error:', err.message);
  });
});
