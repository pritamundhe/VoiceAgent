'use client';

import Navbar from '../../components/Navbar';
import Link from 'next/link';

export default function Practice() {
    const modes = [
        { 
            id: 'interview', icon: '💼', title: 'Job Interview', subtitle: 'Technical & Behavioral', 
            description: 'Practice behavioral and technical questions with real-time feedback.',
            className: 'card-dark'
        },
        { 
            id: 'public-speaking', icon: '🎤', title: 'Public', subtitle: 'Speaking', 
            description: 'Master your pacing, clarity, and confidence for the big stage.',
            className: 'card-light'
        },
        { 
            id: 'pitch', icon: '🚀', title: 'Pitch', subtitle: 'Technical',
            description: 'Learn to explain complex concepts simply & persuasively.',
            className: 'card-dark'
        },
        { 
            id: 'casual', icon: '☕', title: 'Casual', subtitle: 'Chat',
            description: 'Improve your conversational flow and reduce filler words.',
            className: 'card-glass'
        },
        { 
            id: 'sales', icon: '💰', title: 'Sales Pitch', subtitle: 'Persuasion',
            description: 'Refine your energy and persuasion with dynamic pacing analysis.',
            className: 'card-light'
        },
        { 
            id: 'storytelling', icon: '📖', title: 'Stories', subtitle: 'Emotional resonance',
            description: 'Enhance emotional resonance and variable pace for better impact.',
            className: 'card-dark'
        },
    ];

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
