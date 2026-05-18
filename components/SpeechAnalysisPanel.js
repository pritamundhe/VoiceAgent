'use client';

import React from 'react';

const SpeechAnalysisPanel = ({ metrics, isRecording }) => {
    const { energy, stability, pauseQuality, clarity, confidence } = metrics;

    const getStatus = (score) => {
        if (score >= 80) return { label: 'CALM', color: '#80c000', textColor: '#000' };
        if (score >= 40) return { label: 'MILD', color: '#ff9000', textColor: '#000' };
        return { label: 'HIGH', color: '#ff0055', textColor: '#fff' };
    };

    const status = getStatus(confidence);

    const MetricBar = ({ label, value }) => (
        <div className="diagnostic-metric">
            <span className="diagnostic-label">{label}: {(value / 100).toFixed(3)}</span>
            <div className="diagnostic-bar-container">
                <div
                    className="diagnostic-bar-fill"
                    style={{
                        width: `${Math.min(100, Math.max(0, value))}%`,
                        backgroundColor: status.color
                    }}
                />
            </div>
        </div>
    );

    return (
        <div className="diagnostic-panel">
            <div className="diagnostic-header" style={{ backgroundColor: isRecording ? status.color : '#333' }}>
                <h2 style={{ color: isRecording ? status.textColor : '#fff' }}>{isRecording ? status.label : 'IDLE'}</h2>
                <p style={{ color: isRecording ? status.textColor : '#fff', opacity: 0.8 }}>
                    Score: {(confidence / 100).toFixed(2)}
                </p>
            </div>

            <div className="diagnostic-body">
                <MetricBar label="Energy" value={energy} />
            </div>
        </div>
    );
};

export default SpeechAnalysisPanel;
