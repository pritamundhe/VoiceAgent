const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const transcriptEl = document.getElementById('transcript');
const currentTurnEl = document.getElementById('currentTurn');
const statusText = document.getElementById('statusText');
const recordingDot = document.getElementById('recordingDot');
const fillerTotal = document.getElementById('fillerTotal');
const statWords = document.getElementById('statWords');
const statDuration = document.getElementById('statDuration');
const statWpm = document.getElementById('statWpm');
const statGrammar = document.getElementById('statGrammar');
const statFluency = document.getElementById('statFluency');
const gaugeProgress = document.getElementById('gaugeProgress');
const grammarChecking = document.getElementById('grammarChecking');
const grammarList = document.getElementById('grammarList');
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const modeBadge = document.getElementById('modeBadge');

const SAMPLE_RATE = 16000;
const FILLER_WORDS = ['um', 'uh', 'like', 'actually', 'basically'];

let ws = null;
let audioContext = null;
let mediaStream = null;
let scriptProcessor = null;
let proxyReady = false;

// ── Silence-detection state ────────────────────────────────────────────────
// Transcription is only committed after SILENCE_THRESHOLD ms of no new speech.
const SILENCE_THRESHOLD = 4000; // 4 seconds
let silenceTimer = null;         // setTimeout handle
let pendingFinalText = '';       // accumulated final text waiting to be committed

// Filler state
let fillerCounts = {};
let totalFillers = 0;

// Speaking speed state
let totalWords = 0;
let recordingStartTime = null;
let durationTimer = null;

// Grammar state
let totalGrammarErrors = 0;
let transcriptSegments = []; // Store segments in order: { index, html, processed }
let segmentCounter = 0;

// Visualization state
let paceChart = null;
let paceData = [];
let paceLabels = [];

const resetFillers = () => {
    fillerCounts = Object.fromEntries(FILLER_WORDS.map(w => [w, 0]));
    totalFillers = 0;
    FILLER_WORDS.forEach(w => {
        document.getElementById(`count-${w}`).textContent = '0';
        document.getElementById(`pill-${w}`).classList.remove('active');
    });
    fillerTotal.textContent = '0 total';
    fillerTotal.classList.remove('has-fillers');
};

/**
 * Wrap filler words in a text string with <mark class="filler"> tags.
 * Matches whole words only, case-insensitively.
 */
const highlightFillers = (text) => {
    const escaped = FILLER_WORDS.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
    return text.replace(regex, '<mark class="filler">$1</mark>');
};

/**
 * Count new filler occurrences in a text string and update the UI.
 */
const countFillers = (text) => {
    const escaped = FILLER_WORDS.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
        const word = match[1].toLowerCase();
        fillerCounts[word]++;
        totalFillers++;
        document.getElementById(`count-${word}`).textContent = fillerCounts[word];
        document.getElementById(`pill-${word}`).classList.add('active');
    }
    fillerTotal.textContent = `${totalFillers} total`;
    if (totalFillers > 0) fillerTotal.classList.add('has-fillers');
    updateFluencyScore();
};

// ── Speaking Speed helpers ──
const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

const resetStats = () => {
    totalWords = 0;
    totalGrammarErrors = 0;
    recordingStartTime = null;
    if (durationTimer) { clearInterval(durationTimer); durationTimer = null; }
    statWords.textContent = '0';
    statDuration.textContent = '0:00';
    statWpm.textContent = '\u2014';
    statGrammar.textContent = '0';
    statFluency.textContent = '100';
    statFluency.removeAttribute('data-score');
    updateGauge(100);
    statGrammar.classList.remove('has-errors');
    
    // Reset Charts
    paceData = [];
    paceLabels = [];
    if (paceChart) paceChart.update();
    statWords.classList.remove('live');
    statDuration.classList.remove('live');
    statWpm.classList.remove('live');
    // Reset grammar panel
    grammarList.innerHTML = '<span class="grammar-empty">Issues will appear here after each sentence.</span>';
    grammarChecking.textContent = '';
    grammarChecking.className = 'grammar-status';
    
    transcriptSegments = [];
    segmentCounter = 0;

    // Reset silence-detection state
    if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer = null; }
    pendingFinalText = '';

    const diffPanel = document.getElementById('diffPanel');
    const diffContainer = document.getElementById('diffContainer');
    if (diffPanel) diffPanel.innerHTML = '';
    if (diffContainer) diffContainer.style.display = 'none';
};

