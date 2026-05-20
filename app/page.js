'use client';

import Navbar from '../components/Navbar';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function LandingPage() {
    const [mouseX, setMouseX] = useState(0);
    const [mouseY, setMouseY] = useState(0);

    useEffect(() => {
        const handleMouse = (e) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 40;
            const y = (e.clientY / window.innerHeight - 0.5) * 40;
            setMouseX(x);
            setMouseY(y);
        };
        window.addEventListener('mousemove', handleMouse);
        return () => window.removeEventListener('mousemove', handleMouse);
    }, []);

    return (
        <div className="home-wrapper-5d">
            <div className="nav-container">
                <Navbar />
            </div>

            <main className="hero-container-5d">
                {/* 3D Waves Terrain Container */}
                <div 
                    className="waves-wrapper-5d"
                    style={{ transform: `translateX(-50%) translateY(-50%) rotateX(${65 - mouseY * 0.5}deg) rotateZ(${-30 + mouseX}deg)` }}
                >
                    {Array.from({ length: 15 }).map((_, row) => (
                        <div className="wave-row" key={row}>
                            {Array.from({ length: 15 }).map((_, col) => {
                                const delay = Math.sin(row * 0.5) + Math.cos(col * 0.5);
                                return <div className="wave-cube" key={col} style={{ '--delay': `${delay}s` }}></div>;
                            })}
                        </div>
                    ))}
                </div>

                {/* Massive Typography Left */}
                <div className="huge-text-block">
                    <div className="line-text">VOICE</div>
                    <div className="line-text gradient-5d">PRACTICE</div>
                    <div className="line-text">MASTERY#</div>
                </div>

                {/* Info Card Top Right */}
                <div className="info-card-container">
                    <div className="glass-card-5d">
                        <div className="card-header">
                            <span className="card-tag">SYSTEM FEATURES</span>
                            <h3>Train Your Spoken English</h3>
                        </div>
                        <div className="features-list">
                            <div className="feature-item">
                                <div className="feature-icon">
                                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>
                                </div>
                                <div className="feature-text">
                                    <h4>Listening Dictation</h4>
                                    <p>Listen to realistic prompts & transcribe speech to evaluate auditory recall.</p>
                                </div>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">
                                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                                </div>
                                <div className="feature-text">
                                    <h4>Read Aloud Accuracy</h4>
                                    <p>Read contextual sentences aloud with real-time text-alignment feedback.</p>
                                </div>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">
                                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                                </div>
                                <div className="feature-text">
                                    <h4>Speaking Coherence</h4>
                                    <p>Synthesize structured opinions on random scenarios with AI evaluations.</p>
                                </div>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">
                                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                                </div>
                                <div className="feature-text">
                                    <h4>Analytics Dashboard</h4>
                                    <p>Track your speech coherence metrics, grammar, and XP points over time.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Bottom Left */}
                <div className="stats-list-5d">
                    <div className="stat-row">
                        <span className="stat-label">1. Active Learners</span>
                        <span className="stat-val">10,424</span>
                    </div>
                    <div className="stat-row">
                        <span className="stat-label">2. AI Analysis Accuracy</span>
                        <span className="stat-val">98.2%</span>
                    </div>
                    <div className="stat-row">
                        <span className="stat-label">3. Practice Scenarios</span>
                        <span className="stat-val">50+</span>
                    </div>
                </div>

                {/* Scroll Indicator Bottom Right */}
                <div 
                    className="scroll-btn-5d"
                    onClick={() => {
                        document.getElementById('details-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    style={{ cursor: 'pointer' }}
                >
                    Scroll ↓
                </div>

                {/* Partner Logos Strip Bottom */}
                <div className="logos-strip-5d">
                    <span className="footer-tag">PTE Preparation</span>
                    <span className="footer-divider">|</span>
                    <span className="footer-tag">IELTS Training</span>
                    <span className="footer-divider">|</span>
                    <span className="footer-tag">TOEFL Exercises</span>
                    <span className="footer-divider">|</span>
                    <span className="footer-tag">AI Conversation Coach</span>
                </div>
            </main>

            {/* Section 2: How it works & detailed features */}
            <section id="details-section" className="details-section-5d">
                <div className="section-header">
                    <span className="section-tag">METHODOLOGY</span>
                    <h2>Engineered for Fluent Expression</h2>
                    <p className="section-subtitle">A systematic, data-backed approach to target speaking, reading, and listening competency.</p>
                </div>

                <div className="grid-3col">
                    <div className="detail-card">
                        <div className="detail-num">01</div>
                        <h3>Interactive Auditory Tasks</h3>
                        <p>Evaluate your raw dictation and keyword retention. The AI engine reads statements aloud, hides the transcript, and scores your transcription accuracy.</p>
                        <div className="detail-card-bg-glow"></div>
                    </div>
                    <div className="detail-card">
                        <div className="detail-num">02</div>
                        <h3>Fluency & Pronunciation Metrics</h3>
                        <p>Analyze how closely your speech matches native rhythm patterns. Perfect your pronunciation through reading blocks generated by the LLM helper.</p>
                        <div className="detail-card-bg-glow"></div>
                    </div>
                    <div className="detail-card">
                        <div className="detail-num">03</div>
                        <h3>Coherent Discussion Mapping</h3>
                        <p>Synthesize structured opinions on IELTS/TOEFL-style situations. The LLM acts as an examiner, grading your logic, vocabulary depth, and structure.</p>
                        <div className="detail-card-bg-glow"></div>
                    </div>
                </div>
            </section>

            {/* Section 3: Platform Highlight Specs */}
            <section className="specs-section-5d">
                <div className="specs-container">
                    <div className="spec-item-horizontal">
                        <div className="spec-info">
                            <span className="spec-badge">TTS POWERED</span>
                            <h3>High-Fidelity Speech Generation</h3>
                            <p>Train your ears with human-like pronunciation. Our speech synthesis backend dynamically renders custom sentences with realistic prosody, accent options, and natural pauses.</p>
                        </div>
                        <div className="spec-visual">
                            <div className="wave-bar-animation">
                                <span className="bar"></span>
                                <span className="bar"></span>
                                <span className="bar"></span>
                                <span className="bar"></span>
                                <span className="bar"></span>
                                <span className="bar"></span>
                                <span className="bar"></span>
                            </div>
                        </div>
                    </div>

                    <div className="spec-item-horizontal reverse">
                        <div className="spec-info">
                            <span className="spec-badge">METRICS TRACKER</span>
                            <h3>Real-time Analytics Feed</h3>
                            <p>Unlock structured breakdowns of your performance. Monitor your cumulative progression, grammar corrections, XP milestones, and active streak metrics via your dashboard.</p>
                        </div>
                        <div className="spec-visual">
                            <div className="chart-preview-glow">
                                <div className="line-indicator"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer Section */}
            <footer className="footer-container-5d">
                <div className="footer-top">
                    <div className="footer-brand">
                        <span className="brand-logo">SpokenEdge</span>
                        <p>Next-generation speech coaching platform built for standard language competency preparation.</p>
                    </div>
                    <div className="footer-links-grid">
                        <div className="footer-links-col">
                            <h4>Platform</h4>
                            <Link href="/dashboard">Dashboard</Link>
                            <Link href="/learning-path">Learning Path</Link>
                            <Link href="/practice">Practice</Link>
                        </div>
                        <div className="footer-links-col">
                            <h4>Analytics</h4>
                            <Link href="/analytics">Speech Metrics</Link>
                            <Link href="/session-report">Reports</Link>
                            <Link href="/profile">Profile</Link>
                        </div>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} SpokenEdge. All rights reserved.</p>
                    <div className="footer-legal">
                        <span>Terms of Service</span>
                        <span className="dot">•</span>
                        <span>Privacy Policy</span>
                    </div>
                </div>
            </footer>

            <style jsx>{`
                .home-wrapper-5d {
                    background-color: #030303;
                    background-image: radial-gradient(circle at 50% 50%, #0a0a0a 0%, #000000 100%);
                    min-height: 100vh;
                    overflow-x: hidden;
                    font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif;
                    color: #fff;
                    position: relative;
                }

                .nav-container {
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    z-index: 100;
                }

                .hero-container-5d {
                    position: relative;
                    width: 100%;
                    box-sizing: border-box;
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    padding: 8rem 4rem 4rem 4rem;
                }

                /* --- MASSIVE TYPOGRAPHY --- */
                .huge-text-block {
                    position: absolute;
                    top: 15%;
                    left: 4rem;
                    z-index: 10;
                    display: flex;
                    flex-direction: column;
                }
                .line-text {
                    font-family: "Arial Black", "Impact", sans-serif;
                    font-size: clamp(4rem, 9vw, 130px);
                    font-weight: 900;
                    line-height: 0.85;
                    letter-spacing: -0.04em;
                    text-transform: uppercase;
                    color: #ffffff;
                }
                .gradient-5d {
                    background: linear-gradient(90deg, #a8b1ff 0%, #d57bff 50%, #ea58ff 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    animation: gradientShift 4s ease infinite alternate;
                }
                @keyframes gradientShift {
                    0% { filter: hue-rotate(0deg); }
                    100% { filter: hue-rotate(20deg); }
                }

                /* --- 3D WAVES TERRAIN ANIMATION --- */
                .waves-wrapper-5d {
                    position: absolute;
                    top: 55%;
                    left: 65%;
                    width: 600px;
                    height: 600px;
                    transform-style: preserve-3d;
                    perspective: 1200px;
                    z-index: 5;
                    pointer-events: none;
                    transition: transform 0.2s ease-out;
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }

                .wave-row {
                    display: flex;
                    gap: 15px;
                    transform-style: preserve-3d;
                }

                .wave-cube {
                    width: 25px;
                    height: 25px;
                    background: rgba(15, 15, 15, 0.9);
                    border: 1px solid rgba(168, 85, 247, 0.4);
                    border-radius: 4px;
                    transform-style: preserve-3d;
                    animation: terrainWave 3s infinite ease-in-out alternate;
                    animation-delay: var(--delay);
                    box-shadow: inset 0 0 10px rgba(234, 88, 255, 0.1);
                }

                @keyframes terrainWave {
                    0% { 
                        transform: translateZ(-30px) scale(0.9); 
                        border-color: rgba(0, 240, 255, 0.2); 
                        box-shadow: inset 0 0 10px rgba(0, 240, 255, 0.1); 
                    }
                    100% { 
                        transform: translateZ(90px) scale(1.1); 
                        border-color: rgba(234, 88, 255, 0.9); 
                        box-shadow: inset 0 0 20px rgba(234, 88, 255, 0.6), 0 0 30px rgba(234, 88, 255, 0.3); 
                        background: rgba(40, 10, 40, 0.9); 
                    }
                }

                /* --- TOP RIGHT CARD --- */
                .info-card-container {
                    position: absolute;
                    top: 15%;
                    right: 4rem;
                    width: 380px;
                    z-index: 10;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                }
                .glass-card-5d {
                    background: linear-gradient(145deg, rgba(20,20,20,0.95), rgba(10,10,10,0.98));
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 16px;
                    padding: 1.8rem;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.6);
                    width: 100%;
                }
                .card-header {
                    margin-bottom: 1.5rem;
                }
                .card-tag {
                    font-size: 0.7rem;
                    font-weight: 800;
                    letter-spacing: 0.08em;
                    color: #a8b1ff;
                    text-transform: uppercase;
                }
                .glass-card-5d h3 {
                    font-size: 1.3rem;
                    font-weight: 700;
                    margin: 0.2rem 0 0 0;
                    color: #ffffff;
                }
                .features-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1.25rem;
                }
                .feature-item {
                    display: flex;
                    gap: 0.9rem;
                    align-items: flex-start;
                }
                .feature-icon {
                    color: #a8b1ff;
                    background: rgba(168, 177, 255, 0.1);
                    padding: 0.5rem;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .feature-text h4 {
                    font-size: 0.9rem;
                    font-weight: 600;
                    margin: 0 0 0.15rem 0;
                    color: #ffffff;
                }
                .feature-text p {
                    font-size: 0.78rem;
                    line-height: 1.4;
                    color: #888888;
                    margin: 0;
                }

                /* --- BOTTOM LEFT STATS --- */
                .stats-list-5d {
                    position: absolute;
                    bottom: 6rem;
                    left: 4rem;
                    width: 400px;
                    z-index: 10;
                    display: flex;
                    flex-direction: column;
                }
                .stat-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 0.8rem 0;
                    border-top: 1px solid rgba(255,255,255,0.15);
                    font-size: 0.85rem;
                }
                .stat-row:last-child {
                    border-bottom: 1px solid rgba(255,255,255,0.15);
                }
                .stat-label {
                    color: #dddddd;
                    font-weight: 500;
                }
                .stat-val {
                    color: #888888;
                    font-family: monospace;
                }

                /* --- BOTTOM RIGHT BUTTON --- */
                .scroll-btn-5d {
                    position: absolute;
                    bottom: 6rem;
                    right: 4rem;
                    z-index: 10;
                    background: #1a1a1a;
                    border: 1px solid inset rgba(255,255,255,0.1);
                    color: #aaaaaa;
                    padding: 0.6rem 1.2rem;
                    border-radius: 8px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .scroll-btn-5d:hover {
                    background: #222;
                    color: #fff;
                }

                /* --- BOTTOM LOGOS STRIP --- */
                .logos-strip-5d {
                    position: absolute;
                    bottom: 2rem;
                    left: 4rem;
                    right: 4rem;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 2rem;
                    z-index: 10;
                }
                .footer-tag {
                    color: #666666;
                    font-size: 0.8rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    transition: color 0.2s;
                }
                .footer-tag:hover {
                    color: #a8b1ff;
                }
                .footer-divider {
                    color: #333333;
                    font-size: 0.8rem;
                    font-weight: 300;
                }

                /* --- DETAILS SECTION --- */
                .details-section-5d {
                    padding: 8rem 4rem;
                    background: #050505;
                    border-top: 1px solid rgba(255,255,255,0.05);
                    position: relative;
                    z-index: 10;
                }
                .section-header {
                    text-align: center;
                    margin-bottom: 5rem;
                }
                .section-tag {
                    font-size: 0.75rem;
                    font-weight: 800;
                    letter-spacing: 0.15em;
                    color: #a8b1ff;
                    text-transform: uppercase;
                    margin-bottom: 0.5rem;
                    display: block;
                }
                .section-header h2 {
                    font-size: 3rem;
                    font-weight: 800;
                    letter-spacing: -0.03em;
                    margin: 0 0 1rem 0;
                    color: #fff;
                }
                .section-subtitle {
                    font-size: 1.1rem;
                    color: #888;
                    max-width: 600px;
                    margin: 0 auto;
                    line-height: 1.6;
                }
                .grid-3col {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 2.5rem;
                }
                .detail-card {
                    background: linear-gradient(145deg, rgba(20,20,20,0.4), rgba(10,10,10,0.6));
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 20px;
                    padding: 3rem 2.5rem;
                    position: relative;
                    overflow: hidden;
                    transition: transform 0.3s, border-color 0.3s;
                }
                .detail-card:hover {
                    transform: translateY(-8px);
                    border-color: rgba(168, 177, 255, 0.2);
                }
                .detail-num {
                    font-family: monospace;
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: #a8b1ff;
                    opacity: 0.6;
                    margin-bottom: 2rem;
                }
                .detail-card h3 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin: 0 0 1rem 0;
                    color: #fff;
                }
                .detail-card p {
                    font-size: 0.95rem;
                    line-height: 1.7;
                    color: #888;
                    margin: 0;
                }
                .detail-card-bg-glow {
                    position: absolute;
                    bottom: -50px;
                    right: -50px;
                    width: 150px;
                    height: 150px;
                    background: radial-gradient(circle, rgba(168, 177, 255, 0.08) 0%, transparent 70%);
                    pointer-events: none;
                }

                /* --- SPECS SECTION --- */
                .specs-section-5d {
                    padding: 4rem 4rem 8rem 4rem;
                    background: #050505;
                    position: relative;
                    z-index: 10;
                }
                .specs-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    gap: 6rem;
                }
                .spec-item-horizontal {
                    display: flex;
                    align-items: center;
                    gap: 5rem;
                }
                .spec-item-horizontal.reverse {
                    flex-direction: row-reverse;
                }
                .spec-info {
                    flex: 1.2;
                }
                .spec-badge {
                    font-size: 0.7rem;
                    font-weight: 800;
                    letter-spacing: 0.1em;
                    color: #d57bff;
                    background: rgba(213, 123, 255, 0.1);
                    padding: 0.3rem 0.8rem;
                    border-radius: 20px;
                    display: inline-block;
                    margin-bottom: 1.2rem;
                }
                .spec-info h3 {
                    font-size: 2.2rem;
                    font-weight: 800;
                    letter-spacing: -0.02em;
                    margin: 0 0 1.2rem 0;
                    color: #fff;
                }
                .spec-info p {
                    font-size: 1rem;
                    line-height: 1.7;
                    color: #888;
                    margin: 0;
                }
                .spec-visual {
                    flex: 0.8;
                    height: 250px;
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    overflow: hidden;
                }
                .wave-bar-animation {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    height: 80px;
                }
                .bar {
                    width: 6px;
                    height: 80px;
                    background: linear-gradient(180deg, #d57bff 0%, #a8b1ff 100%);
                    border-radius: 4px;
                    animation: pulseBar 1.2s infinite ease-in-out alternate;
                }
                .bar:nth-child(2) { animation-delay: 0.2s; }
                .bar:nth-child(3) { animation-delay: 0.4s; }
                .bar:nth-child(4) { animation-delay: 0.6s; }
                .bar:nth-child(5) { animation-delay: 0.8s; }
                .bar:nth-child(6) { animation-delay: 0.3s; }
                .bar:nth-child(7) { animation-delay: 0.5s; }
                
                @keyframes pulseBar {
                    0% { transform: scaleY(0.2); }
                    100% { transform: scaleY(1); }
                }

                .chart-preview-glow {
                    width: 80%;
                    height: 4px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 2px;
                    position: relative;
                    box-shadow: 0 0 20px rgba(168, 177, 255, 0.2);
                }
                .line-indicator {
                    position: absolute;
                    left: 0; top: 0; bottom: 0;
                    width: 70%;
                    background: linear-gradient(90deg, #a8b1ff, #ea58ff);
                    border-radius: 2px;
                    box-shadow: 0 0 15px rgba(234, 88, 255, 0.8);
                    animation: activeLine 3s infinite ease-in-out alternate;
                }
                @keyframes activeLine {
                    0% { width: 30%; }
                    100% { width: 90%; }
                }

                /* --- FOOTER CONTAINER --- */
                .footer-container-5d {
                    background: #030303;
                    border-top: 1px solid rgba(255,255,255,0.05);
                    padding: 6rem 4rem 4rem 4rem;
                    position: relative;
                    z-index: 10;
                }
                .footer-top {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 4rem;
                    flex-wrap: wrap;
                    gap: 3rem;
                }
                .footer-brand {
                    max-width: 320px;
                }
                .brand-logo {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: #fff;
                    letter-spacing: -0.03em;
                    margin-bottom: 1rem;
                    display: block;
                }
                .footer-brand p {
                    font-size: 0.85rem;
                    line-height: 1.6;
                    color: #666;
                    margin: 0;
                }
                .footer-links-grid {
                    display: flex;
                    gap: 6rem;
                }
                .footer-links-col {
                    display: flex;
                    flex-direction: column;
                    gap: 0.8rem;
                }
                .footer-links-col h4 {
                    font-size: 0.8rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: #fff;
                    margin: 0 0 0.5rem 0;
                }
                .footer-links-col a {
                    font-size: 0.85rem;
                    color: #666;
                    text-decoration: none;
                    transition: color 0.2s;
                }
                .footer-links-col a:hover {
                    color: #a8b1ff;
                }
                .footer-bottom {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-top: 1px solid rgba(255,255,255,0.05);
                    padding-top: 2.5rem;
                    flex-wrap: wrap;
                    gap: 1.5rem;
                }
                .footer-bottom p {
                    font-size: 0.8rem;
                    color: #555;
                    margin: 0;
                }
                .footer-legal {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                }
                .footer-legal span {
                    font-size: 0.8rem;
                    color: #555;
                    cursor: pointer;
                    transition: color 0.2s;
                }
                .footer-legal span:hover {
                    color: #666;
                }
                .dot {
                    font-size: 0.5rem;
                    color: #333;
                }

                @media (max-width: 900px) {
                    .grid-3col {
                        grid-template-columns: 1fr;
                        gap: 1.5rem;
                    }
                    .spec-item-horizontal, .spec-item-horizontal.reverse {
                        flex-direction: column;
                        gap: 2.5rem;
                        align-items: stretch;
                    }
                    .spec-visual {
                        height: 200px;
                    }
                    .footer-top {
                        flex-direction: column;
                        gap: 2rem;
                    }
                    .footer-links-grid {
                        gap: 3rem;
                        flex-wrap: wrap;
                    }
                    .details-section-5d {
                        padding: 6rem 2rem;
                    }
                    .specs-section-5d {
                        padding: 2rem 2rem 6rem 2rem;
                    }
                    .footer-container-5d {
                        padding: 4rem 2rem 2rem 2rem;
                    }
                }

                @media (max-width: 1100px) {
                    .line-text { font-size: 12vw; }
                    .rings-wrapper-5d { left: 50%; scale: 0.7; }
                    .info-card-container { display: none; }
                }
                @media (max-width: 768px) {
                    .line-text { font-size: 14vw; }
                    .stats-list-5d { width: 300px; bottom: 8rem; left: 2rem; }
                    .scroll-btn-5d { bottom: 8rem; right: 2rem; }
                    .logos-strip-5d { flex-wrap: wrap; justify-content: center; gap: 1rem; bottom: 1rem; }
                    .huge-text-block { left: 2rem; top: 15%; }
                }
            `}</style>
        </div>
    );
}
