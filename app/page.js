'use client';

import Navbar from '../components/Navbar';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="app-container">
      <Navbar />

      <main className="landing-container">
        <div className="landing-hero">
          <div className="hero-content">
            <span className="hero-badge">AI-Powered Speech Analysis</span>
            <h1 className="hero-title">
              Master your<br />
              <span>communication</span>
            </h1>
            <p className="hero-subtitle">
              Real-time transcription, pace tracking, and filler word detection to help you speak with clarity and confidence.
            </p>
            <div className="hero-actions">
              <Link href="/dashboard" className="btn btn-primary btn-large">
                Start recording ↗
              </Link>
              <Link href="/practice" className="btn btn-stop btn-large">
                View practice modes
              </Link>
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-card">
              <div className="visual-header">Live Analysis</div>
              <div className="visual-metrics">
                <div className="vm-item">
                  <span className="vm-label">Pace</span>
                  <span className="vm-val">142 WPM</span>
                </div>
                <div className="vm-item">
                  <span className="vm-label">Fillers</span>
                  <span className="vm-val">0</span>
                </div>
                <div className="vm-item">
                  <span className="vm-label">Fluency</span>
                  <span className="vm-val" style={{ color: '#69db7c' }}>98%</span>
                </div>
              </div>
              <div className="visual-transcript">
                <p>"Welcome to the future of _________ __________. By analyzing your ______ in real time, we can provide immediate feedback..."</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