const startDurationTimer = () => {
    recordingStartTime = Date.now();
    statWords.classList.add('live');
    statDuration.classList.add('live');
    statWpm.classList.add('live');
    durationTimer = setInterval(() => {
        const elapsed = (Date.now() - recordingStartTime) / 1000;
        statDuration.textContent = formatDuration(elapsed);
        updateWpm(elapsed);
    }, 1000);
};

const updateWordCount = (text) => {
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    totalWords += words.length;
    statWords.textContent = totalWords;
    const elapsed = (Date.now() - recordingStartTime) / 1000;
    updateWpm(elapsed);
};

const updateWpm = (elapsedSeconds) => {
    if (elapsedSeconds < 3 || totalWords === 0) {
        statWpm.textContent = '\u2014';
        return;
    }
    const wpm = Math.round(totalWords / (elapsedSeconds / 60));
    statWpm.textContent = wpm;
    
    // Update Pace Chart
    const timeLabel = formatDuration(elapsedSeconds);
    paceLabels.push(timeLabel);
    paceData.push(wpm);
    if (paceLabels.length > 20) {
        paceLabels.shift();
        paceData.shift();
    }
    if (paceChart) paceChart.update();

    updateFluencyScore();
};

const updateGauge = (score) => {
    if (!gaugeProgress) return;
    const offset = 100 - score;
    gaugeProgress.style.strokeDasharray = `${score}, 100`;
};

