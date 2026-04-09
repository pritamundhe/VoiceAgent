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
  const [verificationResult, setVerificationResult] = useState(null); // { correct: boolean, feedback: string }

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
    // When recording stops in a quiz/fitb mode, trigger AI verification
    if ((taskType === 'short' || taskType?.includes('fitb')) && !isVerifying) {
        // We'll call this inside useEffect to ensure transcript is final
    }
  }, [baseStopRecording, taskType, isVerifying]);

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

      // If we have a transcript, trigger deep analysis
      if (fullTranscript.length > 0) {
          console.log('[Dashboard] Starting session analysis...', { transcriptLength: fullTranscript.length, duration, mode });
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
              
              if (!res.ok) {
                  const errorText = await res.text();
                  throw new Error(`API Error (${res.status}): ${errorText}`);
              }

              const data = await res.json();
              console.log('[Dashboard] Analysis complete:', data);

              if (data.metrics) {
                  const reportData = {
                      ...data,
                      transcript: fullTranscript,
                      modeTitle: selectedMode?.title || 'General Practice',
                      repeatResults: taskType === 'repeat' ? finalResults : undefined
                  };
                  console.log('[Dashboard] Saving report to localStorage...', reportData);
                  localStorage.setItem('lastSessionReport', JSON.stringify(reportData));
                  
                  // Navigate to report
                  console.log('[Dashboard] Navigating to /session-report...');
                  router.push('/session-report');
                  
                  // Fallback if router fails
                  setTimeout(() => {
                      if (window.location.pathname !== '/session-report') {
                          console.log('[Dashboard] Router push failed, trying window.location.href');
                          window.location.href = '/session-report';
                      }
                  }, 100);

                  setIsAnalyzingSession(false);
              } else {
                  throw new Error('No metrics returned from analysis API');
              }
          } catch (err) {
              console.error('[Dashboard] Analysis failed:', err);
              setIsAnalyzingSession(false);
              alert('Analysis failed: ' + err.message);
          }
      } else {
          console.warn('[Dashboard] No transcript detected.');
          alert('No speech detected! Please make sure your microphone is working and speak during the session.');
      }
  };

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getFluencyScore = (score) => {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 50) return 'average';
    return 'poor';
  };

  const selectedMode = MODES.find(m => m.id === mode);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);

  const generateNewPrompt = async (modeObj) => {
      setIsGeneratingPrompt(true);
      setCurrentPrompt(''); // clear immediately for UX
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
          } else {
              // fallback to static if API fails
              const randomPrompt = modeObj.prompts[Math.floor(Math.random() * modeObj.prompts.length)];
              setCurrentPrompt(randomPrompt);
          }
      } catch (err) {
          console.error('Prompt fetch error:', err);
          // fallback
          const randomPrompt = modeObj.prompts[Math.floor(Math.random() * modeObj.prompts.length)];
          setCurrentPrompt(randomPrompt);
      } finally {
          setIsGeneratingPrompt(false);
      }
  };

  useEffect(() => {
    // Treat as valid if we have either a selected predefined mode OR custom title from roadmap
    const hasModeContext = selectedMode || customTitle;
    if (hasModeContext && !currentPrompt && !isGeneratingPrompt) {
        generateNewPrompt(selectedMode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMode, customTitle]);

  // Auto-stop recording for Short Questions once a word is detected
  useEffect(() => {
    if (taskType === 'short' && isRecording && (transcript.trim() || currentTurn.trim())) {
      const fullSpoken = (transcript + ' ' + (currentTurn || '')).toLowerCase().replace(/[^\w\s]/g, '').trim();
      if (fullSpoken.length > 0) {
        const timer = setTimeout(() => {
          stopRecording();
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
    // FITB needs more time for full sentence
    if (taskType?.includes('fitb') && isRecording && (transcript.trim() || currentTurn.trim())) {
        const fullSpoken = (transcript + ' ' + (currentTurn || '')).toLowerCase().replace(/[^\w\s]/g, '').trim();
        if (fullSpoken.length > 5) { // Needs some length
            const timer = setTimeout(() => {
                stopRecording();
            }, 2500); 
            return () => clearTimeout(timer);
        }
    }
  }, [transcript, currentTurn, isRecording, taskType, stopRecording]);

  // Handle Verification Trigger
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
                console.error("Verification failed:", e);
            } finally {
                setIsVerifying(false);
            }
        }
    };
    if (!isRecording) handleVerify();
  }, [isRecording, transcript, currentTurn, taskType, currentPrompt]);

  const handleNewPrompt = () => {
      if ((selectedMode || customTitle) && !isGeneratingPrompt) {
          generateNewPrompt(selectedMode);
      }
  };

  const playBeep = () => {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 1000; 
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
  };

  const handleStartAudioTask = () => {
      if (!currentPrompt) return;
      const textToSpeak = typeof currentPrompt === 'object' ? currentPrompt.q : currentPrompt;
      playTTS(textToSpeak);
  };

  const playTTS = (text) => {
      setIsPlayingTTS(true);
      
      const utterance = new SpeechSynthesisUtterance(text);
      window.__activeUtterance = utterance; // Prevent garbage collection bug in Chrome that skips onend
      utterance.rate = 0.95; 
      
      const voices = window.speechSynthesis.getVoices();
      const engVoices = voices.filter(v => v.lang.startsWith('en'));
      if(engVoices.length > 0) {
          const pref = engVoices.find(v => v.name.includes('Google') || v.name.includes('Natural')) || engVoices[0];
          utterance.voice = pref;
      }
      
      utterance.onend = () => {
          setIsPlayingTTS(false);
          setHasPlayedTTS(true);
          playBeep();
          setTimeout(() => {
              startRecording();
          }, 600);
      };
      
      // Some browsers require explicit error handling
      utterance.onerror = (e) => {
          console.error("TTS Error:", e);
          setIsPlayingTTS(false);
          setHasPlayedTTS(true);
          setTimeout(() => {
              startRecording(); // fallback on error just to not block
          }, 600);
      };
      
      window.speechSynthesis.speak(utterance);
  };

  const handleNextSentence = () => {
      if ((taskType === 'repeat' || taskType === 'short' || taskType?.includes('fitb')) && currentPrompt) {
          const fullSpoken = transcript + ' ' + (currentTurn || '');
          const targetText = typeof currentPrompt === 'object' ? currentPrompt.q : currentPrompt;
          const expectedAnswer = typeof currentPrompt === 'object' ? currentPrompt.a : undefined;
          setRepeatResults(prev => [...prev, { 
              target: targetText, 
              expected: expectedAnswer,
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
          
          setTimeout(() => {
              const nextText = typeof promptQueue[nextIdx] === 'object' ? promptQueue[nextIdx].q : promptQueue[nextIdx];
              playTTS(nextText);
          }, 1500);
      } else {
          handleEndSession();
      }
  };

  const getTargetAnnotation = (targetRaw, spoken) => {
      const target = typeof targetRaw === 'object' ? targetRaw.q : targetRaw;
      const fullSpoken = (spoken || '').trim();
      if (!fullSpoken) return `"${target}"`;
      
      // If perfect match (ignoring case/punctuation)
      const cleanTarget = target.toLowerCase().replace(/[^\w\s]/g, '').trim();
      const cleanSpoken = fullSpoken.toLowerCase().replace(/[^\w\s]/g, '').trim();
      if (cleanTarget === cleanSpoken) {
          return <span style={{ color: '#69db7c' }}>"{target}" (Perfect Match!)</span>;
      }

      // If they don't match, highlight the Target Sentence
      const targetWordsRaw = target.split(/\s+/);
      const spokenWords = cleanSpoken.split(/\s+/);
      
      return (
          <>
            "
            {targetWordsRaw.map((rawWord, idx) => {
                const cleanWord = rawWord.toLowerCase().replace(/[^\w\s]/g, '');
                if (!cleanWord) return <span key={idx}>{rawWord} </span>;
                
                const isMatched = spokenWords.includes(cleanWord);
                return (
                    <span 
                        key={idx} 
                        style={{ color: isMatched ? '#69db7c' : '#ff6b6b' }}
                    >
                        {rawWord}{' '}
                    </span>
                );
            })}
            "
          </>
      );
  };

  if (!mode && !customTitle) {
    return (
      <div className="app-container">
        <Navbar />
        <main className="practice-container" style={{ paddingTop: '2rem' }}>
          <header className="practice-header" style={{ marginBottom: '3rem', textAlign: 'center' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Choose your scenario</h1>
            <p style={{ opacity: 0.7, fontSize: '1.1rem' }}>Select a mode to start your AI-powered speech analysis session.</p>
          </header>

          <div className="practice-grid">
            {MODES.map((m) => (
              <Link 
                key={m.id} 
                href={`/dashboard?mode=${m.id}`}
                style={{ textDecoration: 'none' }}
                className={`practice-card ${m.className}`}
              >
                <div className="card-bg-icon">{m.icon}</div>
                <h3>{m.title}</h3>
                <h4>{m.subtitle}</h4>
                <p>{m.description}</p>
              </Link>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar />

      {isAnalyzingSession && (
          <div className="loading-overlay" style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.85)',
              backdropFilter: 'blur(10px)',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1.5rem'
          }}>
              <div className="loader-ring"></div>
              <p style={{ fontSize: '1.25rem', fontWeight: 500, letterSpacing: '0.5px' }}>Analyzing your performance...</p>
              <p style={{ opacity: 0.5, fontSize: '0.9rem' }}>OpenAI is evaluating your speech metrics and feedback.</p>
          </div>
      )}

      <main className="dashboard-grid">
        {/* Left Column: Recording and Transcript */}
        <section className="dashboard-col">
          {(currentPrompt || isGeneratingPrompt) && (
            <div className="glass-panel" style={{ 
              marginBottom: '1rem', 
              padding: '1.2rem', 
              background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%)',
              borderLeft: '4px solid var(--accent)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              minHeight: 'auto',
              flex: 'none'
            }}>
              <div>
                <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.8px', opacity: 0.6, fontWeight: 700 }}>
                    <span>{taskType === 'repeat' ? 'Listening Exercise' : 'Active Scenario Prompt'}</span>
                    {taskType === 'repeat' && promptQueue.length > 0 && (
                        <span>Sentence {currentPromptIndex + 1} of {promptQueue.length}</span>
                    )}
                </span>
                
                {taskType === 'repeat' || taskType === 'short' || taskType?.includes('fitb') ? (
                  <div style={{ marginTop: '0.5rem' }}>
                    {isGeneratingPrompt ? (
                        <p style={{ opacity: 0.5, fontStyle: 'italic', fontSize: '0.9rem' }}>Generating exercises...</p>
                    ) : !hasPlayedTTS && !isPlayingTTS ? (
                        <div style={{ padding: '1rem', textAlign: 'center', background: 'rgba(0,0,0,0.15)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                           <p style={{ margin: '0 0 0.8rem', fontSize: '0.9rem', opacity: 0.8 }}>
                               {taskType?.includes('fitb') ? 'Speak the FULL sentence and fill in the blank.' : taskType === 'short' ? 'You will hear a quick question. Speak your one-word answer immediately.' : 'You will hear a simulation voice. Repeat the sentence exactly.'}
                           </p>
                           <button className="btn btn-primary" onClick={handleStartAudioTask} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                               ▶ Start Exercise
                           </button>
                        </div>
                    ) : isPlayingTTS ? (
                        <div style={{ padding: '1rem', textAlign: 'center', background: 'var(--primary-subtle)', borderRadius: '12px', color: 'var(--primary)', border: '1px solid var(--primary)' }}>
                           <p style={{ fontWeight: 700, margin: 0, fontSize: '1rem', animation: 'pulse 1.5s infinite' }}>🔊 Listening...</p>
                        </div>
                    ) : (
                        <div style={{ marginTop: '0.3rem' }}>
                           <p style={{ fontSize: '1.1rem', fontWeight: 500, fontStyle: 'normal', opacity: 1, lineHeight: '1.5' }}>
                               {typeof currentPrompt === 'object' ? (currentPrompt.q || '') : getTargetAnnotation(currentPrompt, transcript + ' ' + (currentTurn || ''))}
                           </p>
                           {(taskType === 'short' || taskType?.includes('fitb')) && (
                               <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                   {(() => {
                                       const fullSpoken = (transcript + ' ' + (currentTurn || '')).trim();
                                       if (!fullSpoken && isRecording) return <span style={{opacity: 0.5, fontSize: '0.8rem'}}>Listening for your full sentence...</span>;
                                       if (!fullSpoken && !isRecording) return null;
                                       
                                       if (isVerifying) return <span style={{opacity: 0.5, fontSize: '0.8rem'}}>AI is verifying your logic...</span>;
                                       
                                       if (verificationResult) {
                                           const { correct, feedback } = verificationResult;
                                           return (
                                               <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: correct ? 'rgba(105, 219, 124, 0.1)' : 'rgba(255, 107, 107, 0.1)', padding: '0.4rem 0.8rem', borderRadius: '8px', border: `1px solid ${correct ? '#69db7c44' : '#ff6b6b44'}` }}>
                                                   <span style={{ fontSize: '1.2rem' }}>{correct ? '✅' : '❌'}</span>
                                                   <span style={{ color: correct ? '#69db7c' : '#ff6b6b', fontWeight: 700, fontSize: '0.9rem' }}>
                                                       {correct ? 'Correct!' : (feedback || 'Try again!')}
                                                   </span>
                                               </div>
                                           );
                                       }

                                       return <span style={{opacity: 0.3, fontSize: '0.8rem'}}>Analyzing...</span>;
                                   })()}
                               </div>
                           )}
                        </div>
                    )}
                  </div>
                ) : (
                  <p style={{ fontSize: '1.1rem', fontWeight: 500, marginTop: '0.4rem', lineHeight: '1.5', opacity: isGeneratingPrompt ? 0.5 : 1 }}>
                    {isGeneratingPrompt ? "Generating a custom scenario with ChatGPT..." : `"${currentPrompt}"`}
                  </p>
                )}
              </div>
              <button 
                onClick={handleNewPrompt} 
                className="btn-link" 
                style={{ alignSelf: 'flex-start', fontSize: '0.75rem', opacity: isGeneratingPrompt ? 0.4 : 0.7 }}
                disabled={isGeneratingPrompt}
              >
                {isGeneratingPrompt ? '↻ Generating...' : '↻ Get another prompt'}
              </button>
            </div>
          )}

          <div className="controls-card">
            <button 
              className="btn btn-primary" 
              disabled={isRecording} 
              onClick={startRecording}
            >
              Start Recording
            </button>
            <button 
              className="btn btn-stop" 
              disabled={!isRecording} 
              onClick={handleStopRecording}
            >
              Stop Recording
            </button>
            {(!isRecording && (transcript || chatHistory.length > 0) && taskType !== 'repeat') && (
              <button 
                className="btn btn-primary" 
                style={{ background: '#69db7c', color: '#000' }}
                onClick={handleEndSession}
                disabled={isAnalyzingSession}
              >
                {isAnalyzingSession ? 'Analyzing...' : 'End Session & Report'}
              </button>
            )}
            {(hasPlayedTTS && (taskType === 'repeat' || taskType === 'short' || taskType?.includes('fitb'))) && (
              <button 
                className="btn btn-primary" 
                style={{ background: '#69db7c', color: '#000' }}
                onClick={handleNextSentence}
                disabled={isAnalyzingSession || isPlayingTTS}
              >
                {currentPromptIndex < promptQueue.length - 1 ? (taskType === 'short' || taskType?.includes('fitb') ? 'Next Exercise' : 'Next Sentence') : 'Finish & View Report'}
              </button>
            )}
            <div className="status-bar">
              <div className="status-indicator">
                <div className={`dot ${isRecording ? 'recording' : ''}`}></div>
                <span id="statusText">{status}</span>
              </div>
              {/* Active Section Info Card */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <span className="mode-tag" style={{ 
                  fontSize: '0.75rem', 
                  padding: '0.35rem 0.75rem', 
                  borderRadius: '12px', 
                  background: customTitle ? 'var(--primary-subtle)' : 'var(--surface-3)',
                  color: customTitle ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: 700,
                  border: customTitle ? '1px solid var(--primary)' : '1px solid var(--border)'
                }}>
                  {customTitle || (selectedMode ? `${selectedMode.icon} ${selectedMode.title}` : 'Practice')}
                </span>
                <Link href={customTitle ? "/learning-path" : "/dashboard"} className="btn-link" style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                  {customTitle ? "← Back to Roadmap" : "Change"}
                </Link>
              </div>
            </div>
          </div>

          <div className="glass-panel transcript-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto' }}>
            
            {isAnalyzingAI && taskType !== 'repeat' && taskType !== 'short' && !taskType?.includes('fitb') && (
              <div className="chat-message ai">
                <span style={{ fontSize: '0.85rem', color: '#69db7c', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>OpenAI AI Coach</span>
                <div style={{ fontSize: '1.1rem', lineHeight: '1.6', color: 'var(--text)' }}>
                  <span style={{ fontStyle: 'italic', opacity: 0.7 }}>Typing response...</span>
                </div>
              </div>
            )}

            {(transcript || currentTurn) && (
              <div className="chat-message user">
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                  You {chatHistory.length > 0 ? <span style={{opacity: 0.5}}>(Speaking...)</span> : ''}
                </span>
                <div className="transcript-final" style={{ margin: 0 }}>
                  {(() => {
                      const fullSpoken = transcript + ' ' + (currentTurn || '');
                      const cleanSpoken = fullSpoken.toLowerCase().replace(/[^\w\s]/g, '').trim();
                      const promptText = typeof currentPrompt === 'object' ? (currentPrompt?.q || '') : (currentPrompt || '');
                      const cleanTarget = promptText.toLowerCase().replace(/[^\w\s]/g, '').trim();
                      const isMatch = cleanSpoken && cleanTarget && cleanSpoken === cleanTarget;
                      
                      if (taskType === 'repeat' && promptText) {
                          if (isMatch) {
                              return <span style={{ color: '#69db7c', display: 'inline-block' }}>{fullSpoken}</span>;
                          }
                          
                          // Word by word highlighting
                          const targetWords = promptText.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
                          const spokenWordsRaw = fullSpoken.split(/\s+/);
                          let targetIdx = 0;
                          
                          return spokenWordsRaw.map((rawWord, idx) => {
                              const cleanWord = rawWord.toLowerCase().replace(/[^\w\s]/g, '');
                              if (!cleanWord) return <span key={idx} style={{color: 'inherit'}}>{rawWord} </span>;
                              
                              let matched = false;
                              for (let i = targetIdx; i < Math.min(targetIdx + 4, targetWords.length); i++) {
                                  if (targetWords[i] === cleanWord) {
                                      matched = true;
                                      targetIdx = i + 1;
                                      break;
                                  }
                              }
                              
                              if (!matched) {
                                  if (!targetWords.includes(cleanWord)) {
                                      return <span key={idx} style={{ color: '#ff6b6b' }}>{rawWord} </span>;
                                  }
                                  return <span key={idx} style={{ color: '#ffd43b' }} title="Out of order">{rawWord} </span>;
                              }
                              
                              return <span key={idx} style={{ color: '#69db7c' }}>{rawWord} </span>;
                          });
                      }

                      // Default rendering for other modes
                      return (
                          <span style={{ display: 'inline-block' }}>
                              {transcript}
                              <span className="transcript-partial" style={{ color: 'var(--text-muted)' }}>{currentTurn}</span>
                          </span>
                      );
                  })()}
                </div>
              </div>
            )}

            {!transcript && !currentTurn && chatHistory.length === 0 && (
              <div className="chat-message user">
                <div className="transcript-final" style={{ margin: 0 }}>
                  <span style={{ opacity: 0.5, fontStyle: 'italic' }}>Start speaking to see transcription...</span>
                </div>
              </div>
            )}

            {(taskType !== 'short' && !taskType?.includes('fitb')) && [...chatHistory].reverse().map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.role}`}>
                <span style={{ fontSize: '0.85rem', color: '#69db7c', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                    {msg.role === 'ai' ? 'OpenAI AI Coach' : 'You'}
                </span>
                <div style={{ fontSize: msg.role === 'ai' ? '1.1rem' : '1.05rem', lineHeight: '1.6', color: 'var(--text)', margin: 0 }}>
                    {msg.content}
                </div>
              </div>
            ))}
            
          </div>
        </section>

        {/* Right Column: Metrics and Analytics */}
        <section className="dashboard-col">
          {/* <LiveMonitor metrics={liveAnalysis} isRecording={isRecording} chatHistory={chatHistory} /> */}
          
          {taskType !== 'repeat' && (
            <div className="filler-panel" style={{ padding: '1rem' }}>
              <div className="filler-header">
                <span className="filler-label">Breakdown</span>
                <span className={`filler-total ${totalFillers > 0 ? 'has-fillers' : ''}`}>
                  {totalFillers} total
                </span>
              </div>
              <div className="filler-pills">
                {Object.entries(fillerCounts).map(([word, count]) => (
                  <div key={word} className={`pill ${count > 0 ? 'active' : ''}`} style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                    {word} <span className="pill-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="metrics-container">
            <div className="metrics-layout">
              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-label">Words</span>
                  <span className={`stat-value ${isRecording ? 'live' : ''}`}>{totalWords}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Duration</span>
                  <span className={`stat-value ${isRecording ? 'live' : ''}`}>{formatDuration(duration)}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">WPM</span>
                  <span className={`stat-value ${isRecording ? 'live' : ''}`}>{wpm || '\u2014'}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Errors</span>
                  <span className={`stat-value ${grammarErrors > 0 ? 'has-errors' : ''}`}>{grammarErrors}</span>
                </div>
              </div>

              <div className="stat-card stat-card-fluency" data-score={getFluencyScore(fluency)}>
                <span className="stat-label">Fluency</span>
                <div className="gauge-container">
                    <svg className="gauge-svg" viewBox="0 0 100 100">
                      <circle className="gauge-bg" cx="50" cy="50" r="45"></circle>
                      <circle 
                        className="gauge-progress" 
                        cx="50" cy="50" r="45" 
                        style={{ strokeDasharray: `${fluency * 2.83}, 283` }}
                      ></circle>
                    </svg>
                    <span className="stat-value">{fluency}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="chart-card">
            <span className="stat-label">Pace over time</span>
            <div className="chart-container">
              <PaceChart data={paceHistory.data} labels={paceHistory.labels} />
            </div>
          </div>

          <SpeechAnalysisPanel metrics={liveAnalysis} isRecording={isRecording} />

          {taskType !== 'repeat' && (
            <div className="grammar-panel" style={{ borderLeft: '4px solid #ff6b6b', padding: '1rem' }}>
              <span className="filler-label">Grammar Suggestions</span>
              <div className="grammar-list" style={{ marginTop: '0.5rem' }}>
                {grammarSuggestions.length === 0 ? (
                  <div className="grammar-empty" style={{ fontSize: '0.85rem' }}>No suggestions yet. Start speaking!</div>
                ) : (
                  grammarSuggestions.map((s, i) => (
                    <div key={i} className="grammar-item" style={{ padding: '0.6rem', background: 'var(--surface-2)', borderRadius: '8px', marginBottom: '0.4rem' }}>
                      <span className="grammar-bad" style={{ color: '#ff6b6b', textDecoration: 'line-through', fontWeight: 'bold', fontSize: '0.9rem' }}>{s.bad}</span>
                      {s.fix && <><span className="grammar-arrow" style={{ margin: '0 0.4rem', color: 'var(--text-muted)' }}>→</span><span className="grammar-fix" style={{ color: '#69db7c', fontWeight: 'bold', fontSize: '0.9rem' }}>{s.fix}</span></>}
                      <p className="grammar-msg" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem', marginBottom: 0 }}>{s.msg}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
