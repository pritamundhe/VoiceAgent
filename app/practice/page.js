'use client';

import Navbar from '../../components/Navbar';
import Link from 'next/link';
import { MODES } from '../../lib/modes';

export default function Practice() {
    const modes = MODES;

    return (
        <div className="app-container">
            <Navbar />
            <main className="practice-container" style={{ padding: '1rem 1.25rem', width: '100%', margin: '0 auto', maxWidth: 'none', display: 'block' }}>
                <div className="practice-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '1.2rem',
                    width: '100%',
                    maxWidth: '1500px',
                    margin: '0 auto'
                }}>
                    {modes.map((mode) => (
                        <Link
                            key={mode.id}
                            href={`/dashboard?mode=${mode.id}`}
                            className="spotify-card"
                            style={{
                                textDecoration: 'none',
                                position: 'relative',
                                height: '190px',
                                width: '100%',
                                backgroundColor: '#1a1a1a',
                                borderRadius: '10px',
                                overflow: 'hidden',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.3s cubic-bezier(0.2, 0, 0, 1)'
                            }}
                        >
                            <img
                                src={mode.image}
                                alt={mode.title}
                                style={{
                                    position: 'absolute',
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    filter: 'brightness(0.5)',
                                    opacity: mode.image ? 1 : 0,
                                    transition: 'transform 0.5s ease'
                                }}
                                className="card-image"
                            />
                            <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
                                <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>{mode.title}</h3>
                            </div>
                        </Link>
                    ))}
                </div>
            </main>
        </div>
    );
}