const initCharts = () => {
    const paceCtx = document.getElementById('paceChart').getContext('2d');
    paceChart = new Chart(paceCtx, {
        type: 'line',
        data: {
            labels: paceLabels,
            datasets: [{
                label: 'Words Per Minute',
                data: paceData,
                borderColor: '#d4d4d4',
                backgroundColor: 'rgba(212, 212, 212, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { display: false },
                y: { 
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#666', font: { size: 10 } }
                }
            }
        }
    });
};


const updateFluencyScore = () => {
    let score = 100;

    // Deduct for fillers (-2 each)
    score -= (totalFillers * 2);

    // Deduct for grammar errors (-5 each)
    score -= (totalGrammarErrors * 5);

    // Deduct for WPM (Speech Pace)
    // Target: 110 - 180 WPM
    const wpmText = statWpm.textContent;
    if (wpmText !== '\u2014') {
        const wpm = parseInt(wpmText);
        if (wpm < 90 || wpm > 200) {
            score -= 20; // Very slow or very fast
        } else if (wpm < 110 || wpm > 180) {
            score -= 10; // Slightly off pace
        }
    }

    score = Math.max(0, score);
    statFluency.textContent = score;
    updateGauge(score);

    // Apply color-coding
    if (score >= 90) statFluency.setAttribute('data-score', 'excellent');
    else if (score >= 75) statFluency.setAttribute('data-score', 'good');
    else if (score >= 50) statFluency.setAttribute('data-score', 'average');
    else statFluency.setAttribute('data-score', 'poor');
};

const setStatus = (text, isRecording = false) => {
    statusText.innerText = text;
    recordingDot.classList.toggle('recording', isRecording);
};

// ── Grammar Check ─────────────────────────────────────────────────────────────
/**
 * Calls the server-side LanguageTool proxy, underlines errors in the most
 * recently appended transcript segment, and appends items to the grammar list.
 * @param {string} text – the raw final transcript text
 * @param {number} segmentStart – character offset in transcriptEl.innerHTML
 *                                where this segment starts (used to apply underlines)
 */
const checkGrammar = async (text, segmentIndex) => {
    grammarChecking.textContent = 'Checking…';
    grammarChecking.className = 'grammar-status checking';

    try {
        const res = await fetch('/api/grammar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        const { matches } = await res.json();

        grammarChecking.textContent = '';
        grammarChecking.className = 'grammar-status';

        let underlinedHtml = '';
        if (!matches || matches.length === 0) {
            underlinedHtml = highlightFillers(escapeHtml(text));
        } else {
            totalGrammarErrors += matches.length;
            statGrammar.textContent = totalGrammarErrors;
            statGrammar.classList.add('has-errors');

            let diffOriginalHtml = '';
            let diffCorrectedHtml = '';
            let lastOffset = 0;

            const sortedLtoR = [...matches].sort((a, b) => a.offset - b.offset);

            for (const m of sortedLtoR) {
                const beforeText = text.slice(lastOffset, m.offset);
                const escapedBefore = escapeHtml(beforeText);
                
                underlinedHtml += escapedBefore;
                diffOriginalHtml += escapedBefore;
                diffCorrectedHtml += escapedBefore;

                const badText = text.slice(m.offset, m.offset + m.length);
                const escapedBad = escapeHtml(badText);

                const suggestion = m.replacements && m.replacements.length > 0
                    ? m.replacements[0].value : badText;
                const escapedSuggestion = escapeHtml(suggestion);

                underlinedHtml += `<span class="grammar-error" title="${escapeHtml(m.message)}">${escapedBad}</span>`;
                diffOriginalHtml += `<span class="diff-orig-word">${escapedBad}</span>`;
                diffCorrectedHtml += `<span class="diff-corr-word">${escapedSuggestion}</span>`;

                lastOffset = m.offset + m.length;
            }

            const afterText = text.slice(lastOffset);
            const escapedAfter = escapeHtml(afterText);
            underlinedHtml += escapedAfter;
            diffOriginalHtml += escapedAfter;
            diffCorrectedHtml += escapedAfter;

            // Render Analyzed Diff card
            const diffPanel = document.getElementById('diffPanel');
            const diffContainer = document.getElementById('diffContainer');
            if (diffPanel && diffContainer) {
                diffContainer.style.display = 'block';
                const diffCard = document.createElement('div');
                diffCard.className = 'diff-card';
                diffCard.innerHTML = `
                    <div class="diff-original">${diffOriginalHtml}</div>
                    <div class="diff-corrected">${diffCorrectedHtml}</div>
                `;
                diffPanel.appendChild(diffCard);
            }

            // Add each match to the grammar list
            const placeholder = grammarList.querySelector('.grammar-empty');
            if (placeholder) placeholder.remove();

            for (const m of matches) {
                const item = document.createElement('div');
                item.className = 'grammar-item';
                const badWord = text.slice(m.offset, m.offset + m.length);
                const suggestion = m.replacements && m.replacements.length > 0
                    ? m.replacements[0].value : null;
                item.innerHTML = `
                    <span class="grammar-bad">${escapeHtml(badWord)}</span>
                    ${suggestion ? `<span class="grammar-arrow">→</span><span class="grammar-fix">${escapeHtml(suggestion)}</span>` : ''}
                    <span class="grammar-msg">${escapeHtml(m.message)}</span>
                `;
                grammarList.appendChild(item);
            }
            updateFluencyScore();
        }

        // Add to segments and flush in order
        transcriptSegments[segmentIndex] = { html: underlinedHtml, processed: true };
        flushSegments();

    } catch (e) {
        console.error('Grammar check failed:', e);
        grammarChecking.textContent = '';
        grammarChecking.className = 'grammar-status';
        // Fallback: append original text
        transcriptSegments[segmentIndex] = { html: highlightFillers(escapeHtml(text)), processed: true };
        flushSegments();
    }
};

let nextFlushIndex = 0;
const flushSegments = () => {
    while (transcriptSegments[nextFlushIndex] && transcriptSegments[nextFlushIndex].processed) {
        // Prepend each segment so newest appears at the top
        transcriptEl.insertAdjacentHTML(
            'afterbegin',
            `<div class="transcript-segment">${transcriptSegments[nextFlushIndex].html}</div>`
        );
        nextFlushIndex++;
    }
};

const escapeHtml = (str) => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Commit whatever pendingFinalText has accumulated: run grammar check,
 * update word count & fillers, and clear the pending buffer.
 */
const commitPending = () => {
    if (!pendingFinalText.trim()) return;
    const text = pendingFinalText.trim();
    pendingFinalText = '';

    countFillers(text);
    updateWordCount(text);

    const currentIndex = segmentCounter++;
    checkGrammar(text, currentIndex);

    // Clear the live preview
    currentTurnEl.textContent = '';
};

/**
 * Reset (or start) the silence countdown.
 * Called whenever any speech activity is detected (interim or final).
 */
const resetSilenceTimer = () => {
    if (silenceTimer) clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => {
        silenceTimer = null;
        commitPending();
    }, SILENCE_THRESHOLD);
};

const cleanup = () => {
    // Flush any pending final text immediately on stop
    if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer = null; }
    commitPending();

    stopBtn.disabled = true;
    startBtn.disabled = false;
    proxyReady = false;

    if (scriptProcessor) {
        try { scriptProcessor.disconnect(); } catch(e) {}
        scriptProcessor = null;
    }
    if (audioContext) {
        try { audioContext.close(); } catch(e) {}
        audioContext = null;
    }
    if (mediaStream) {
        mediaStream.getTracks().forEach(t => t.stop());
        mediaStream = null;
    }
    if (ws && ws.readyState !== WebSocket.CLOSED) {
        try { ws.close(); } catch(e) {}
        ws = null;
    }
    if (durationTimer) { clearInterval(durationTimer); durationTimer = null; }
    statWords.classList.remove('live');
    statDuration.classList.remove('live');
    statWpm.classList.remove('live');
    setStatus('Ready to record', false);
};

