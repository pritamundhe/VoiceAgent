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
                    <Link href="/analytics" className="read-more-link">#Read more →</Link>
                    <div className="glass-card-5d">
                        <h3>Using artificial intelligence to improve speech</h3>
                        <p>VoiceAgent offers a wide range of tools and techniques that can be used to detect filler words, improve pacing, and create a more confident, powerful speaking presence.</p>
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
                <div className="scroll-btn-5d">
                    Scroll ↓
                </div>

                {/* Partner Logos Strip Bottom */}
                <div className="logos-strip-5d">
                    <span>OpenAI</span>
                    <span>Next.js</span>
                    <span>Vercel</span>
                    <span>React</span>
                    <span>Tailwind</span>
                    <span>VoiceAgent</span>
                </div>
            </main>

            <style jsx>{`
                .home-wrapper-5d {
                    background-color: #030303;
                    background-image: radial-gradient(circle at 50% 50%, #0a0a0a 0%, #000000 100%);
                    min-height: 100vh;
                    overflow: hidden;
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
                    width: 100vw;
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
                    width: 350px;
                    z-index: 10;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                }
                .read-more-link {
                    color: #fff;
                    text-decoration: none;
                    font-size: 0.85rem;
                    font-weight: 600;
                    margin-bottom: 1rem;
                    transition: opacity 0.2s;
                }
                .read-more-link:hover { opacity: 0.7; }
                .glass-card-5d {
                    background: #111111;
                    background: linear-gradient(145deg, rgba(30,30,30,0.9), rgba(15,15,15,0.95));
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 12px;
                    padding: 2rem;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
                }
                .glass-card-5d h3 {
                    font-size: 1.4rem;
                    line-height: 1.3;
                    font-weight: 500;
                    margin: 0 0 1rem 0;
                    color: #ffffff;
                }
                .glass-card-5d p {
                    font-size: 0.85rem;
                    line-height: 1.6;
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
                    justify-content: space-between;
                    z-index: 10;
                }
                .logos-strip-5d span {
                    color: #555555;
                    font-size: 1.2rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
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
