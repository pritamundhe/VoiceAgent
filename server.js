const express = require('express');
const { WebSocketServer, WebSocket } = require('ws');
const https = require('https');
const http = require('http');
const querystring = require('querystring');
const url = require('url');
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

// ── WebSocket Server (handles multiple paths) ────────────────────────────────
const wss = new WebSocketServer({ noServer: true });
const autocompleteWss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const { pathname } = url.parse(request.url);
  if (pathname === '/autocomplete') {
    autocompleteWss.handleUpgrade(request, socket, head, (ws) => {
      autocompleteWss.emit('connection', ws, request);
    });
  } else {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
});

// ── DeepSeek Autocomplete (ultra-low latency) ────────────────────────────────
// DeepSeek V3 (deepseek-chat) via OpenAI-compatible API at api.deepseek.com
function callGroqAutocomplete(transcript) {
  return new Promise((resolve) => {
    const DS_KEY = process.env.DEEPSEEK_API_KEY;
    if (!DS_KEY) {
      console.error('[Autocomplete] ❌ DEEPSEEK_API_KEY not set in .env');
      return resolve('');
    }

    const systemPrompt = `You are a real-time speech autocomplete assistant.
The user is speaking aloud and has paused mid-sentence. Predict the single most natural 3-7 word continuation.
Rules:
- Output ONLY the next words — no punctuation at the start, no explanation, no quotes
- Max 7 words
- Sound like natural spoken English
- If the sentence already sounds complete, reply with exactly: [COMPLETE]
- Never repeat what was already said`;

    const bodyPayload = JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Speech so far: "${transcript}"\n\nComplete it (3-7 words):` }
      ],
      max_tokens: 25,
      temperature: 0.3,
      stream: false
    });

    const options = {
      hostname: 'api.deepseek.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DS_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyPayload)
      }
    };

    console.log(`[Autocomplete] 🚀 DeepSeek request for: "...${transcript.slice(-60)}"`);

    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => raw += chunk);
      res.on('end', () => {
        console.log(`[Autocomplete] 📡 DeepSeek status: ${res.statusCode}`);
        try {
          const data = JSON.parse(raw);
          if (data.error) {
            console.error('[Autocomplete] ❌ DeepSeek API error:', data.error);
            return resolve('');
          }
          const text = data.choices?.[0]?.message?.content?.trim() || '';
          console.log(`[Autocomplete] ✅ Suggestion: "${text}"`);
          if (text === '[COMPLETE]' || !text) return resolve('');
          resolve(text);
        } catch (e) {
          console.error('[Autocomplete] ❌ Parse error:', e.message, '| raw:', raw.slice(0, 200));
          resolve('');
        }
      });
    });

    req.on('error', (e) => {
      console.error('[Autocomplete] ❌ HTTPS error:', e.message);
      resolve('');
    });

    req.write(bodyPayload);
    req.end();
  });
}


autocompleteWss.on('connection', (ws) => {
  console.log('[Autocomplete] 🤖 Client connected');
  let debounceTimer = null;
  let lastTranscript = '';
  let isFetching = false;

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      console.log('[Autocomplete] 📨 Received msg type:', msg.type, '| text length:', msg.text?.length || 0);
      if (msg.type === 'transcript' && msg.text) {
        const text = msg.text.trim();
        if (text === lastTranscript) return;
        lastTranscript = text;

        // Clear existing ghost text immediately on new input
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ghost', text: '', loading: true }));
        }

        // Debounce: wait for a 750ms pause before calling Groq
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
          const wordCount = text.split(/\s+/).filter(Boolean).length;
          console.log(`[Autocomplete] ⏱ Debounce fired | words: ${wordCount} | fetching: ${isFetching}`);
          if (isFetching || !text || wordCount < 2) {
            console.log('[Autocomplete] ⏭ Skipping — too short or already fetching');
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ghost', text: '', loading: false }));
            }
            return;
          }
          isFetching = true;
          try {
            const suggestion = await callGroqAutocomplete(text);
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ghost', text: suggestion, loading: false }));
            }
          } catch (e) {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ghost', text: '', loading: false }));
            }
          } finally {
            isFetching = false;
          }
        }, 750);
      } else if (msg.type === 'clear') {
        if (debounceTimer) clearTimeout(debounceTimer);
        lastTranscript = '';
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ghost', text: '', loading: false }));
        }
      }
    } catch (e) {}
  });

  ws.on('close', () => {
    console.log('🤖 Autocomplete client disconnected');
    if (debounceTimer) clearTimeout(debounceTimer);
  });
  ws.on('error', (err) => console.error('Autocomplete WS error:', err.message));
});

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
