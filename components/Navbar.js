'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar({ mode }) {
  const [theme, setTheme] = useState('dark');
  const [user, setUser] = useState(null);
  const [newBadge, setNewBadge] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => { if (data.user) setUser(data.user); })
      .catch(() => {});

    // Check for any recently earned badge (stored briefly in sessionStorage after session analysis)
    const recentBadge = sessionStorage.getItem('newBadgeEarned');
    if (recentBadge) setNewBadge(true);
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

  const navLinks = [
    { href: '/',             label: 'Home' },
    { href: '/practice',     label: 'Practice' },
    { href: '/analytics',    label: 'Analytics' },
    { href: '/leaderboard',  label: 'Leaderboard' },
    { href: '/learning-path',label: 'Learning Path', accent: true },
  ];

  return (
    <nav className="navbar">
      <div className="nav-brand">
        {mode && <span className="mode-badge">{mode}</span>}
      </div>

      <div className="nav-links">
        {navLinks.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`nav-link ${pathname === link.href ? 'active' : ''}`}
            style={link.accent ? { color: 'var(--accent)', fontWeight: 'bold' } : {}}
            onClick={() => { if (link.badge) { setNewBadge(false); sessionStorage.removeItem('newBadgeEarned'); } }}
          >
            {link.label}
            {link.badge && <span className="nav-dot" />}
          </Link>
        ))}
      </div>

      <div className="nav-right">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search users..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                window.location.href = `/search?q=${e.target.value}`;
              }
            }}
          />
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>

        {user ? (
          <div className="user-menu">
            <Link
              href="/profile"
              className="user-profile-link"
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}
            >
              <div className="user-avatar">
                {user.image
                  ? <img src={user.image} alt={user.name} />
                  : user.name?.charAt(0).toUpperCase()
                }
              </div>
              <span className="user-name">{user.name}</span>
            </Link>
            {user.rank && (
              <Link href="/rewards" style={{ textDecoration: 'none' }}>
                <span className="rank-pill">{user.rank}</span>
              </Link>
            )}
            <button onClick={handleSignout} className="signout-btn" title="Sign out">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="auth-links">
            <Link href="/auth/signin" className="nav-link">Sign In</Link>
            <Link href="/auth/signup" className="get-started-btn">Get Started</Link>
          </div>
        )}

        <button onClick={toggleTheme} className="theme-toggle" title="Toggle Light/Dark Mode">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {theme === 'light' ? (
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            ) : (
              <>
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </>
            )}
          </svg>
        </button>
      </div>

      <style jsx>{`
        .nav-right {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }

        .nav-link { position: relative; }
        .nav-dot {
          position: absolute;
          top: -2px;
          right: -8px;
          width: 7px;
          height: 7px;
          background: #a855f7;
          border-radius: 50%;
          box-shadow: 0 0 6px #a855f7;
        }

        .user-menu {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        :global(.user-profile-link) {
          display: flex !important;
          align-items: center !important;
          gap: 0.75rem !important;
          text-decoration: none !important;
          padding: 0.4rem 0.8rem;
          border-radius: 20px;
          background: rgba(255,255,255,0.05);
          transition: background 0.2s;
        }
        :global(.user-profile-link:hover) { background: rgba(255,255,255,0.08); }
        .user-avatar {
          width: 32px; height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          font-weight: bold;
          overflow: hidden;
          border: 2px solid rgba(255,255,255,0.1);
        }
        .user-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .user-name { font-size: 0.85rem; color: var(--text); font-weight: 600; }

        .rank-pill {
          font-size: 0.7rem;
          padding: 0.3rem 0.75rem;
          border-radius: 20px;
          background: var(--text);
          color: var(--bg);
          font-weight: 800;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          transition: opacity 0.2s;
        }
        .rank-pill:hover { opacity: 0.85; }

        .signout-btn {
          background: none;
          border: 1px solid var(--border, #30363d);
          border-radius: 8px;
          padding: 0.4rem 0.5rem;
          color: var(--text-secondary, #8b949e);
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: all 0.2s;
        }
        .signout-btn:hover { border-color: #ef4444; color: #ef4444; }

        .search-bar {
          position: relative;
          display: flex;
          align-items: center;
        }
        .search-bar input {
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 0.5rem 1rem 0.5rem 2.5rem;
          color: var(--text);
          font-size: 0.85rem;
          width: 200px;
          transition: all 0.3s ease;
          outline: none;
        }
        .search-bar svg {
          position: absolute;
          left: 0.85rem;
          width: 1rem;
          height: 1rem;
          color: var(--text-secondary);
        }

        .auth-links { display: flex; align-items: center; gap: 1rem; }
        .get-started-btn {
          background: var(--text);
          color: var(--bg);
          padding: 0.5rem 1.25rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 700;
          text-decoration: none;
          transition: opacity 0.2s;
        }
        .get-started-btn:hover { opacity: 0.85; }
      `}</style>
    </nav>
  );
}
