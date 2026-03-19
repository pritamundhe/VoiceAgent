'use client';

import Navbar from '../../components/Navbar';
import Link from 'next/link';
import { MODES } from '../../lib/modes';

export default function Practice() {
    const modes = MODES;

    return (
        <div className="app-container">
            <Navbar />
            <main className="practice-container">
                <header className="practice-header">
                    <h1>Choose your scenario</h1>
                    <p>Select a mode to start your AI-powered speech analysis session.</p>
                </header>

                <div className="practice-grid">
                    {modes.map((mode) => (
                        <Link 
                            key={mode.id} 
                            href={`/dashboard?mode=${mode.id}`}
                            style={{ textDecoration: 'none' }}
                            className={`practice-card ${mode.className}`}
                        >
                            <div className="card-bg-icon">{mode.icon}</div>
                            <h3>{mode.title}</h3>
                            <h4>{mode.subtitle}</h4>
                            <p>{mode.description}</p>
                        </Link>
                    ))}
                </div>
            </main>
        </div>
    );
}
