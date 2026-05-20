'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '../../components/Navbar';

const RANK_COLORS = {
  Master:       { bg: '#3d1a6b', border: '#a855f7', text: '#d8b4fe' },
  Expert:       { bg: '#1a3a6b', border: '#3b82f6', text: '#93c5fd' },
  Advanced:     { bg: '#1a4a2e', border: '#22c55e', text: '#86efac' },
  Intermediate: { bg: '#4a3a1a', border: '#f59e0b', text: '#fcd34d' },
  Beginner:     { bg: '#4a2020', border: '#ef4444', text: '#fca5a5' },
  Newbie:       { bg: '#2a2a3a', border: '#6b7280', text: '#9ca3af' },
};

const TIER_LABELS = {
  alltime: 'All Time',
  weekly:  'This Week',
  monthly: 'This Month',
};

function RankBadge({ rank }) {
  const colors = RANK_COLORS[rank] || RANK_COLORS.Newbie;
  return (
    <span style={{
      background: colors.bg,
      border: `1px solid ${colors.border}`,
      color: colors.text,
      padding: '0.2rem 0.6rem',
      borderRadius: '6px',
      fontSize: '0.65rem',
      fontWeight: 800,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
    }}>
      {rank}
    </span>
  );
}

function LeaderRow({ user, isCurrentUser }) {
  const isTop3 = user.position <= 3;
  const topStyles = {
    1: { 
      borderLeft: '4px solid #f59e0b',
      background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.06) 0%, rgba(245, 158, 11, 0.01) 100%)',
      posClass: 'pos-gold',
      glow: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.35))'
    },
    2: { 
      borderLeft: '4px solid #9ca3af',
      background: 'linear-gradient(90deg, rgba(156, 163, 175, 0.05) 0%, rgba(156, 163, 175, 0.01) 100%)',
      posClass: 'pos-silver',
      glow: 'drop-shadow(0 0 6px rgba(156, 163, 175, 0.2))'
    },
    3: { 
      borderLeft: '4px solid #cd7c3e',
      background: 'linear-gradient(90deg, rgba(205, 124, 62, 0.05) 0%, rgba(205, 124, 62, 0.01) 100%)',
      posClass: 'pos-bronze',
      glow: 'drop-shadow(0 0 6px rgba(205, 124, 62, 0.2))'
    }
  };

  const style = isTop3 ? topStyles[user.position] : null;

  return (
    <div 
      className={`leader-row ${isCurrentUser ? 'current-user-row' : ''} ${isTop3 ? 'top-rank-row' : ''}`}
      style={style ? {
        borderLeft: style.borderLeft,
        background: style.background,
      } : {}}
    >
      <div className="lr-pos">
        <span className={`pos-badge ${style ? style.posClass : 'pos-plain'}`}>
          {user.position}
        </span>
      </div>

      <div className="lr-avatar-container">
        <div className="lr-avatar" style={style ? { filter: style.glow } : {}}>
          {user.image
            ? <img src={user.image} alt={user.name} />
            : <span>{user.name?.charAt(0)?.toUpperCase()}</span>
          }
        </div>
      </div>

      <div className="lr-info">
        <div className="lr-name">
          {user.name}
          {isCurrentUser && <span className="you-tag">You</span>}
        </div>
        <div className="lr-sub">
          <span>Level {user.level}</span>
          <span className="lr-dot" />
          <span>{user.totalSessions} sessions</span>
          {user.topBadges?.slice(0, 2).map(b => (
            <span key={b.id} className="lr-badge-tag">{b.name}</span>
          ))}
        </div>
      </div>

      <div className="lr-rank">
        <RankBadge rank={user.rank} />
      </div>

      <div className="lr-streak">
        <span className="streak-val">{user.streak}d</span>
        <span className="streak-label">streak</span>
      </div>

      <div className="lr-xp">
        <span className="xp-val">{user.xp?.toLocaleString()}</span>
        <span className="xp-label">XP</span>
      </div>

      <style jsx>{`
        .leader-row {
          display: grid;
          grid-template-columns: 70px 60px 1fr 140px 100px 110px;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.02);
          transition: all 0.2s ease-in-out;
        }
        .leader-row:hover { 
          background: rgba(255, 255, 255, 0.02); 
          transform: translateX(4px);
        }
        
        /* Highlighting Current User */
        .current-user-row {
          background: rgba(59, 130, 246, 0.08) !important;
          border-left: 4px solid #3b82f6 !important;
        }

        .lr-pos { display: flex; align-items: center; }
        
        /* Top 3 rank badge styling */
        .pos-badge {
          font-size: 0.85rem;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
        }
        .pos-gold {
          background: rgba(245, 158, 11, 0.15);
          color: #fbbf24;
          border: 1.5px solid #f59e0b;
        }
        .pos-silver {
          background: rgba(156, 163, 175, 0.15);
          color: #e5e7eb;
          border: 1.5px solid #9ca3af;
        }
        .pos-bronze {
          background: rgba(205, 124, 62, 0.15);
          color: #fb923c;
          border: 1.5px solid #cd7c3e;
        }
        .pos-plain {
          color: #475569;
          font-weight: 600;
        }

        .lr-avatar-container {
          display: flex;
          align-items: center;
        }
        .lr-avatar {
          width: 38px; height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1d4ed8, #7c3aed);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
          font-weight: 800;
          overflow: hidden;
          border: 2px solid rgba(255, 255, 255, 0.1);
        }
        .lr-avatar img { width: 100%; height: 100%; object-fit: cover; }

        .lr-info { display: flex; flex-direction: column; gap: 0.25rem; min-width: 0; padding-right: 1rem; }
        .lr-name {
          font-size: 0.95rem;
          font-weight: 700;
          color: #f1f5f9;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .you-tag {
          font-size: 0.6rem;
          font-weight: 800;
          background: #3b82f6;
          color: #ffffff;
          padding: 0.15rem 0.45rem;
          border-radius: 5px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .lr-sub {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.4rem 0.6rem;
          font-size: 0.72rem;
          color: #64748b;
        }
        .lr-dot {
          width: 3px; height: 3px;
          background: #334155;
          border-radius: 50%;
        }
        .lr-badge-tag {
          background: rgba(255, 255, 255, 0.04);
          padding: 0.1rem 0.45rem;
          border-radius: 4px;
          font-size: 0.65rem;
          color: #94a3b8;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .lr-rank { }
        .lr-streak {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        .streak-val { font-size: 0.95rem; font-weight: 800; color: #f87171; }
        .streak-label { font-size: 0.65rem; color: #64748b; text-transform: uppercase; font-weight: 500; }

        .lr-xp {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }
        .xp-val { font-size: 1rem; font-weight: 800; color: #3b82f6; }
        .xp-label { font-size: 0.65rem; color: #64748b; text-transform: uppercase; font-weight: 500; }

        @media (max-width: 768px) {
          .leader-row {
            grid-template-columns: 50px 50px 1fr 90px 90px;
          }
          .lr-rank { display: none; }
        }
      `}</style>
    </div>
  );
}

