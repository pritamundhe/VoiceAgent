'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export default function useAutocomplete(isRecording, transcript, currentTurn) {
    const [ghostText, setGhostText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const wsRef = useRef(null);
    const lastSentRef = useRef('');
    const retryTimerRef = useRef(null);
    const pendingTextRef = useRef(''); // queued text if WS not yet open

    const connect = useCallback(() => {
        if (wsRef.current && wsRef.current.readyState <= WebSocket.OPEN) return;

        try {
            const wsUrl = `ws://${window.location.hostname}:3000/autocomplete`;
            console.log('[Autocomplete] 🔌 Connecting to:', wsUrl);
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                console.log('[Autocomplete] ✅ WebSocket connected');
                // Send any text that arrived before the connection was ready
                if (pendingTextRef.current) {
                    console.log('[Autocomplete] 📤 Flushing pending text');
                    ws.send(JSON.stringify({ type: 'transcript', text: pendingTextRef.current }));
                    pendingTextRef.current = '';
                }
            };

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    console.log('[Autocomplete] 📩 Received:', msg);
                    if (msg.type === 'ghost') {
                        setGhostText(msg.text || '');
                        setIsLoading(msg.loading || false);
                    }
                } catch (e) {
                    console.warn('[Autocomplete] ⚠️ Could not parse message', event.data);
                }
            };

            ws.onerror = (e) => {
                console.error('[Autocomplete] ❌ WebSocket error. Is server.js running on port 3000?', e);
            };

            ws.onclose = (e) => {
                console.log('[Autocomplete] 🔌 WebSocket closed, code:', e.code);
                wsRef.current = null;
                if (isRecording) {
                    retryTimerRef.current = setTimeout(connect, 2000);
                }
            };

            wsRef.current = ws;
        } catch (e) {
            console.error('[Autocomplete] ❌ Failed to create WebSocket:', e);
        }
    }, [isRecording]);

    const disconnect = useCallback(() => {
        if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
        if (wsRef.current) {
            wsRef.current.onclose = null;
            wsRef.current.close();
            wsRef.current = null;
        }
        setGhostText('');
        setIsLoading(false);
        lastSentRef.current = '';
        pendingTextRef.current = '';
    }, []);

    useEffect(() => {
        if (isRecording) {
            connect();
        } else {
            disconnect();
        }
        return () => {
            if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
        };
    }, [isRecording, connect, disconnect]);

    // Send transcript updates to the server
    useEffect(() => {
        if (!isRecording) return;

        const fullText = (transcript + ' ' + currentTurn).trim();
        if (!fullText || fullText === lastSentRef.current) return;

        lastSentRef.current = fullText;
        console.log('[Autocomplete] 📤 Sending transcript:', fullText.slice(-80));

        const ws = wsRef.current;
        if (!ws) {
            pendingTextRef.current = fullText;
            return;
        }

        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'transcript', text: fullText }));
        } else if (ws.readyState === WebSocket.CONNECTING) {
            // WS still opening — queue it; onopen will flush it
            pendingTextRef.current = fullText;
            console.log('[Autocomplete] ⏳ WS still connecting, queued text');
        }
    }, [transcript, currentTurn, isRecording]);

    const acceptSuggestion = useCallback(() => {
        const accepted = ghostText;
        setGhostText('');
        setIsLoading(false);
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'clear' }));
        }
        return accepted;
    }, [ghostText]);

    const dismissSuggestion = useCallback(() => {
        setGhostText('');
        setIsLoading(false);
    }, []);

    return { ghostText, isLoading, acceptSuggestion, dismissSuggestion };
}