const startMicrophone = async () => {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: SAMPLE_RATE });

    const source = audioContext.createMediaStreamSource(mediaStream);
    scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);

    scriptProcessor.onaudioprocess = (event) => {
        if (!proxyReady || !ws || ws.readyState !== WebSocket.OPEN) return;

        const inputData = event.inputBuffer.getChannelData(0);
        const pcm = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            pcm[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        ws.send(pcm.buffer);
    };

    source.connect(scriptProcessor);
    scriptProcessor.connect(audioContext.destination);
};

startBtn.addEventListener('click', async () => {
    try {
        startBtn.disabled = true;

        // Reset transcript and filler counts
        transcriptEl.innerHTML = '';
        currentTurnEl.textContent = '';
        resetFillers();
        resetStats();

        setStatus('Connecting...', false);

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        ws = new WebSocket(`${protocol}//${window.location.host}/`);
        ws.binaryType = 'arraybuffer';

        ws.onopen = () => console.log('[WS] Connected to proxy');

        ws.onmessage = async (event) => {
            if (event.data instanceof ArrayBuffer) return;

            let message;
            try { message = JSON.parse(event.data); }
            catch(e) { return; }

            console.log('[WS msg]', message.type || message.message_type,
                JSON.stringify(message).substring(0, 200));

            if (message.type === 'ProxyOpened') {
                setStatus('Requesting mic...', false);
                try {
                    await startMicrophone();
                    proxyReady = true;
                    startDurationTimer();
                    setStatus('Recording...', true);
                    stopBtn.disabled = false;
                } catch(err) {
                    alert('Could not access microphone: ' + err.message);
                    cleanup();
                }

            } else if (message.type === 'Turn') {
                const text = message.transcript || '';
                const isFinal = message.turn_is_formatted === true;

                if (isFinal && text) {
                    // Accumulate final text — but DON'T commit yet.
                    // Keep appending so multi-sentence turns are captured fully.
                    pendingFinalText = text;

                    // Show the finalised text in the live preview while waiting
                    currentTurnEl.textContent = '⏳ ' + text;

                    // Any speech activity resets the silence countdown
                    resetSilenceTimer();

                } else if (text) {
                    // Interim/partial result — show live, reset silence timer
                    currentTurnEl.textContent = text;
                    resetSilenceTimer();
                }

            } else if (message.type === 'Termination') {
                cleanup();

            } else if (message.error) {
                console.error('AssemblyAI Error:', message.error);
                setStatus('Error: ' + message.error, false);
                cleanup();
            }
        };

        ws.onerror = () => { setStatus('Connection Error', false); cleanup(); };
        ws.onclose = (e) => { console.log('[WS] Closed', e.code); cleanup(); };

    } catch (err) {
        console.error('Start failed:', err);
        alert('Could not start: ' + err.message);
        cleanup();
        startBtn.disabled = false;
    }
});

// Theme Toggle Logic
const setTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    if (theme === 'light') {
        themeIcon.innerHTML = `
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        `;
    } else {
        themeIcon.innerHTML = `
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        `;
    }
};

const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
setTheme(savedTheme);

themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    setTheme(currentTheme === 'light' ? 'dark' : 'light');
});

// Practice Mode Logic
const urlParams = new URLSearchParams(window.location.search);
const modeParam = urlParams.get('mode');
if (modeParam && modeBadge) {
    modeBadge.style.display = 'inline-flex';
    modeBadge.textContent = modeParam.replace(/-/g, ' ');
}

// Initialize charts on load
initCharts();

stopBtn.addEventListener('click', () => {
    setStatus('Stopping...', false);
    cleanup();
});