export default function LeaderboardPage() {
  const [tab, setTab] = useState('alltime');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Fetch current user id for highlighting
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => { if (d.user?.id) setCurrentUserId(d.user.id); })
      .catch(() => {});
  }, []);

  const fetchLeaderboard = useCallback(async (type) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?type=${type}&limit=50`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchLeaderboard(tab); }, [tab, fetchLeaderboard]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const id = setInterval(() => fetchLeaderboard(tab), 60000);
    return () => clearInterval(id);
  }, [tab, fetchLeaderboard]);

  return (
    <div className="lb-page">
      <Navbar />
      <main className="lb-main">

        {/* Header */}
        <div className="lb-header">
          <div className="lb-header-text">
            <h1 className="lb-title">Leaderboard</h1>
            <p className="lb-subtitle">
              Rankings update in real time. Compete across all-time, weekly, and monthly periods.
            </p>
          </div>
          <div className="lb-tabs">
            {['alltime', 'weekly', 'monthly'].map(t => (
              <button
                key={t}
                className={`lb-tab ${tab === t ? 'active' : ''}`}
                onClick={() => setTab(t)}
              >
                {TIER_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="lb-loading">
            <div className="lb-spinner" />
            <p>Loading rankings...</p>
          </div>
        ) : !data?.leaderboard?.length ? (
          <div className="lb-empty">
            <h2>No users found</h2>
            <p>Complete practice sessions to appear on the leaderboard.</p>
            <Link href="/practice" className="lb-cta">Start Practicing</Link>
          </div>
        ) : (
          <>
            <section className="rankings-section">
              <div className="rankings-header">
                <span>Rank</span>
                <span>User</span>
                <span>Details</span>
                <span>Tier</span>
                <span>Streak</span>
                <span>XP</span>
              </div>
              <div className="rankings-list">
                {data.leaderboard.map(user => (
                  <LeaderRow
                    key={user.userId}
                    user={user}
                    isCurrentUser={user.userId === currentUserId}
                  />
                ))}
              </div>
            </section>

            <p className="lb-refresh-note">
              Refreshes every 60 seconds &mdash; {data.total} active users ranked
            </p>
          </>
        )}
      </main>

      <style jsx>{`
        .lb-page {
          background: #080c14;
          min-height: 100vh;
          color: #e2e8f0;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .lb-main {
          max-width: 1000px;
          margin: 0 auto;
          padding: 2rem 2rem 4rem;
        }

        /* ---- Header ---- */
        .lb-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 2.5rem;
          flex-wrap: wrap;
          gap: 1.5rem;
        }
        .lb-title {
          font-size: 2.5rem;
          font-weight: 800;
          letter-spacing: -0.04em;
          color: #f8fafc;
          margin: 0 0 0.4rem;
        }
        .lb-subtitle {
          font-size: 0.9rem;
          color: #64748b;
          margin: 0;
        }
        .lb-tabs {
          display: flex;
          gap: 0.5rem;
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 12px;
          padding: 0.3rem;
        }
        .lb-tab {
          background: none;
          border: none;
          color: #64748b;
          padding: 0.5rem 1.2rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 600;
          transition: all 0.2s;
        }
        .lb-tab.active {
          background: #1e3a5f;
          color: #93c5fd;
        }
        .lb-tab:hover:not(.active) { color: #94a3b8; }

        /* ---- Loading / Empty ---- */
        .lb-loading, .lb-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 350px;
          gap: 1.2rem;
          text-align: center;
        }
        .lb-spinner {
          width: 40px; height: 40px;
          border: 3px solid #1e293b;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .lb-empty h2 { font-size: 1.8rem; color: #f1f5f9; margin: 0; }
        .lb-empty p  { color: #64748b; margin: 0; }
        .lb-cta {
          background: #1d4ed8;
          color: #fff;
          padding: 0.75rem 2rem;
          border-radius: 10px;
          text-decoration: none;
          font-weight: 700;
          transition: background 0.2s;
        }
        .lb-cta:hover { background: #1e40af; }

        /* ---- Rankings Section ---- */
        .rankings-section {
          background: #0d1117;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
        }
        .rankings-header {
          display: grid;
          grid-template-columns: 70px 60px 1fr 140px 100px 110px;
          padding: 1rem 1.5rem;
          font-size: 0.7rem;
          font-weight: 800;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          background: rgba(15, 23, 42, 0.4);
        }
        .lb-refresh-note {
          text-align: center;
          color: #475569;
          font-size: 0.75rem;
          margin-top: 2rem;
        }

        @media (max-width: 768px) {
          .lb-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
          .lb-title { font-size: 2rem; }
          .rankings-header {
            grid-template-columns: 50px 50px 1fr 90px 90px;
          }
        }
      `}</style>
    </div>
  );
}
