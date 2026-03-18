'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const SAMPLE_RATE = 16000;
const FILLER_WORDS = ['um', 'uh', 'like', 'actually', 'basically'];

export default function useRecorder(mode = '') {
    const [isRecording, setIsRecording] = useState(false);
    const [status, setStatus] = useState('Ready to record');
    const [transcript, setTranscript] = useState('');
    const [currentTurn, setCurrentTurn] = useState('');
    
    // Analytics State
    const [fillerCounts, setFillerCounts] = useState(Object.fromEntries(FILLER_WORDS.map(w => [w, 0])));
    const [totalFillers, setTotalFillers] = useState(0);
    const [totalWords, setTotalWords] = useState(0);
    const [duration, setDuration] = useState(0);
    const [wpm, setWpm] = useState(0);
    const [grammarErrors, setGrammarErrors] = useState(0);
    const [grammarSuggestions, setGrammarSuggestions] = useState([]);
    const [paceHistory, setPaceHistory] = useState({ labels: [], data: [] });
    const [fluency, setFluency] = useState(100);

    // AI Feedback & Chat History State
    const [chatHistory, setChatHistory] = useState([]); // { role: 'user' | 'ai', content: '' }
    const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);

    const wsRef = useRef(null);
    const audioContextRef = useRef(null);
    const mediaStreamRef = useRef(null);
    const scriptProcessorRef = useRef(null);
    const proxyReadyRef = useRef(false);
    const startTimeRef = useRef(null);
    const durationIntervalRef = useRef(null);
    const pauseTimeoutRef = useRef(null);

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
        if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
            try { wsRef.current.close(); } catch (e) {}
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
            const res = await fetch('http://localhost:3000/api/grammar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
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
    }, []);

    useEffect(() => {
        // Calculate WPM and Fluency whenever words or fillers change
        if (duration > 0) {
            const currentWpm = Math.round(totalWords / (duration / 60));
            setWpm(currentWpm);

            if (duration % 2 === 0) { // Update pace history every 2 seconds
                setPaceHistory(prev => {
                    const newLabels = [...prev.labels, `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`];
                    const newData = [...prev.data, currentWpm];
                    return {
                        labels: newLabels.slice(-20),
                        data: newData.slice(-20)
                    };
                });
            }
        }

        // Fluency logic
        let score = 100;
        score -= (totalFillers * 2);
        score -= (grammarErrors * 5);
        if (wpm > 0 && (wpm < 110 || wpm > 180)) score -= 10;
        setFluency(Math.max(0, score));

    }, [totalWords, duration, totalFillers, grammarErrors, wpm]);

    const startRecording = useCallback(async () => {
        try {
            setTranscript('');
            setCurrentTurn('');
            setFillerCounts(Object.fromEntries(FILLER_WORDS.map(w => [w, 0])));
            setTotalFillers(0);
            setTotalWords(0);
            setDuration(0);
            setWpm(0);
            setGrammarErrors(0);
            setGrammarSuggestions([]);
            setPaceHistory({ labels: [], data: [] });
            setFluency(100);
            setChatHistory([]);
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
                        scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current.onaudioprocess = (event) => {
                            if (!proxyReadyRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
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
                        durationIntervalRef.current = setInterval(() => {
                            setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
                        }, 1000);
                    } catch (err) {
                        alert('Could not access microphone: ' + err.message);
                        cleanup();
                    }
                } else if (message.type === 'Turn') {
                    const text = message.transcript || '';
                    const isFinal = message.turn_is_formatted === true;

                    if (isFinal && text) {
                        setTranscript(prev => prev + text + ' ');
                        setCurrentTurn('');
                        countFillers(text);
                        updateWordCount(text);
                        checkGrammar(text);
                    } else {
                        setCurrentTurn(text);
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

    const fetchAiFeedback = useCallback(async (recordedTranscript, currentMode = '') => {
        if (!recordedTranscript || recordedTranscript.trim().length === 0) return;
        setIsAnalyzingAI(true);
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript: recordedTranscript, mode: currentMode })
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

    // 3-second Pause Trigger
    useEffect(() => {
        if (!isRecording || !transcript.trim()) return;

        if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
        
        pauseTimeoutRef.current = setTimeout(() => {
            const currentText = transcript;
            setChatHistory(prev => [...prev, { role: 'user', content: currentText.trim() }]);
            setTranscript('');
            fetchAiFeedback(currentText, mode);
        }, 3000);

        return () => {
            if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
        };
    }, [transcript, isRecording, fetchAiFeedback, mode]);

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
        chatHistory,
        isAnalyzingAI,
        startRecording,
        stopRecording,
        fetchAiFeedback
    };
}
