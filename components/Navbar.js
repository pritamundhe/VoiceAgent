'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar({ mode }) {
    const [theme, setTheme] = useState('dark');
    const [user, setUser] = useState(null);
    const pathname = usePathname();

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);

        // Check if user is logged in
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (data.user) setUser(data.user);
            })
            .catch(err => console.error('Auth check failed', err));
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    const handleSignout = async () => {
        try {
            await fetch('/api/auth/signout', { method: 'POST' });
            window.location.href = '/';
        } catch (err) {
            console.error('Signout failed', err);
        }
    };

    return (
        <nav className="navbar">
            <div className="nav-brand">
                {/* Brand Name Removed per User Request */}
                {mode && <span className="mode-badge">{mode}</span>}
            </div>

            <div className="nav-links">
                <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>Home</Link>
                <Link href="/practice" className={`nav-link ${pathname === '/practice' ? 'active' : ''}`}>Practice</Link>
                <Link href="/analytics" className={`nav-link ${pathname === '/analytics' ? 'active' : ''}`}>Analytics</Link>
            </div>

            <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div className="search-bar" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input 
                        type="text" 
                        placeholder="Search users..." 
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                window.location.href = `/search?q=${e.target.value}`;
                            }
                        }}
                        style={{
                            background: 'var(--surface-2)',
                            border: '1px solid var(--border)',
                            borderRadius: '20px',
                            padding: '0.5rem 1rem 0.5rem 2.5rem',
                            color: 'var(--text)',
                            fontSize: '0.85rem',
                            width: '200px',
                            transition: 'all 0.3s ease',
                            outline: 'none'
                        }}
                    />
                    <svg 
                        style={{ position: 'absolute', left: '0.85rem', width: '1rem', height: '1rem', color: 'var(--text-secondary)' }}
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    >
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </div>

                {user ? (
                    <div className="user-menu" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Link href="/profile" style={{ fontSize: '0.9rem', color: 'var(--text)', fontWeight: 600, textDecoration: 'none', cursor: 'pointer' }}>Hello, {user.name}</Link>
                        <button onClick={handleSignout} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Sign Out</button>
                    </div>
                ) : (
                    <div className="auth-links" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Link href="/auth/signin" className="nav-link">Sign In</Link>
                        <Link href="/auth/signup" className="nav-link">Sign Up</Link>
                    </div>
                )}

                <button onClick={toggleTheme} className="theme-toggle" title="Toggle Light/Dark Mode" style={{ margin: 0 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {theme === 'light' ? (
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                        ) : (
                            <>
                                <circle cx="12" cy="12" r="5"></circle>
                                <line x1="12" y1="1" x2="12" y2="3"></line>
                                <line x1="12" y1="21" x2="12" y2="23"></line>
                                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                                <line x1="1" y1="12" x2="3" y2="12"></line>
                                <line x1="21" y1="12" x2="23" y2="12"></line>
                                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                            </>
                        )}
                    </svg>
                </button>
            </div>
        </nav>
    );
}
