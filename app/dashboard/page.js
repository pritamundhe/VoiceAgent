'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import Navbar from '../../components/Navbar';
import useRecorder from '../../hooks/useRecorder';
import PaceChart from '../../components/PaceChart';
import SpeechAnalysisPanel from '../../components/SpeechAnalysisPanel';
import LiveMonitor from '../../components/LiveMonitor';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MODES } from '../../lib/modes';

const MicIcon = ({ isRecording }) => (
    <div className={`mic-status ${isRecording ? 'pulse' : ''}`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/>
        </svg>
    </div>
);

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get('mode') || '';
  const customTitle = searchParams.get('customTitle');
  const customDesc = searchParams.get('customDesc');
  const taskType = searchParams.get('taskType');
  const part = searchParams.get('part');
  
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [promptQueue, setPromptQueue] = useState([]);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [repeatResults, setRepeatResults] = useState([]);
  const [isAnalyzingSession, setIsAnalyzingSession] = useState(false);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [hasPlayedTTS, setHasPlayedTTS] = useState(false);
  const [showPromptText, setShowPromptText] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  const {
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
    liveAnalysis,
    startRecording,
    stopRecording: baseStopRecording,
    fetchAiFeedback
  } = useRecorder(mode, currentPrompt, taskType);

  const stopRecording = useCallback(() => {
    baseStopRecording();
  }, [baseStopRecording]);

  const handleStopRecording = () => {
      stopRecording();
  };

  const handleEndSession = async () => {
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
          chatHistory
            .filter(m => m.role === 'user')
            .map(m => m.content)
            .join(' ') + 
          ' ' + 
          transcript + 
          ' ' + 
          (currentTurn || '')
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
                  const reportData = {
                      ...data,
                      transcript: fullTranscript,
                      modeTitle: selectedMode?.title || 'General Practice',
                      repeatResults: taskType === 'repeat' ? finalResults : undefined
                  };
                  localStorage.setItem('lastSessionReport', JSON.stringify(reportData));
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

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const selectedMode = MODES.find(m => m.id === mode);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);

  const generateNewPrompt = async (modeObj) => {
      setIsGeneratingPrompt(true);
      setCurrentPrompt('');
      setHasPlayedTTS(false);
      setShowPromptText(false);
      try {
          const res = await fetch('/api/generate-prompt', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  modeId: modeObj?.id || mode, 
                  modeTitle: customTitle || modeObj?.title, 
                  description: customDesc || modeObj?.description,
                  taskType,
                  part
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
      } catch (err) {
          console.error(err);
      } finally {
          setIsGeneratingPrompt(false);
      }
  };

  useEffect(() => {
    const hasModeContext = selectedMode || customTitle;
    if (hasModeContext && !currentPrompt && !isGeneratingPrompt) {
        generateNewPrompt(selectedMode);
    }
  }, [selectedMode, customTitle]);

  useEffect(() => {
    if ((taskType === 'short' || taskType?.includes('fitb')) && isRecording && (transcript.trim() || currentTurn.trim())) {
      const timer = setTimeout(() => { stopRecording(); }, 1500);
      return () => clearTimeout(timer);
    }
  }, [transcript, currentTurn, isRecording, taskType, stopRecording]);

  useEffect(() => {
    const handleVerify = async () => {
        const fullSpoken = (transcript + ' ' + (currentTurn || '')).trim();
        if (!isRecording && (taskType === 'short' || taskType?.includes('fitb')) && fullSpoken && currentPrompt && !isVerifying) {
            setIsVerifying(true);
            try {
                const res = await fetch('/api/verify-answer', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        question: currentPrompt.q,
                        spoken: fullSpoken,
                        expected: currentPrompt.a
                    })
                });
                const data = await res.json();
                setVerificationResult(data);
            } catch (e) {
                console.error(e);
            } finally {
                setIsVerifying(false);
            }
        }
    };
    if (!isRecording) handleVerify();
  }, [isRecording, transcript, currentTurn, taskType, currentPrompt]);

  const handleNextSentence = () => {
      if ((taskType === 'repeat' || taskType === 'short' || taskType?.includes('fitb')) && currentPrompt) {
          const fullSpoken = transcript + ' ' + (currentTurn || '');
          setRepeatResults(prev => [...prev, { 
              target: typeof currentPrompt === 'object' ? currentPrompt.q : currentPrompt, 
              expected: typeof currentPrompt === 'object' ? currentPrompt.a : undefined,
              spoken: fullSpoken.trim(),
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
          setShowPromptText(false);
      } else {
          handleEndSession();
      }
  };

  if (!mode && !customTitle) {
      router.push('/practice');
      return null;
  }

  return (
    <div className="dashboard-wrapper">
      <Navbar />

      {isAnalyzingSession && (
          <div className="loading-overlay">
              <div className="loader"></div>
              <p>Analyzing Session...</p>
          </div>
      )}

      <main className="dashboard-content">
        {/* TOP ROW: PROMPT & CONTROLS */}
        <section className="top-section">
            <div className="analytic-card prompt-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <header className="card-header row">
                    <span className="card-tag">Current Exercise</span>
                    <div className="status-pill">
                        <div className={`status-dot ${isRecording ? 'active' : ''}`}></div>
                        <span>{status}</span>
                    </div>
                </header>
                
                <div className="prompt-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '2rem 0' }}>
                    {isGeneratingPrompt ? (
                        <div className="generating-shimmer">Developing simulation...</div>
                    ) : (
                        <div className="prompt-text" style={{ textAlign: 'center', fontSize: '2.4rem' }}>
                            {typeof currentPrompt === 'object' ? currentPrompt.q : `"${currentPrompt}"`}
                        </div>
                    )}
                    
                    {verificationResult && (
                        <div className={`verification-badge ${verificationResult.correct ? 'success' : 'fail'}`} style={{ alignSelf: 'center', marginTop: '2rem' }}>
                            {verificationResult.correct ? '✅ Awesome! Match Detected' : `❌ ${verificationResult.feedback}`}
                        </div>
                    )}
                </div>

                <div className="card-footer" style={{ borderTop: '1px solid #30363d', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                    <div className="left-controls" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <button className="btn-text-only" onClick={() => generateNewPrompt(selectedMode)}>
                            ↻ Get another prompt
                        </button>
                        
                        {!isRecording ? (
                            <button className="btn-primary-small" onClick={startRecording}>
                                <MicIcon isRecording={false} /> <span>Start Practice</span>
                            </button>
                        ) : (
                            <button className="btn-stop-small" onClick={handleStopRecording}>
                                <div className="stop-square-small"></div> <span>Stop Session</span>
                            </button>
                        )}
                    </div>
                    
                    <div className="right-controls" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {(transcript || chatHistory.length > 0) && !isRecording && (
                            <button className="btn-finish-small" onClick={handleEndSession}>
                                Finish & View Report
                            </button>
                        )}
                        {taskType === 'repeat' && hasPlayedTTS && (
                            <button className="btn-next-small" onClick={handleNextSentence}>Next Exercise →</button>
                        )}
                        <div className="mode-display">
                            {customTitle || selectedMode?.title}
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* BOTTOM ROW: TRANSCRIPT & LIVE FEEDBACK */}
        <section className="bottom-section">
            <div className="analytic-card interaction-card">
                <header className="card-header">
                    <span className="card-tag">Live Transcription</span>
                    <h3>The Conversation</h3>
                </header>
                <div className="transcript-area">
                    {chatHistory.map((m, i) => (
                        <div key={i} className={`msg ${m.role}`}>
                            <label>{m.role === 'ai' ? 'COACH' : 'YOU'}</label>
                            <p>{m.content}</p>
                        </div>
                    ))}
                    {(transcript || currentTurn) && (
                        <div className="msg user active">
                            <label>YOU (SPEAKING)</label>
                            <p>
                                {transcript}
                                <span className="partial">{currentTurn}</span>
                            </p>
                        </div>
                    )}
                    {!transcript && !currentTurn && chatHistory.length === 0 && (
                        <div className="empty-chat">Your speech transcription will appear here in real-time.</div>
                    )}
                </div>
            </div>

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
                <SpeechAnalysisPanel metrics={liveAnalysis} isRecording={isRecording} compact />
            </div>
        </section>
      </main>

      <style jsx>{`
        .dashboard-wrapper {
            background: #0d1117;
            height: 100vh;
            overflow-y: auto;
            color: #e6edf3;
            font-family: 'Outfit', sans-serif;
        }
        .dashboard-content {
            padding: 1.5rem 4rem;
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            max-width: 1600px;
            margin: 0 auto;
        }

        .loading-overlay {
            position: fixed; inset: 0; background: rgba(13, 17, 23, 0.9); backdrop-filter: blur(10px);
            z-index: 9999; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem;
        }
        .loader { border: 4px solid #30363d; border-top: 4px solid #3b82f6; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        .top-section { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
        .prompt-card { min-height: 280px; }
        
        .bottom-section { display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; }

        .analytic-card {
            background: #0d1117;
            border: 1px solid #30363d;
            border-radius: 28px;
            padding: 2rem;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            transition: all 0.3s cubic-bezier(0.2, 0, 0, 1);
        }
        .analytic-card:hover { border-color: rgba(68, 147, 248, 0.5); transform: translateY(-2px); }

        .card-header { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.5rem; }
        .card-header.row { flex-direction: row; justify-content: space-between; align-items: center; }
        .card-tag { font-size: 0.75rem; font-weight: 800; color: #8b949e; text-transform: uppercase; letter-spacing: 0.1em; }
        .card-header h3 { font-size: 1.25rem; font-weight: 700; margin: 0; color: #fff; }

        .status-pill { display: flex; align-items: center; gap: 0.6rem; background: #161b22; padding: 0.4rem 1rem; border-radius: 100px; border: 1px solid #30363d; font-size: 0.75rem; font-weight: 700; }
        .status-dot { width: 8px; height: 8px; background: #30363d; border-radius: 50%; }
        .status-dot.active { background: #69db7c; box-shadow: 0 0 10px #69db7c; animation: pulse 2s infinite; }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }

        .btn-text-only { background: none; border: none; color: #4493f8; font-weight: 700; cursor: pointer; opacity: 0.7; transition: 0.2s; font-size: 0.95rem; }
        .btn-text-only:hover { opacity: 1; text-decoration: underline; }
        
        .btn-primary-small {
            display: flex; align-items: center; gap: 0.5rem;
            background: #4493f8; color: #fff; border: none; border-radius: 12px;
            padding: 0.6rem 1.25rem; font-weight: 700; cursor: pointer; transition: 0.2s; font-size: 0.95rem;
            box-shadow: 0 4px 15px rgba(68, 147, 248, 0.25);
        }
        .btn-primary-small:hover { transform: scale(1.02); background: #58a6ff; }
        .btn-primary-small svg { width: 16px; height: 16px; }
        
        .btn-stop-small {
            display: flex; align-items: center; gap: 0.6rem;
            background: #ff4b4b; color: #fff; border: none; border-radius: 12px;
            padding: 0.6rem 1.25rem; font-weight: 700; cursor: pointer; transition: 0.2s; font-size: 0.95rem;
            box-shadow: 0 4px 15px rgba(255, 75, 75, 0.25);
        }
        .btn-stop-small:hover { transform: scale(1.02); background: #ff7b72; }
        .stop-square-small { width: 12px; height: 12px; background: #fff; border-radius: 2px; }

        .btn-finish-small { background: #238636; color: #fff; border: none; border-radius: 10px; padding: 0.5rem 1.2rem; font-weight: 700; cursor: pointer; transition: 0.2s; font-size: 0.9rem;}
        .btn-finish-small:hover { background: #2ea043; }
        
        .btn-next-small { background: #161b22; color: #e6edf3; border: 1px solid #30363d; border-radius: 10px; padding: 0.5rem 1.2rem; font-weight: 700; cursor: pointer; transition: 0.2s; font-size: 0.9rem;}
        .btn-next-small:hover { background: #1f242c; }

        .mode-display { font-size: 0.75rem; font-weight: 800; color: #8b949e; text-transform: uppercase; background: #161b22; padding: 0.35rem 0.8rem; border-radius: 8px; border: 1px solid #30363d; }


        .transcript-area { height: 400px; overflow-y: auto; display: flex; flex-direction: column; gap: 1.5rem; padding-right: 1rem; }
        .transcript-area::-webkit-scrollbar { width: 4px; }
        .transcript-area::-webkit-scrollbar-thumb { background: #30363d; border-radius: 10px; }

        .msg label { font-size: 0.7rem; font-weight: 800; color: #8b949e; letter-spacing: 0.1em; display: block; margin-bottom: 0.4rem; }
        .msg p { font-size: 1.15rem; line-height: 1.6; margin: 0; color: #e6edf3; }
        .msg.ai p { color: #58a6ff; font-weight: 600; }
        .msg.user.active p { color: #fff; }
        .partial { opacity: 0.5; color: #8b949e; }
        .empty-chat { height: 100%; display: flex; align-items: center; justify-content: center; text-align: center; opacity: 0.3; font-style: italic; }

        .live-metrics-compact { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
        .l-metric { background: #161b22; padding: 1rem; border-radius: 16px; border: 1px solid #30363d; }
        .l-metric label { font-size: 0.65rem; font-weight: 800; color: #8b949e; display: block; margin-bottom: 0.3rem; }
        .l-val { font-size: 1.6rem; font-weight: 800; color: #fff; }
        .l-val.highlight { color: #4493f8; }
        .l-val.warning { color: #ff7b72; }
        
        .verification-badge { margin-top: 1rem; padding: 0.75rem 1.25rem; border-radius: 12px; font-weight: 700; font-size: 0.9rem; }
        .verification-badge.success { background: rgba(105, 219, 124, 0.1); color: #69db7c; border: 1px solid rgba(105, 219, 124, 0.2); }
        .verification-badge.fail { background: rgba(255, 107, 107, 0.1); color: #ff6b6b; border: 1px solid rgba(255, 107, 107, 0.2); }

      `}</style>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
