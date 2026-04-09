'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

const SAMPLE_RATE = 16000;
const FILLER_WORDS = ['um', 'uh', 'like', 'actually', 'basically'];

export default function useRecorder(mode = '', prompt = '', taskType = '') {
    const [isRecording, setIsRecording] = useState(false);
    const [status, setStatus] = useState('Ready to record');
    const [transcript, setTranscript] = useState('');
    const [currentTurn, setCurrentTurn] = useState('');
    
    // Analytics State
    const [fillerCounts, setFillerCounts] = useState(Object.fromEntries(FILLER_WORDS.map(w => [w, 0])));
    const [totalFillers, setTotalFillers] = useState(0);
    const [totalWords, setTotalWords] = useState(0);
    const [duration, setDuration] = useState(0);
    const [grammarErrors, setGrammarErrors] = useState(0);
    const wordTimestampsRef = useRef([]);
    const [grammarSuggestions, setGrammarSuggestions] = useState([]);
    const [paceHistory, setPaceHistory] = useState({ labels: [], data: [] });
    
    // Derived Stats
    const wpm = duration > 0 ? Math.round(totalWords / (duration / 60)) : 0;
    
    const fluency = useMemo(() => {
        let score = 100;
        score -= (totalFillers * 2);
        score -= (grammarErrors * 5);
        if (wpm > 0 && (wpm < 110 || wpm > 180)) score -= 10;
        return Math.max(0, score);
    }, [totalFillers, grammarErrors, wpm]);

    const [liveAnalysis, setLiveAnalysis] = useState({
        energy: 0,
        stability: 100,
        pauseQuality: 100,
        clarity: 100,
        liveWpm: 0,
        confidence: 100,
        sentiment: 0,  // DistilBERT Sentiment
        emotion: 'neu' // SpeechBrain Emotion
    });

    // AI Feedback & Chat History State
    const [chatHistory, setChatHistory] = useState([]); // { role: 'user' | 'ai', content: '' }
    const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
    
    // Live Ref for periodic analysis
    const lastSentimentTextRef = useRef('');
    const mediaRecorderRef = useRef(null);

    const wsRef = useRef(null);
    const audioContextRef = useRef(null);
    const mediaStreamRef = useRef(null);
    const scriptProcessorRef = useRef(null);
    const proxyReadyRef = useRef(false);
    const startTimeRef = useRef(null);
    const durationIntervalRef = useRef(null);
    const pauseTimeoutRef = useRef(null);
    const analyserRef = useRef(null);
    const lastAudioTimeRef = useRef(Date.now());
    
    // Accumulate distinct sentences so they aren't overwritten
    const committedTurnsRef = useRef([]);
    const lastTurnTextRef = useRef('');

    const cleanup = useCallback(() => {
        setIsRecording(false);
        proxyReadyRef.current = false;
        if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);

        if (scriptProcessorRef.current) {
            try { scriptProcessorRef.current.disconnect(); } catch (e) {}
            scriptProcessorRef.current = null;
        }
        if (audioContextRef.current) {
            try { audioContextRef.current.close(); } catch (e) {}
            audioContextRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(t => t.stop());
            mediaStreamRef.current = null;
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            try { mediaRecorderRef.current.stop(); } catch (e) {}
            mediaRecorderRef.current = null;
        }
        if (analyserRef.current) {
            analyserRef.current = null;
        }
        if (wsRef.current) {
            if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
                try { wsRef.current.close(); } catch (e) {}
            }
            wsRef.current = null;
        }
        setStatus('Ready to record');
    }, []);

    const countFillers = useCallback((text) => {
        const escaped = FILLER_WORDS.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        const regex = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
        let match;
        let found = 0;
        const newCounts = { ...fillerCounts };
        
        while ((match = regex.exec(text)) !== null) {
            const word = match[1].toLowerCase();
            newCounts[word]++;
            found++;
        }
        
        if (found > 0) {
            setFillerCounts(newCounts);
            setTotalFillers(prev => prev + found);
        }
    }, [fillerCounts]);

    const checkGrammar = useCallback(async (text) => {
        try {
            const res = await fetch('/api/grammar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });
            if (!res.ok) throw new Error('Grammar service returned ' + res.status);
            const { matches } = await res.json();
            if (matches && matches.length > 0) {
                setGrammarErrors(prev => prev + matches.length);
                setGrammarSuggestions(prev => [...prev, ...matches.map(m => ({
                    bad: text.slice(m.offset, m.offset + m.length),
                    fix: m.replacements?.[0]?.value || null,
                    msg: m.message
                }))]);
            }
        } catch (e) {
            console.error('Grammar check failed:', e);
        }
    }, []);

    const updateWordCount = useCallback((text) => {
        const words = text.trim().split(/\s+/).filter(w => w.length > 0);
        setTotalWords(prev => prev + words.length);
        
        // Track timestamps for LiveWPM
        const now = Date.now();
        const newTimestamps = words.map(() => now);
        wordTimestampsRef.current = [...wordTimestampsRef.current, ...newTimestamps];
    }, []);

    useEffect(() => {
        if (duration > 0 && duration % 2 === 0) {
            setPaceHistory(prev => {
                // If the last label was the same second, don't add again
                const label = `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`;
                if (prev.labels[prev.labels.length - 1] === label) return prev;
                
                const newLabels = [...prev.labels, label];
                const newData = [...prev.data, wpm];
                return {
                    labels: newLabels.slice(-20),
                    data: newData.slice(-20)
                };
            });
        }
    }, [duration]); // Only depend on duration

    useEffect(() => {
        // Send to distilbert every 3 seconds if transcript changed
        const interval = setInterval(async () => {
             const currentText = (transcript + ' ' + currentTurn).trim();
             if (currentText && currentText.length > 10 && currentText !== lastSentimentTextRef.current) {
                 lastSentimentTextRef.current = currentText;
                 // Get last 20 words so we aren't analyzing a massive paragraph
                 const chunk = currentText.split(' ').slice(-20).join(' ');
                 try {
                     const res = await fetch('/api/analyze-sentiment', {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/json' },
                         body: JSON.stringify({ text: chunk })
                     });
                     if (res.ok) {
                         const data = await res.json();
                         if (data.sentiment) {
                             // "POSITIVE" or "NEGATIVE", mapping to a score 0-100
                             const isPositive = data.sentiment.label === 'POSITIVE';
                             const scoreVal = Math.round(data.sentiment.score * 100);
                             setLiveAnalysis(prev => ({
                                 ...prev,
                                 sentiment: isPositive ? scoreVal : -scoreVal
                             }));
                         }
                     }
                 } catch (e) {}
             }
        }, 3000);

        return () => clearInterval(interval);
    }, [transcript, currentTurn]);

    useEffect(() => {
        // Update live analysis slow metrics
        setLiveAnalysis(prev => {
            // Stability: based on paceHistory variance
            let stability = 100;
            if (paceHistory.data.length > 2) {
                const mean = paceHistory.data.reduce((a, b) => a + b, 0) / paceHistory.data.length;
                const variance = paceHistory.data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / paceHistory.data.length;
                stability = Math.max(0, 100 - (Math.sqrt(variance) / 2));
            }

            // Clarity: based on filler ratio
            const fillerRatio = totalWords > 0 ? (totalFillers / totalWords) : 0;
            const clarity = Math.max(0, 100 - (fillerRatio * 500));

            // Live WPM: Rate over last 5 seconds
            const now = Date.now();
            wordTimestampsRef.current = wordTimestampsRef.current.filter(ts => now - ts < 5000);
            const liveWpm = Math.round((wordTimestampsRef.current.length / 5) * 60);

            return {
                ...prev,
                stability: Math.round(stability),
                clarity: Math.round(clarity),
                liveWpm,
                confidence: Math.round((stability + clarity + prev.energy + prev.pauseQuality) / 4)
            };
        });
    }, [totalWords, totalFillers, paceHistory.data]); // No wpm or liveAnalysis in deps

    const startRecording = useCallback(async () => {
        try {
            // DO NOT reset session states here—allow resuming!
            // E.g. we want to keep totalWords, duration, chatHistory, etc.
            
            // We just reset transcript and currentTurn so AssemblyAI starts a fresh block 
            // of text for this specific recording burst, but we leave the chatHistory alone
            setTranscript('');
            setCurrentTurn('');
            committedTurnsRef.current = [];
            lastTurnTextRef.current = '';
            setStatus('Connecting...');

            const wsUrl = `ws://${window.location.hostname}:3000/`;
            wsRef.current = new WebSocket(wsUrl);
            wsRef.current.binaryType = 'arraybuffer';

            wsRef.current.onopen = () => console.log('[WS] Connected to proxy');

            wsRef.current.onmessage = async (event) => {
                if (event.data instanceof ArrayBuffer) return;

                let message;
                try { message = JSON.parse(event.data); }
                catch (e) { return; }

                if (message.type === 'ProxyOpened') {
                    setStatus('Requesting mic...');
                    try {
                        mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
                        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: SAMPLE_RATE });
                        const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
                        
                        // Add Analyser
                        analyserRef.current = audioContextRef.current.createAnalyser();
                        analyserRef.current.fftSize = 256;
                        source.connect(analyserRef.current);

                        scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
                        const bufferLength = analyserRef.current.frequencyBinCount;
                        const dataArray = new Uint8Array(bufferLength);

                        scriptProcessorRef.current.onaudioprocess = (event) => {
                            if (!proxyReadyRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
                            
                            // Real-time Energy/Volume Calculation
                            if (analyserRef.current) {
                                analyserRef.current.getByteTimeDomainData(dataArray);
                                let sum = 0;
                                for (let i = 0; i < bufferLength; i++) {
                                    const v = (dataArray[i] / 128.0) - 1.0;
                                    sum += v * v;
                                }
                                const rms = Math.sqrt(sum / bufferLength);
                                const energy = Math.min(100, Math.round(rms * 500));
                                
                                // Pause Quality Detection
                                const now = Date.now();
                                if (energy > 10) {
                                    lastAudioTimeRef.current = now;
                                }
                                const silenceDuration = (now - lastAudioTimeRef.current) / 1000;
                                const pauseQuality = Math.max(0, 100 - (silenceDuration * 10));

                                setLiveAnalysis(prev => ({ 
                                    ...prev, 
                                    energy,
                                    pauseQuality: Math.round(pauseQuality)
                                }));
                            }

                            const inputData = event.inputBuffer.getChannelData(0);
                            const pcm = new Int16Array(inputData.length);
                            for (let i = 0; i < inputData.length; i++) {
                                const s = Math.max(-1, Math.min(1, inputData[i]));
                                pcm[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                            }
                            wsRef.current.send(pcm.buffer);
                        };
                        source.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(audioContextRef.current.destination);

                        proxyReadyRef.current = true;
                        setIsRecording(true);
                        setStatus('Recording...');
                        startTimeRef.current = Date.now();
                        
                        // Setup MediaRecorder for SpeechBrain Audio analysis
                        try {
                            mediaRecorderRef.current = new MediaRecorder(mediaStreamRef.current);
                            mediaRecorderRef.current.ondataavailable = async (e) => {
                                if (e.data.size > 0 && isRecording) {
                                    const reader = new FileReader();
                                    reader.readAsDataURL(e.data);
                                    reader.onloadend = async () => {
                                        const base64data = reader.result.split(',')[1];
                                        try {
                                            const res = await fetch('/api/analyze-audio', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ audioBase64: base64data })
                                            });
                                            if (res.ok) {
                                                const data = await res.json();
                                                if (data.emotions && data.emotions.length > 0) {
                                                    setLiveAnalysis(prev => ({ ...prev, emotion: data.emotions[0].label }));
                                                }
                                            }
                                        } catch (err) {}
                                    };
                                }
                            };
                            mediaRecorderRef.current.start(4000); // 4 seconds chunk
                        } catch (e) {
                            console.warn('MediaRecorder for SpeechBrain failed to start on this browser.', e);
                        }

                        // Capture the current duration so we can add to it instead of overwriting
                        const initialDuration = duration;
                        
                        durationIntervalRef.current = setInterval(() => {
                            setDuration(initialDuration + Math.floor((Date.now() - startTimeRef.current) / 1000));
                        }, 1000);
                    } catch (err) {
                        alert('Could not access microphone: ' + err.message);
                        cleanup();
                    }
                } else if (message.type === 'Turn') {
                    const text = message.transcript || '';
                    const isFinal = message.turn_is_formatted === true;

                    if (text) {
                        if (isFinal) {
                            const trimmedText = text.trim();
                            const prevText = lastTurnTextRef.current;
                            let isNewTurn = false;
                            
                            if (prevText.length > 0) {
                                const cleanTrimmed = trimmedText.toLowerCase().replace(/[^\w\s]/g, '');
                                const cleanPrev = prevText.toLowerCase().replace(/[^\w\s]/g, '');
                                const checkPrefix = cleanPrev.substring(0, 12);
                                
                                // If the incoming text shrinks dramatically, or completely changes, it's a new thought/turn.
                                if (trimmedText.length < prevText.length - 15) {
                                    isNewTurn = true;
                                } else if (checkPrefix.length > 3 && !cleanTrimmed.includes(checkPrefix)) {
                                    isNewTurn = true;
                                }
                            }
                            
                            if (isNewTurn) {
                                committedTurnsRef.current.push(prevText);
                            }
                            
                            lastTurnTextRef.current = trimmedText;
                            
                            const fullDisplay = [...committedTurnsRef.current, trimmedText].join(' ');
                            setTranscript(fullDisplay);
                            
                            setCurrentTurn('');
                            if (typeof countFillers === 'function') countFillers(trimmedText);
                            if (typeof updateWordCount === 'function') updateWordCount(trimmedText);
                            checkGrammar(trimmedText);
                        } else {
                            setCurrentTurn(text);
                        }
                    }
                } else if (message.type === 'Termination') {
                    cleanup();
                }
            };

            wsRef.current.onerror = () => { setStatus('Connection Error'); cleanup(); };
            wsRef.current.onclose = () => { cleanup(); };

        } catch (err) {
            console.error('Start failed:', err);
            cleanup();
        }
    }, [cleanup, countFillers, updateWordCount, checkGrammar]);

    const stopRecording = useCallback(() => {
        cleanup();
    }, [cleanup]);

    const fetchAiFeedback = useCallback(async (recordedTranscript, currentMode = '', currentPrompt = '') => {
        if (!recordedTranscript || recordedTranscript.trim().length === 0) return;
        setIsAnalyzingAI(true);
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    transcript: recordedTranscript, 
                    mode: currentMode,
                    prompt: currentPrompt
                })
            });
            const data = await res.json();
            if (data.response) {
                setChatHistory(prev => [...prev, { role: 'ai', content: data.response }]);
                if (data.audioBase64) {
                    try {
                        const snd = new Audio(`data:audio/mp3;base64,${data.audioBase64}`);
                        snd.play().catch(e => console.error('Audio playback blocked / failed:', e));
                    } catch (ae) {
                        console.error('Failed to create audio object:', ae);
                    }
                }
            } else {
                setChatHistory(prev => [...prev, { role: 'ai', content: 'Failed to get feedback.' }]);
            }
        } catch (e) {
            console.error('Fetch AI feedback error:', e);
            setChatHistory(prev => [...prev, { role: 'ai', content: 'Error getting feedback.' }]);
        } finally {
            setIsAnalyzingAI(false);
        }
    }, []);

    // 6-second Pause Trigger
    useEffect(() => {
        if (!isRecording || !transcript.trim()) return;
        const isTaskMode = taskType === 'repeat' || taskType === 'short' || taskType?.includes('fitb');
        if (isTaskMode) return; 

        if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
        
        pauseTimeoutRef.current = setTimeout(() => {
            const currentText = transcript;
            setChatHistory(prev => [...prev, { role: 'user', content: currentText.trim() }]);
            setTranscript('');
            committedTurnsRef.current = [];
            lastTurnTextRef.current = '';
            
            if (taskType !== 'repeat') {
                fetchAiFeedback(currentText, mode, prompt);
            }
        }, 6000);

        return () => {
            if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
        };
    }, [transcript, isRecording, fetchAiFeedback, mode, prompt, taskType]);

    return {
        isRecording,
        status,
        transcript,
        currentTurn,
        fillerCounts,
        totalFillers,
        totalWords,
        duration,
        wpm,
        grammarErrors,
        grammarSuggestions,
        paceHistory,
        fluency,
        liveAnalysis,
        chatHistory,
        isAnalyzingAI,
        startRecording,
        stopRecording,
        fetchAiFeedback
    };
}
