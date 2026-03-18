'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar({ mode }) {
    const [theme, setTheme] = useState('dark');
    const pathname = usePathname();

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    return (
        <nav className="navbar">
            <div className="nav-brand">
                {/* Brand Name Removed per User Request */}
                {mode && <span className="mode-badge">{mode}</span>}
            </div>
            <div className="nav-links">
                <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>Home</Link>
                <Link href="/dashboard" className={`nav-link ${pathname === '/dashboard' ? 'active' : ''}`}>Dashboard</Link>
                <Link href="/practice" className={`nav-link ${pathname === '/practice' ? 'active' : ''}`}>Practice</Link>
            </div>
            <button onClick={toggleTheme} className="theme-toggle" title="Toggle Light/Dark Mode">
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
        </nav>
    );
}
