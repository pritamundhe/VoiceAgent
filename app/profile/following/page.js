'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function FollowingPage() {
    const [following, setFollowing] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (data.user) {
                    setFollowing(data.user.following || []);
                } else {
                    router.push('/auth/signin');
                }
            })
            .catch(err => console.error('Error fetching following list:', err))
            .finally(() => setLoading(false));
    }, [router]);

    if (loading) return <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)' }}>Loading...</div>;

    return (
        <div className="following-container" style={{ background: 'var(--bg)', minHeight: '100vh' }}>
            <Navbar mode="Following" />
            
            <main style={{ padding: '8rem 2rem 4rem', maxWidth: '800px', margin: '0 auto' }}>
                <header style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button 
                        onClick={() => router.back()}
                        style={{
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            color: 'var(--text)',
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease'
                        }}
                        aria-label="Go back"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                        </svg>
                    </button>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text)' }}>Following</h1>
                </header>

                <div className="following-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {following.length > 0 ? (
                        following.map(user => (
                            <Link 
                                key={user._id} 
                                href={`/profile/${user._id}`}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1.5rem',
                                    padding: '1.25rem 2rem',
                                    background: 'var(--surface)',
                                    borderRadius: '16px',
                                    border: '1px solid var(--border)',
                                    textDecoration: 'none',
                                    color: 'inherit',
                                    transition: 'all 0.2s ease'
                                }}
                                className="following-card"
                            >
                                <div style={{
                                    width: '56px',
                                    height: '56px',
                                    borderRadius: '50%',
                                    background: 'var(--surface-2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.25rem',
                                    fontWeight: 700,
                                    color: 'var(--accent)',
                                    border: '1px solid var(--border)',
                                    overflow: 'hidden',
                                    flexShrink: 0
                                }}>
                                    {user.image ? (
                                        <img src={user.image} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        user.name?.[0].toUpperCase() || '?'
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.1rem' }}>
                                        {user.name}
                                    </h3>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        {user.email}
                                    </p>
                                </div>
                                <span style={{ color: 'var(--accent)', fontSize: '0.9rem', fontWeight: 600 }}>View Profile →</span>
                            </Link>
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--surface)', borderRadius: '24px', border: '1px solid var(--border)' }}>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>You aren't following anyone yet.</p>
                            <Link href="/search" style={{ color: 'var(--accent)', marginTop: '1rem', display: 'inline-block', fontWeight: 600 }}>Discover users to follow</Link>
                        </div>
                    )}
                </div>
            </main>

            <style jsx>{`
                .following-card:hover {
                    background: var(--surface-2) !important;
                    border-color: var(--accent);
                    transform: translateY(-2px);
                }
            `}</style>
        </div>
    );
}
