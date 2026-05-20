'use client';

import { useEffect, useState } from 'react';

/**
 * GhostTextOverlay
 * Renders inline ghost-text AI suggestions within the transcript display.
 * 
 * Props:
 *  - ghostText    {string}   The AI-predicted continuation
 *  - isLoading    {boolean}  True while Groq is computing
 *  - isRecording  {boolean}  Only shows when recording is active
 *  - onAccept     {fn}       Called when user presses Tab to accept
 *  - onDismiss    {fn}       Called when user presses Escape to dismiss
 */
export default function GhostTextOverlay({ ghostText, isLoading, isRecording, onAccept, onDismiss }) {
    const [isVisible, setIsVisible] = useState(false);
    const [displayText, setDisplayText] = useState('');

    useEffect(() => {
        if (!isRecording) {
            setIsVisible(false);
            setDisplayText('');
            return;
        }

        if (ghostText) {
            setDisplayText(ghostText);
            setIsVisible(true);
        } else if (!isLoading) {
            // Fade out after a brief delay
            const t = setTimeout(() => {
                setIsVisible(false);
                setDisplayText('');
            }, 300);
            return () => clearTimeout(t);
        }
    }, [ghostText, isLoading, isRecording]);

    // Keyboard shortcut: Tab to accept, Escape to dismiss
    useEffect(() => {
        if (!isRecording) return;
        const handleKey = (e) => {
            if (e.key === 'Tab' && isVisible && ghostText) {
                e.preventDefault();
                onAccept?.();
            }
            if (e.key === 'Escape' && isVisible) {
                onDismiss?.();
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isVisible, ghostText, isRecording, onAccept, onDismiss]);

    if (!isRecording) return null;

    return (
        <>
            {/* Ghost text inline suggestion */}
            {(isVisible || isLoading) && (
                <span className={`ghost-text-container ${isVisible ? 'visible' : ''} ${isLoading ? 'loading' : ''}`}>
                    {isLoading && !isVisible ? (
                        <span className="ghost-dots">
                            <span /><span /><span />
                        </span>
                    ) : (
                        <>
                            <span className="ghost-text">{displayText}</span>
                            {isVisible && ghostText && (
                                <span className="ghost-hint">Tab ↵</span>
                            )}
                        </>
                    )}
                </span>
            )}

            {/* Floating indicator bar */}
            <div className={`autocomplete-bar ${(isVisible || isLoading) ? 'bar-visible' : ''}`}>
                <div className="bar-inner">
                    <span className="bar-icon">✦</span>
                    <span className="bar-label">AI Autocomplete</span>
                    {isLoading && <span className="bar-spinner" />}
                    {isVisible && ghostText && (
                        <>
                            <span className="bar-suggestion">"{displayText}"</span>
                            <span className="bar-actions">
                                <kbd onClick={onAccept}>Tab</kbd> accept
                                <kbd onClick={onDismiss} style={{ marginLeft: '0.5rem' }}>Esc</kbd> dismiss
                            </span>
                        </>
                    )}
                </div>
            </div>

            <style jsx>{`
                /* ── Ghost Text Inline ── */
                .ghost-text-container {
                    display: inline;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                    pointer-events: none;
                }
                .ghost-text-container.visible {
                    opacity: 1;
                }

                .ghost-text {
                    color: rgba(99, 102, 241, 0.6);
                    font-style: italic;
                    font-size: inherit;
                    background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.1));
                    border-radius: 4px;
                    padding: 0 3px;
                    margin-left: 2px;
                    border-bottom: 1px dashed rgba(99,102,241,0.4);
                    animation: ghostPulse 2s ease-in-out infinite;
                }

                @keyframes ghostPulse {
                    0%, 100% { opacity: 0.6; }
                    50% { opacity: 0.85; }
                }

                .ghost-hint {
                    display: inline-flex;
                    align-items: center;
                    margin-left: 0.4rem;
                    font-size: 0.65rem;
                    font-weight: 700;
                    color: rgba(99, 102, 241, 0.7);
                    background: rgba(99,102,241,0.12);
                    border: 1px solid rgba(99,102,241,0.25);
                    border-radius: 4px;
                    padding: 0 0.35rem;
                    font-style: normal;
                    letter-spacing: 0.03em;
                    vertical-align: middle;
                    line-height: 1.6;
                }

                /* ── Loading Dots ── */
                .ghost-dots {
                    display: inline-flex;
                    gap: 3px;
                    align-items: center;
                    margin-left: 4px;
                    vertical-align: middle;
                }
                .ghost-dots span {
                    width: 4px;
                    height: 4px;
                    border-radius: 50%;
                    background: rgba(99, 102, 241, 0.5);
                    animation: dotBounce 1.2s ease-in-out infinite;
                }
                .ghost-dots span:nth-child(2) { animation-delay: 0.2s; }
                .ghost-dots span:nth-child(3) { animation-delay: 0.4s; }

                @keyframes dotBounce {
                    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
                    40% { transform: scale(1); opacity: 1; }
                }

                /* ── Bottom Floating Bar ── */
                .autocomplete-bar {
                    position: fixed;
                    bottom: 2rem;
                    left: 50%;
                    transform: translateX(-50%) translateY(120%);
                    transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease;
                    opacity: 0;
                    z-index: 9000;
                    pointer-events: none;
                }
                .autocomplete-bar.bar-visible {
                    transform: translateX(-50%) translateY(0);
                    opacity: 1;
                    pointer-events: all;
                }

                .bar-inner {
                    display: flex;
                    align-items: center;
                    gap: 0.6rem;
                    background: rgba(13, 13, 23, 0.92);
                    backdrop-filter: blur(20px) saturate(180%);
                    border: 1px solid rgba(99, 102, 241, 0.35);
                    border-radius: 100px;
                    padding: 0.55rem 1.1rem;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.1), inset 0 1px 0 rgba(255,255,255,0.05);
                    white-space: nowrap;
                    font-size: 0.82rem;
                    color: #e2e8f0;
                }

                .bar-icon {
                    font-size: 0.9rem;
                    background: linear-gradient(135deg, #6366f1, #a855f7);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    animation: starSpin 3s linear infinite;
                }
                @keyframes starSpin {
                    0% { filter: hue-rotate(0deg); }
                    100% { filter: hue-rotate(360deg); }
                }

                .bar-label {
                    font-size: 0.72rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: #8b949e;
                }

                .bar-spinner {
                    width: 14px;
                    height: 14px;
                    border: 2px solid rgba(99,102,241,0.2);
                    border-top-color: #6366f1;
                    border-radius: 50%;
                    animation: spin 0.7s linear infinite;
                    display: inline-block;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .bar-suggestion {
                    color: rgba(168,85,247,0.9);
                    font-style: italic;
                    font-size: 0.84rem;
                    max-width: 280px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .bar-actions {
                    display: flex;
                    align-items: center;
                    gap: 0.2rem;
                    font-size: 0.72rem;
                    color: #8b949e;
                }

                .bar-actions kbd {
                    display: inline-block;
                    background: rgba(255,255,255,0.08);
                    border: 1px solid rgba(255,255,255,0.15);
                    border-radius: 5px;
                    padding: 0.1rem 0.4rem;
                    font-size: 0.7rem;
                    font-family: monospace;
                    cursor: pointer;
                    transition: background 0.15s;
                    color: #e2e8f0;
                }
                .bar-actions kbd:hover {
                    background: rgba(99,102,241,0.2);
                    border-color: rgba(99,102,241,0.4);
                }
            `}</style>
        </>
    );
}
