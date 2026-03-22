'use client';

import React from 'react';

const LiveMonitor = ({ metrics, isRecording, chatHistory = [] }) => {
    const { energy, liveWpm, pauseQuality, confidence, sentiment = 0, emotion = 'neu' } = metrics;
    
    // Emotion mapping dictionary
    const emotionMap = {
        'neu': { label: 'Neutral', color: '#888' },
        'hap': { label: 'Happy / Excited', color: '#80c000' },
        'ang': { label: 'Angular / Intense', color: '#ff0055' },
        'sad': { label: 'Subdued', color: '#4a90e2' },
        'exc': { label: 'Excited', color: '#ff9000' },
        'fru': { label: 'Frustrated', color: '#ff0055' },
    };

    const currentEmotion = emotionMap[emotion] || emotionMap['neu'];
    
    // Get latest AI message
    const aiMessages = chatHistory.filter(m => m.role === 'ai');
    const latestAiMessage = aiMessages.length > 0 ? aiMessages[aiMessages.length - 1].content : null;

    const MetricRow = ({ label, value, max = 100, unit = '%' }) => (
        <div className="monitor-row">
            <div className="monitor-info">
                <span className="monitor-label">{label}</span>
                <span className="monitor-value">{value}{unit}</span>
            </div>
            <div className="monitor-track">
                <div 
                    className="monitor-fill" 
                    style={{ 
                        width: `${Math.min(100, (value / max) * 100)}%`,
                        backgroundColor: value > (max * 0.8) ? '#ff0055' : value > (max * 0.5) ? '#ff9000' : '#80c000'
                    }}
                />
            </div>
        </div>
    );

    const getOverallColor = (score) => {
        if (score >= 80) return { bg: 'rgba(128, 192, 0, 0.15)', border: '#80c000' };
        if (score >= 40) return { bg: 'rgba(255, 144, 0, 0.15)', border: '#ff9000' };
        return { bg: 'rgba(255, 0, 85, 0.15)', border: '#ff0055' };
    };

    const panelColor = getOverallColor(confidence);

    return (
        <div className="live-monitor-box" style={{ 
            backgroundColor: isRecording ? panelColor.bg : 'var(--surface-2)', 
            border: isRecording ? `1px solid ${panelColor.border}` : '1px solid var(--border)',
            transition: 'background-color 0.5s ease, border-color 0.5s ease'
        }}>
            <div className="monitor-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
                LIVE SIGNAL
                {isRecording && (
                    <span style={{ fontSize: '0.7rem', color: panelColor.border }}>
                        IDEAL SCORE: {confidence}%
                    </span>
                )}
            </div>
            <div className="monitor-content" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <MetricRow label="Energy Level" value={energy} />
                <MetricRow label="Flow Quality" value={pauseQuality} />
                
                {/* Text Sentiment (DistilBERT) */}
                <div className="monitor-row">
                    <div className="monitor-info">
                        <span className="monitor-label">Sentiment (DistilBERT)</span>
                        <span className="monitor-value" style={{ color: sentiment > 0 ? '#80c000' : sentiment < 0 ? '#ff0055' : '#888' }}>
                            {sentiment > 0 ? `+${sentiment}` : sentiment}%
                        </span>
                    </div>
                    <div className="monitor-track">
                        <div 
                            className="monitor-fill" 
                            style={{ 
                                width: `${Math.min(100, Math.abs(sentiment))}%`,
                                backgroundColor: sentiment >= 0 ? '#80c000' : '#ff0055',
                                marginLeft: sentiment >= 0 ? '50%' : `${50 - Math.abs(sentiment) / 2}%`,
                                transform: sentiment >= 0 ? 'none' : 'translateX(-100%)'
                            }}
                        />
                    </div>
                </div>

                {/* Audio Emotion (SpeechBrain) */}
                <div className="monitor-row" style={{ alignItems: 'center' }}>
                    <div className="monitor-info" style={{ flex: 1 }}>
                        <span className="monitor-label">Vocal Tone (SpeechBrain)</span>
                    </div>
                    <div style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: `${currentEmotion.color}22`,
                        color: currentEmotion.color,
                        border: `1px solid ${currentEmotion.color}44`
                    }}>
                        {currentEmotion.label}
                    </div>
                </div>
            </div>

            {/* OpenAI Active Feedback */}
            {latestAiMessage && (
                <div className="live-ai-feedback" style={{ 
                    marginTop: '1rem', 
                    padding: '0.8rem', 
                    background: 'rgba(105, 219, 124, 0.1)', 
                    borderRadius: '8px',
                    borderLeft: '4px solid #69db7c'
                }}>
                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#69db7c', fontWeight: 700, letterSpacing: '1px' }}>
                        OpenAI Coach
                    </span>
                    <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.9rem', lineHeight: '1.4' }}>
                        "{latestAiMessage}"
                    </p>
                </div>
            )}
        </div>
    );
};

export default LiveMonitor;
