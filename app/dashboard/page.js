'use client';

import { useState, useEffect, Suspense, useCallback, useRef } from 'react';
import Navbar from '../../components/Navbar';
import useRecorder from '../../hooks/useRecorder';
import PaceChart from '../../components/PaceChart';
import SpeechAnalysisPanel from '../../components/SpeechAnalysisPanel';
import { useSearchParams, useRouter } from 'next/navigation';
import { MODES } from '../../lib/modes';

const MicIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="22"/>
        <line x1="8" y1="22" x2="16" y2="22"/>
    </svg>
);

function DashboardContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const mode = searchParams.get('mode') || '';
    const customTitle = searchParams.get('customTitle');
    const customDesc = searchParams.get('customDesc');
    const taskType = searchParams.get('taskType');
    const part = searchParams.get('part');

    const selectedMode = MODES.find(m => m.id === mode);

    // Queue mode = any mode that has a prompts array AND no special taskType
    const hasQueueMode = !!(selectedMode?.prompts?.length > 0) && !taskType;

    // ---- Core state ----
    const [currentPrompt, setCurrentPrompt] = useState('');
    const [promptQueue, setPromptQueue] = useState([]);
    const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
    const [completedIndices, setCompletedIndices] = useState(new Set());
    const [isAnalyzingSession, setIsAnalyzingSession] = useState(false);
    const [hasPlayedTTS, setHasPlayedTTS] = useState(false);
    const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
    const [repeatResults, setRepeatResults] = useState([]);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationResult, setVerificationResult] = useState(null);

    // ---- Queue/AI evaluation state ----
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [followUpCount, setFollowUpCount] = useState(0);
    const [pendingEvalTranscript, setPendingEvalTranscript] = useState(null);
    const [showQuestionsPanel, setShowQuestionsPanel] = useState(false);
    const [sessionTopic, setSessionTopic] = useState('');

    // ---- Refs for reliable transcript capture on stop ----
    const wasRecordingRef = useRef(false);
    const transcriptRef = useRef('');
    const currentTurnRef = useRef('');
    const initDoneRef = useRef(false);

    const {
        isRecording, status, transcript, currentTurn,
        fillerCounts, totalFillers, totalWords, duration, wpm,
        grammarErrors, grammarSuggestions, paceHistory, fluency,
        chatHistory, isAnalyzingAI, liveAnalysis,
        startRecording, stopRecording: baseStopRecording,
        fetchAiFeedback, addChatMessage
    } = useRecorder(mode, currentPrompt, taskType, hasQueueMode);

    // Keep refs synced
    useEffect(() => { transcriptRef.current = transcript; }, [transcript]);
    useEffect(() => { currentTurnRef.current = currentTurn; }, [currentTurn]);

    const stopRecording = useCallback(() => { baseStopRecording(); }, [baseStopRecording]);

    // ----------------------------------------------------------------
    // INIT: Queue mode — load dynamically generated prompts using AI
    // ----------------------------------------------------------------
    useEffect(() => {
        if (!hasQueueMode || initDoneRef.current) return;
        if (!selectedMode) return;
        initDoneRef.current = true;

        const loadAiGeneratedQueue = async () => {
            setIsGeneratingPrompt(true);
            try {
                const response = await fetch('/api/generate-prompt', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        modeId: mode,
                        modeTitle: selectedMode.title,
                        description: selectedMode.description,
                        generateQueue: true
                    })
                });
                const data = await response.json();
                if (data.prompt && data.prompt.questions && Array.isArray(data.prompt.questions)) {
                    const questions = data.prompt.questions;
                    const topicText = data.prompt.topic;
                    setPromptQueue(questions);
                    setSessionTopic(topicText);
                    setCurrentPromptIndex(0);
                    setCurrentPrompt(questions[0]);
                    
                    setTimeout(() => {
                        addChatMessage('ai',
                            `Welcome to ${selectedMode.title}! Our topic today is "${topicText}". I've prepared a customized set of ${questions.length} questions for you. ` +
                            `Read the first question above and click "Start Practice" to respond.`
                        );
                    }, 400);
                } else {
                    throw new Error("Invalid response format");
                }
            } catch (err) {
                console.error("Failed to generate queue, using fallbacks", err);
                const questions = selectedMode.prompts || [
                    "What is your favorite hobby and why?",
                    "How do you usually spend your weekends?",
                    "Describe a memorable trip you took.",
                    "What kind of music do you like?",
                    "Where would you like to travel next?"
                ];
                setPromptQueue(questions);
                setSessionTopic(`General ${selectedMode?.title || 'Practice'} Scenarios`);
                setCurrentPromptIndex(0);
                setCurrentPrompt(questions[0]);
                setTimeout(() => {
                    addChatMessage('ai',
                        `Welcome to ${selectedMode.title}! You have ${questions.length} questions. ` +
                        `Read the question above and click "Start Practice" to respond.`
                    );
                }, 400);
            } finally {
                setIsGeneratingPrompt(false);
            }
        };

        loadAiGeneratedQueue();
    }, [hasQueueMode, selectedMode, mode, addChatMessage]);

    // INIT: Non-queue mode — call generate-prompt API
    useEffect(() => {
        if (hasQueueMode) return;
        const hasModeContext = selectedMode || customTitle;
        if (hasModeContext && !currentPrompt && !isGeneratingPrompt) {
            generateNewPrompt(selectedMode);
        }
    }, [selectedMode, customTitle, hasQueueMode]);

    // ----------------------------------------------------------------
    // Capture transcript when recording stops (queue mode only)
    // ----------------------------------------------------------------
    useEffect(() => {
        if (!hasQueueMode) return;
        if (wasRecordingRef.current && !isRecording) {
            // Wait 400ms for final WebSocket transcription to arrive
            setTimeout(() => {
                const spoken = (transcriptRef.current + ' ' + currentTurnRef.current).trim();
                if (spoken) {
                    addChatMessage('user', spoken);
                    setPendingEvalTranscript(spoken);
                }
            }, 400);
        }
        wasRecordingRef.current = isRecording;
    }, [isRecording, hasQueueMode]);

    // ----------------------------------------------------------------
    // AI Evaluation — triggered when pendingEvalTranscript is set
    // ----------------------------------------------------------------
    useEffect(() => {
        if (!pendingEvalTranscript || isEvaluating || !currentPrompt) return;

        const question = typeof currentPrompt === 'object' ? currentPrompt.q : currentPrompt;
        const evalText = pendingEvalTranscript;
        setIsEvaluating(true);
        setPendingEvalTranscript(null);

        (async () => {
            try {
                const res = await fetch('/api/evaluate-answer', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        question,
                        answer: evalText,
                        followUpCount,
                        mode,
                        modeTitle: selectedMode?.title || customTitle || ''
                    })
                });
                const data = await res.json();

                if (data.satisfied) {
                    setCompletedIndices(prev => new Set([...prev, currentPromptIndex]));
                    setFollowUpCount(0);
                    const nextIdx = currentPromptIndex + 1;
                    if (nextIdx < promptQueue.length) {
                        addChatMessage('ai', `✅ Great response! Here comes question ${nextIdx + 1} of ${promptQueue.length}.`);
                        setTimeout(() => {
                            setCurrentPromptIndex(nextIdx);
                            setCurrentPrompt(promptQueue[nextIdx]);
                        }, 700);
                    } else {
                        addChatMessage('ai', `🎉 Outstanding! You've completed all ${promptQueue.length} questions. Generating your report...`);
                        setTimeout(() => handleEndSession(), 1600);
                    }
                } else {
                    setFollowUpCount(prev => prev + 1);
                    addChatMessage('ai', data.followUp || 'Can you elaborate a bit more on that?');
                }
            } catch (err) {
                console.error('Evaluation error:', err);
                addChatMessage('ai', 'Great effort! Let\'s keep going.');
            } finally {
                setIsEvaluating(false);
            }
        })();
    }, [pendingEvalTranscript]);

    // ----------------------------------------------------------------
    // Skip question
    // ----------------------------------------------------------------
    const handleSkipQuestion = () => {
        if (isRecording) stopRecording();
        setFollowUpCount(0);
        const nextIdx = currentPromptIndex + 1;
        if (nextIdx < promptQueue.length) {
            addChatMessage('ai', `Skipping to question ${nextIdx + 1} of ${promptQueue.length}...`);
            setTimeout(() => {
                setCurrentPromptIndex(nextIdx);
                setCurrentPrompt(promptQueue[nextIdx]);
            }, 300);
        } else {
            handleEndSession();
        }
    };

    // ----------------------------------------------------------------
    // End session & navigate to report
    // ----------------------------------------------------------------
    const handleEndSession = async () => {
        if (isRecording) stopRecording();

        let finalResults = [...repeatResults];
        if ((taskType === 'repeat' || taskType === 'short' || taskType?.includes('fitb')) && currentPrompt && (transcript || currentTurn)) {
            const fullSpoken = transcript + ' ' + (currentTurn || '');
            finalResults = [...finalResults, {
                target: typeof currentPrompt === 'object' ? currentPrompt.q : currentPrompt,
                expected: typeof currentPrompt === 'object' ? currentPrompt.a : undefined,
                spoken: fullSpoken.trim(),
                isShortQuiz: taskType === 'short',
                isFitb: taskType?.includes('fitb'),
                aiVerification: verificationResult
            }];
            setRepeatResults(finalResults);
        }

        const fullTranscript = (
            chatHistory.filter(m => m.role === 'user').map(m => m.content).join(' ') +
            ' ' + transcript + ' ' + (currentTurn || '')
        ).trim();

        if (fullTranscript.length > 0) {
            setIsAnalyzingSession(true);
            try {
                const res = await fetch('/api/analyze-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        transcript: fullTranscript,
                        duration: duration || 1,
                        mode,
                        prompt: currentPrompt,
                        taskType,
                        repeatResults: taskType === 'repeat' ? finalResults : undefined
                    })
                });
                if (!res.ok) throw new Error('API Error');
                const data = await res.json();
                if (data.metrics) {
                    localStorage.setItem('lastSessionReport', JSON.stringify({
                        ...data,
                        transcript: fullTranscript,
                        modeTitle: selectedMode?.title || 'General Practice',
                        repeatResults: taskType === 'repeat' ? finalResults : undefined
                    }));
                    router.push('/session-report');
                }
            } catch (err) {
                console.error(err);
                setIsAnalyzingSession(false);
            }
        } else {
            alert('No speech detected!');
        }
    };

    const formatDuration = (s) => `${Math.floor(s / 60)}:${(Math.floor(s % 60)).toString().padStart(2, '0')}`;

    const generateNewPrompt = async (modeObj) => {
        setIsGeneratingPrompt(true);
        setCurrentPrompt('');
        setHasPlayedTTS(false);
        try {
            const res = await fetch('/api/generate-prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    modeId: modeObj?.id || mode,
                    modeTitle: customTitle || modeObj?.title,
                    description: customDesc || modeObj?.description,
                    taskType, part
                })
            });
            const data = await res.json();
            if (data.prompt) {
                if (Array.isArray(data.prompt)) {
                    setPromptQueue(data.prompt);
                    setCurrentPromptIndex(0);
                    setCurrentPrompt(data.prompt[0]);
                } else {
                    setPromptQueue([]);
                    setCurrentPromptIndex(0);
                    setCurrentPrompt(data.prompt);
                }
            }
        } catch (err) { console.error(err); }
        finally { setIsGeneratingPrompt(false); }
    };

    // Short/fitb auto-stop
    useEffect(() => {
        if ((taskType === 'short' || taskType?.includes('fitb')) && isRecording && (transcript.trim() || currentTurn.trim())) {
            const t = setTimeout(() => stopRecording(), 1500);
            return () => clearTimeout(t);
        }
    }, [transcript, currentTurn, isRecording, taskType, stopRecording]);

    // Verify fitb/short answers
    useEffect(() => {
        const handleVerify = async () => {
            const fullSpoken = (transcript + ' ' + (currentTurn || '')).trim();
            if (!isRecording && (taskType === 'short' || taskType?.includes('fitb')) && fullSpoken && currentPrompt && !isVerifying) {
                setIsVerifying(true);
                try {
                    const res = await fetch('/api/verify-answer', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ question: currentPrompt.q, spoken: fullSpoken, expected: currentPrompt.a })
                    });
                    setVerificationResult(await res.json());
                } catch (e) { console.error(e); }
                finally { setIsVerifying(false); }
            }
        };
        if (!isRecording) handleVerify();
    }, [isRecording, transcript, currentTurn, taskType, currentPrompt]);

    const handleNextSentence = () => {
        if ((taskType === 'repeat' || taskType === 'short' || taskType?.includes('fitb')) && currentPrompt) {
            setRepeatResults(prev => [...prev, {
                target: typeof currentPrompt === 'object' ? currentPrompt.q : currentPrompt,
                expected: typeof currentPrompt === 'object' ? currentPrompt.a : undefined,
                spoken: (transcript + ' ' + (currentTurn || '')).trim(),
                isShortQuiz: taskType === 'short',
                isFitb: taskType?.includes('fitb'),
                aiVerification: verificationResult
            }]);
        }
        setVerificationResult(null);
        if (isRecording) stopRecording();
        const nextIdx = currentPromptIndex + 1;
        if (nextIdx < promptQueue.length) {
            setCurrentPromptIndex(nextIdx);
            setCurrentPrompt(promptQueue[nextIdx]);
            setHasPlayedTTS(false);
        } else {
            handleEndSession();
        }
    };

    if (!mode && !customTitle) { router.push('/practice'); return null; }

    const progressPct = hasQueueMode && promptQueue.length > 0
        ? (currentPromptIndex / promptQueue.length) * 100 : 0;

    const promptText = typeof currentPrompt === 'object' ? currentPrompt.q : currentPrompt;

    return (
        <div className="dashboard-wrapper">
            <Navbar />

            {isAnalyzingSession && (
                <div className="loading-overlay">
                    <div className="loader"></div>
                    <p>Analyzing Session...</p>
                </div>
            )}

            {/* ---- Questions Preview Panel ---- */}
            {showQuestionsPanel && (
                <div className="qp-overlay" onClick={() => setShowQuestionsPanel(false)}>
                    <div className="qp-panel" onClick={e => e.stopPropagation()}>
                        <div className="qp-header">
                            <div>
                                <h3>{selectedMode?.title || 'Session'}</h3>
                                <span className="qp-subtitle">{promptQueue.length} Questions Total</span>
                            </div>
                            <button className="qp-close" onClick={() => setShowQuestionsPanel(false)}>✕</button>
                        </div>
                        <div className="qp-list">
                            {promptQueue.map((q, i) => {
                                const isDone = completedIndices.has(i);
                                const isCurrent = i === currentPromptIndex;
                                const qText = typeof q === 'object' ? q.q : q;
                                return (
                                    <div key={i} className={`qp-item ${isDone ? 'done' : isCurrent ? 'current' : 'upcoming'}`}>
                                        <span className="qp-num">
                                            {isDone ? '✅' : isCurrent ? '▶' : i + 1}
                                        </span>
                                        <span className="qp-text">{qText}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            <main className="dashboard-content">

                {/* ===== TOP: PROMPT CARD ===== */}
                <section className="top-section">
                    <div className="analytic-card prompt-card">
                        
                        {/* Left Side: Prompt Text & Controls */}
                        <div className="prompt-left">
                            <div className="prompt-body-left" style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '0.4rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '0.2rem' }}>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                        Practice Prompt
                                    </span>
                                    {sessionTopic && (
                                        <span className="session-topic-badge">
                                            Topic: {sessionTopic}
                                        </span>
                                    )}
                                </div>
                                {isGeneratingPrompt ? (
                                    <div className="generating-shimmer">AI is preparing your practice questions...</div>
                                ) : (
                                    <div className="prompt-text-large">
                                        {promptText ? `"${promptText}"` : ''}
                                    </div>
                                )}
                                
                                {verificationResult && (
                                    <div className={`verification-badge ${verificationResult.correct ? 'success' : 'fail'}`} style={{ marginTop: '0.5rem', display: 'inline-block' }}>
                                        {verificationResult.correct ? '✅ Awesome! Match Detected' : `❌ ${verificationResult.feedback}`}
                                    </div>
                                )}

                                {/* Progress bar */}
                                {hasQueueMode && promptQueue.length > 0 && (
                                    <div className="progress-wrap" style={{ alignSelf: 'flex-start', margin: '0.8rem 0 0 0', width: '200px' }}>
                                        <div className="progress-fill" style={{ width: `${progressPct}%` }} />
                                    </div>
                                )}
                            </div>
                            
                            <div className="prompt-controls-row">
                                <span className="mode-pill-tag">
                                    {customTitle || selectedMode?.title || 'Exercise'}
                                </span>
                                
                                {hasQueueMode && promptQueue.length > 0 && (
                                    <>
                                        <span className="q-progress-badge">
                                            Q{currentPromptIndex + 1} / {promptQueue.length}
                                        </span>
                                        <button
                                            className="btn-view-questions"
                                            onClick={() => setShowQuestionsPanel(true)}
                                        >
                                            📋 Questions
                                        </button>
                                    </>
                                )}

                                {!hasQueueMode && (
                                    <button className="btn-refresh-prompt" onClick={() => generateNewPrompt(selectedMode)}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '5px' }}>
                                            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                                        </svg>
                                        Get another prompt
                                    </button>
                                )}
                                
                                <button 
                                    className={`btn-practice-trigger ${isRecording ? 'stop' : 'start'}`}
                                    onClick={isRecording ? stopRecording : startRecording}
                                    disabled={isEvaluating}
                                >
                                    {isRecording ? (
                                        <>
                                            <div className="stop-square" />
                                            <span>Stop Practice</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}>
                                                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                                                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                                                <line x1="12" y1="19" x2="12" y2="22"/>
                                                <line x1="8" y1="22" x2="16" y2="22"/>
                                            </svg>
                                            <span>Start Practice</span>
                                        </>
                                    )}
                                </button>

                                <div className={`status-dot-indicator ${isRecording ? 'recording' : ''}`}>
                                    <span className="blink-dot" />
                                    <span>{isRecording ? 'Recording...' : 'Ready to record'}</span>
                                </div>

                                {isEvaluating && (
                                    <span className="evaluating-pill">
                                        <span className="eval-dot" />
                                        AI Evaluating...
                                    </span>
                                )}

                                {hasQueueMode && !isRecording && !isEvaluating && promptQueue.length > 0 && (
                                    <button className="btn-skip" onClick={handleSkipQuestion}>
                                        Skip →
                                    </button>
                                )}

                                {(transcript || chatHistory.length > 1) && !isRecording && !isEvaluating && (
                                    <button className="btn-finish-small" onClick={handleEndSession}>
                                        {hasQueueMode ? 'End Session' : 'Finish & Report'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Right Side: Speech Analysis Block */}
                        <div className="prompt-right">
                            <div className="idle-score-box" style={{ background: isRecording ? (liveAnalysis.confidence >= 80 ? '#80c000' : liveAnalysis.confidence >= 40 ? '#ff9000' : '#ff0055') : '#1f1f23' }}>
                                <h4 className="idle-status-title" style={{ color: isRecording && liveAnalysis.confidence < 40 ? '#fff' : isRecording ? '#000' : '#fff' }}>
                                    {isRecording ? (liveAnalysis.confidence >= 80 ? 'CALM' : liveAnalysis.confidence >= 40 ? 'MILD' : 'HIGH') : 'IDLE'}
                                </h4>
                                <p className="idle-score-text" style={{ color: isRecording && liveAnalysis.confidence < 40 ? '#fff' : isRecording ? '#000' : '#8b949e', opacity: 0.8 }}>
                                    Score: {(liveAnalysis.confidence / 100).toFixed(2)}
                                </p>
                            </div>
                            <div className="idle-energy-section">
                                <span className="idle-energy-label">Energy: {(liveAnalysis.energy / 100).toFixed(3)}</span>
                                <div className="idle-energy-bar-wrap">
                                    <div 
                                        className="idle-energy-bar-fill" 
                                        style={{ 
                                            width: `${Math.min(100, Math.max(0, liveAnalysis.energy))}%`, 
                                            background: isRecording ? (liveAnalysis.confidence >= 80 ? '#80c000' : liveAnalysis.confidence >= 40 ? '#ff9000' : '#ff0055') : '#4493f8' 
                                        }} 
                                    />
                                </div>
                            </div>
                        </div>

                    </div>
                </section>

                {/* ===== BOTTOM: CONVERSATION + METRICS ===== */}
                <section className="bottom-section">

                    {/* Conversation — latest on top */}
                    <div className="analytic-card interaction-card">
                        <header className="card-header">
                            <span className="card-tag">Live Transcription</span>
                            <h3>The Conversation</h3>
                        </header>
                        <div className="transcript-area">
                            {/* Live speech — always shown at very top */}
                            {(transcript || currentTurn) && (
                                <div className="msg user active">
                                    <label>YOU (SPEAKING)</label>
                                    <p>
                                        {transcript}
                                        <span className="partial">{currentTurn}</span>
                                    </p>
                                </div>
                            )}

                            {/* Chat history reversed — newest first */}
                            {[...chatHistory].reverse().map((m, i) => (
                                <div key={i} className={`msg ${m.role}`}>
                                    <label>{m.role === 'ai' ? 'AI COACH' : 'YOU'}</label>
                                    <p>{m.content}</p>
                                </div>
                            ))}

                            {!transcript && !currentTurn && chatHistory.length === 0 && (
                                <div className="empty-chat">
                                    {hasQueueMode
                                        ? 'Click "Answer" and speak your response — AI will evaluate and guide you.'
                                        : 'Your speech transcription will appear here in real-time.'}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Live metrics — unchanged */}
                    <div className="analytic-card live-analysis-card">
                        <header className="card-header">
                            <span className="card-tag">AI Insights</span>
                            <h3>Live Metrics</h3>
                        </header>
                        <div className="live-metrics-compact">
                            <div className="l-metric">
                                <label>WPM</label>
                                <div className="l-val">{wpm}</div>
                            </div>
                            <div className="l-metric">
                                <label>FLUENCY</label>
                                <div className="l-val highlight">{fluency}%</div>
                            </div>
                            <div className="l-metric">
                                <label>ERRORS</label>
                                <div className="l-val warning">{grammarErrors}</div>
                            </div>
                            <div className="l-metric">
                                <label>TIME</label>
                                <div className="l-val">{formatDuration(duration)}</div>
                            </div>
                        </div>
                        <div className="mini-chart">
                            <PaceChart data={paceHistory.data} labels={paceHistory.labels} compact />
                        </div>
                    </div>
                </section>
            </main>

            <style jsx>{`
                /* ===== Base layout ===== */
                .dashboard-wrapper {
                    background: #0d1117; min-height: 100vh; overflow-y: auto;
                    color: #e6edf3; font-family: 'Outfit', sans-serif;
                }
                .dashboard-content {
                    padding: 1.5rem 4rem; display: flex; flex-direction: column;
                    gap: 1.5rem; max-width: 1600px; margin: 0 auto;
                }
                .loading-overlay {
                    position: fixed; inset: 0; background: rgba(13,17,23,0.9);
                    backdrop-filter: blur(10px); z-index: 9999;
                    display: flex; flex-direction: column; align-items: center;
                    justify-content: center; gap: 1rem;
                }
                .loader {
                    border: 4px solid #30363d; border-top-color: #3b82f6;
                    border-radius: 50%; width: 50px; height: 50px;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin { to { transform: rotate(360deg); } }

                /* ===== Card grid ===== */
                .top-section { display: grid; grid-template-columns: 1fr; }
                .bottom-section { display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; }

                .analytic-card {
                    background: #0d1117; border: 1px solid #30363d;
                    border-radius: 28px; padding: 2rem;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                    transition: border-color 0.3s, transform 0.3s;
                }
                .analytic-card:hover { border-color: rgba(68,147,248,0.45); transform: translateY(-2px); }
                .prompt-card {
                    display: flex;
                    flex-direction: row;
                    align-items: stretch;
                    gap: 2rem;
                    min-height: 180px;
                    padding: 1.5rem 2rem;
                }
                .prompt-left {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    gap: 1rem;
                }
                .prompt-right {
                    width: 260px;
                    border-left: 1px solid #22252a;
                    padding-left: 2rem;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    gap: 0.8rem;
                }
                .prompt-text-large {
                    font-size: 1.85rem;
                    font-weight: 600;
                    line-height: 1.4;
                    color: #fff;
                    text-align: left;
                }
                .session-topic-badge {
                    font-size: 0.72rem;
                    font-weight: 600;
                    color: #58a6ff;
                    background: rgba(88, 166, 255, 0.08);
                    border: 1px solid rgba(88, 166, 255, 0.15);
                    padding: 0.2rem 0.5rem;
                    border-radius: 6px;
                    letter-spacing: 0.02em;
                }
                .prompt-controls-row {
                    display: flex;
                    align-items: center;
                    gap: 0.8rem;
                    flex-wrap: wrap;
                }
                .mode-pill-tag {
                    font-size: 0.7rem;
                    font-weight: 800;
                    color: #8b949e;
                    text-transform: uppercase;
                    background: #161b22;
                    padding: 0.35rem 0.8rem;
                    border-radius: 8px;
                    border: 1px solid #30363d;
                    letter-spacing: 0.05em;
                }
                .btn-refresh-prompt {
                    background: none;
                    border: none;
                    color: #58a6ff;
                    font-weight: 600;
                    cursor: pointer;
                    font-size: 0.85rem;
                    display: inline-flex;
                    align-items: center;
                    transition: color 0.2s;
                    padding: 0;
                }
                .btn-refresh-prompt:hover {
                    color: #79c0ff;
                    text-decoration: underline;
                }
                .btn-practice-trigger {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: transparent;
                    border-radius: 9999px;
                    padding: 0.55rem 1.3rem;
                    font-weight: 700;
                    font-size: 0.88rem;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
                }
                .btn-practice-trigger.start {
                    border: 2px solid #4493f8;
                    color: #4493f8;
                }
                .btn-practice-trigger.start:hover {
                    background: rgba(68, 147, 248, 0.1);
                    transform: translateY(-1px);
                }
                .btn-practice-trigger.stop {
                    border: 2px solid #ff4b4b;
                    color: #ff4b4b;
                }
                .btn-practice-trigger.stop:hover {
                    background: rgba(255, 75, 75, 0.1);
                    transform: translateY(-1px);
                }
                .stop-square {
                    width: 10px;
                    height: 10px;
                    background: #ff4b4b;
                    border-radius: 1px;
                }
                .status-dot-indicator {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: #161b22;
                    border: 1px solid #30363d;
                    border-radius: 9999px;
                    padding: 0.45rem 1rem;
                    font-size: 0.78rem;
                    font-weight: 700;
                    color: #8b949e;
                }
                .blink-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #30363d;
                }
                .status-dot-indicator.recording .blink-dot {
                    background: #ff4b4b;
                    animation: pulse-dot 1.5s infinite;
                }
                .idle-score-box {
                    border-radius: 12px;
                    padding: 0.8rem 1.2rem;
                    text-align: left;
                    transition: background 0.3s ease;
                }
                .idle-status-title {
                    margin: 0;
                    font-size: 1.4rem;
                    font-weight: 800;
                    letter-spacing: 0.05em;
                }
                .idle-score-text {
                    margin: 0.2rem 0 0 0;
                    font-size: 0.85rem;
                }
                .idle-energy-section {
                    display: flex;
                    flex-direction: column;
                    gap: 0.4rem;
                }
                .idle-energy-label {
                    font-size: 0.85rem;
                    color: #8b949e;
                    font-weight: 600;
                }
                .idle-energy-bar-wrap {
                    height: 10px;
                    background: #161b22;
                    border: 1px solid #30363d;
                    border-radius: 2px;
                    overflow: hidden;
                }
                .idle-energy-bar-fill {
                    height: 100%;
                    transition: width 0.1s linear;
                }

                /* ===== Card header ===== */
                .card-header { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.25rem; }
                .card-header.row,
                .card-header { flex-direction: row; justify-content: space-between; align-items: center; }
                .card-header h3 { font-size: 1.2rem; font-weight: 700; margin: 0; color: #fff; }
                .card-tag { font-size: 0.72rem; font-weight: 800; color: #8b949e; text-transform: uppercase; letter-spacing: 0.1em; }
                .header-left { display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap; }
                .header-right { display: flex; align-items: center; gap: 0.65rem; }

                /* ===== Queue badges ===== */
                .q-progress-badge {
                    font-size: 0.68rem; font-weight: 800; color: #4493f8;
                    background: rgba(68,147,248,0.1); border: 1px solid rgba(68,147,248,0.25);
                    padding: 0.2rem 0.65rem; border-radius: 100px; letter-spacing: 0.04em;
                }
                .btn-view-questions {
                    font-size: 0.72rem; font-weight: 700; color: #8b949e;
                    background: #161b22; border: 1px solid #30363d;
                    padding: 0.25rem 0.7rem; border-radius: 8px; cursor: pointer; transition: 0.2s;
                }
                .btn-view-questions:hover { border-color: #4493f8; color: #4493f8; }

                .evaluating-pill {
                    display: flex; align-items: center; gap: 0.4rem;
                    font-size: 0.7rem; font-weight: 700; color: #f0a500;
                    background: rgba(240,165,0,0.07); border: 1px solid rgba(240,165,0,0.2);
                    padding: 0.25rem 0.75rem; border-radius: 100px;
                }
                .eval-dot {
                    width: 6px; height: 6px; border-radius: 50%;
                    background: #f0a500; animation: pulse-dot 1s infinite;
                }
                @keyframes pulse-dot { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

                .status-pill {
                    display: flex; align-items: center; gap: 0.55rem;
                    background: #161b22; padding: 0.35rem 0.9rem;
                    border-radius: 100px; border: 1px solid #30363d;
                    font-size: 0.72rem; font-weight: 700;
                }
                .status-dot { width: 8px; height: 8px; background: #30363d; border-radius: 50%; }
                .status-dot.active {
                    background: #69db7c; box-shadow: 0 0 8px #69db7c;
                    animation: pulse-dot 2s infinite;
                }

                /* ===== Prompt body ===== */
                .prompt-body {
                    flex: 1; display: flex; flex-direction: column;
                    align-items: center; justify-content: center;
                    padding: 1.5rem 1rem; gap: 1rem;
                }
                .prompt-text {
                    font-size: 2.2rem; font-weight: 700; text-align: center;
                    line-height: 1.35; color: #fff;
                }
                .generating-shimmer {
                    font-size: 1.1rem; color: #8b949e; font-style: italic;
                    animation: shimmer 1.5s ease infinite alternate;
                }
                @keyframes shimmer { from { opacity: 0.4; } to { opacity: 1; } }

                .progress-wrap {
                    width: 50%; max-width: 340px; height: 3px;
                    background: #21262d; border-radius: 100px; overflow: hidden;
                }
                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #4493f8, #79c0ff);
                    border-radius: 100px; transition: width 0.5s ease;
                }

                .verification-badge {
                    padding: 0.6rem 1.1rem; border-radius: 10px;
                    font-weight: 700; font-size: 0.88rem;
                }
                .verification-badge.success { background: rgba(105,219,124,0.1); color: #69db7c; border: 1px solid rgba(105,219,124,0.2); }
                .verification-badge.fail { background: rgba(255,107,107,0.1); color: #ff6b6b; border: 1px solid rgba(255,107,107,0.2); }

                /* ===== Card footer ===== */
                .card-footer {
                    border-top: 1px solid #30363d; padding-top: 1.25rem; margin-top: auto;
                    display: flex; justify-content: space-between; align-items: center;
                }
                .left-controls, .right-controls { display: flex; align-items: center; gap: 0.85rem; }

                /* ===== Buttons ===== */
                .btn-text-only {
                    background: none; border: none; color: #4493f8;
                    font-weight: 700; cursor: pointer; opacity: 0.75;
                    transition: opacity 0.2s; font-size: 0.9rem;
                }
                .btn-text-only:hover { opacity: 1; text-decoration: underline; }

                .btn-primary-small {
                    display: flex; align-items: center; gap: 0.45rem;
                    background: #4493f8; color: #fff; border: none; border-radius: 12px;
                    padding: 0.6rem 1.2rem; font-weight: 700; cursor: pointer;
                    font-size: 0.9rem; box-shadow: 0 4px 15px rgba(68,147,248,0.25);
                    transition: transform 0.15s, background 0.15s;
                }
                .btn-primary-small:hover:not(:disabled) { transform: scale(1.03); background: #58a6ff; }
                .btn-primary-small:disabled { opacity: 0.45; cursor: not-allowed; }

                .btn-stop-small {
                    display: flex; align-items: center; gap: 0.5rem;
                    background: #ff4b4b; color: #fff; border: none; border-radius: 12px;
                    padding: 0.6rem 1.2rem; font-weight: 700; cursor: pointer;
                    font-size: 0.9rem; box-shadow: 0 4px 15px rgba(255,75,75,0.25);
                    transition: transform 0.15s;
                }
                .btn-stop-small:hover { transform: scale(1.03); background: #ff7b72; }
                .stop-sq { width: 11px; height: 11px; background: #fff; border-radius: 2px; }

                .btn-skip {
                    background: none; border: 1px solid #30363d; color: #8b949e;
                    border-radius: 10px; padding: 0.45rem 0.95rem;
                    font-weight: 700; cursor: pointer; font-size: 0.82rem; transition: 0.2s;
                }
                .btn-skip:hover { border-color: #8b949e; color: #e6edf3; }

                .btn-finish-small {
                    background: #238636; color: #fff; border: none;
                    border-radius: 10px; padding: 0.45rem 1.1rem;
                    font-weight: 700; cursor: pointer; font-size: 0.88rem; transition: 0.2s;
                }
                .btn-finish-small:hover { background: #2ea043; }

                .btn-next-small {
                    background: #161b22; color: #e6edf3; border: 1px solid #30363d;
                    border-radius: 10px; padding: 0.45rem 1.1rem;
                    font-weight: 700; cursor: pointer; font-size: 0.88rem; transition: 0.2s;
                }
                .btn-next-small:hover { background: #1f242c; }

                .mode-display {
                    font-size: 0.7rem; font-weight: 800; color: #8b949e;
                    text-transform: uppercase; background: #161b22;
                    padding: 0.28rem 0.7rem; border-radius: 7px; border: 1px solid #30363d;
                }

                /* ===== Conversation (latest on top) ===== */
                .transcript-area {
                    height: 400px; overflow-y: auto;
                    display: flex; flex-direction: column; gap: 1.25rem;
                    padding-right: 0.5rem;
                }
                .transcript-area::-webkit-scrollbar { width: 4px; }
                .transcript-area::-webkit-scrollbar-thumb { background: #30363d; border-radius: 10px; }

                .msg label {
                    font-size: 0.67rem; font-weight: 800; color: #8b949e;
                    letter-spacing: 0.1em; display: block; margin-bottom: 0.3rem;
                }
                .msg p { font-size: 1.08rem; line-height: 1.65; margin: 0; color: #e6edf3; }
                .msg.ai p { color: #58a6ff; font-weight: 600; }
                .msg.user.active p { color: #fff; }
                .partial { opacity: 0.5; color: #8b949e; }
                .empty-chat {
                    height: 100%; display: flex; align-items: center; justify-content: center;
                    text-align: center; opacity: 0.3; font-style: italic;
                    font-size: 0.95rem; padding: 0 2rem;
                }

                /* ===== Live metrics ===== */
                .live-metrics-compact { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
                .l-metric { background: #161b22; padding: 1rem; border-radius: 16px; border: 1px solid #30363d; }
                .l-metric label { font-size: 0.63rem; font-weight: 800; color: #8b949e; display: block; margin-bottom: 0.3rem; }
                .l-val { font-size: 1.6rem; font-weight: 800; color: #fff; }
                .l-val.highlight { color: #4493f8; }
                .l-val.warning { color: #ff7b72; }

                /* ===== Questions Panel ===== */
                .qp-overlay {
                    position: fixed; inset: 0;
                    background: rgba(0,0,0,0.55); z-index: 2000;
                    backdrop-filter: blur(5px);
                }
                .qp-panel {
                    position: fixed; right: 0; top: 0; height: 100vh; width: 400px;
                    background: #0d1117; border-left: 1px solid #30363d;
                    padding: 2rem; overflow-y: auto;
                    animation: slideInRight 0.28s cubic-bezier(0.2,0,0,1);
                }
                @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
                .qp-panel::-webkit-scrollbar { width: 4px; }
                .qp-panel::-webkit-scrollbar-thumb { background: #30363d; border-radius: 10px; }

                .qp-header {
                    display: flex; justify-content: space-between; align-items: flex-start;
                    margin-bottom: 1.5rem; padding-bottom: 1.1rem;
                    border-bottom: 1px solid #21262d;
                }
                .qp-header h3 { font-size: 1.1rem; font-weight: 700; color: #fff; margin: 0 0 0.2rem; }
                .qp-subtitle { font-size: 0.7rem; font-weight: 700; color: #8b949e; text-transform: uppercase; letter-spacing: 0.05em; }
                .qp-close {
                    background: #161b22; border: 1px solid #30363d; color: #8b949e;
                    width: 30px; height: 30px; border-radius: 7px; cursor: pointer;
                    font-size: 0.8rem; transition: 0.2s; display: flex;
                    align-items: center; justify-content: center;
                }
                .qp-close:hover { background: #21262d; color: #fff; }

                .qp-list { display: flex; flex-direction: column; gap: 0.45rem; }
                .qp-item {
                    display: flex; align-items: flex-start; gap: 0.8rem;
                    padding: 0.85rem 0.9rem; border-radius: 12px; transition: 0.2s;
                }
                .qp-item.done {
                    background: rgba(105,219,124,0.05);
                    border: 1px solid rgba(105,219,124,0.15);
                }
                .qp-item.current {
                    background: rgba(68,147,248,0.07);
                    border: 1px solid rgba(68,147,248,0.3);
                    box-shadow: 0 0 12px rgba(68,147,248,0.08);
                }
                .qp-item.upcoming {
                    background: #161b22; border: 1px solid #21262d; opacity: 0.6;
                }
                .qp-num {
                    font-size: 0.75rem; font-weight: 800; min-width: 22px;
                    text-align: center; color: #8b949e; padding-top: 0.1rem;
                }
                .qp-item.current .qp-num { color: #4493f8; }
                .qp-item.done .qp-num { color: #69db7c; }
                .qp-text { font-size: 0.86rem; line-height: 1.5; color: #c9d1d9; flex: 1; }
                .qp-item.current .qp-text { color: #fff; font-weight: 600; }
                .qp-item.upcoming .qp-text { color: #8b949e; }
            `}</style>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<div style={{ background: '#0d1117', height: '100vh' }} />}>
            <DashboardContent />
        </Suspense>
    );
}
