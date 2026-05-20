'use client';

import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { RANK_THRESHOLDS, NEXT_RANK_TARGET } from '../../lib/xp';

// Badge tier visual config — no emoji
const TIER_CONFIG = {
  platinum: { label: 'Platinum', color: '#a78bfa', bg: '#1e1145', border: '#7c3aed' },
  gold:     { label: 'Gold',     color: '#fcd34d', bg: '#2b1c04', border: '#d97706' },
  silver:   { label: 'Silver',   color: '#cbd5e1', bg: '#111827', border: '#64748b' },
  bronze:   { label: 'Bronze',   color: '#d97706', bg: '#1c0f05', border: '#92400e' },
};

const TIER_ORDER = ['platinum', 'gold', 'silver', 'bronze'];

function BadgeIcon({ id, tier, locked }) {
  const tierColor = locked ? '#4b5563' : TIER_CONFIG[tier]?.color || '#fff';
  const size = 22;

  let svgContent = null;
  switch (id) {
    case 'first_session':
      svgContent = (
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      );
      break;
    case 'hot_streak':
    case 'weekly_warrior':
    case 'unstoppable':
      svgContent = (
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
      );
      break;
    case 'mode_explorer':
    case 'all_modes':
      svgContent = (
        <>
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </>
      );
      break;
    case 'fluency_star':
      svgContent = (
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      );
      break;
    case 'perfect_session':
      svgContent = (
        <>
          <circle cx="12" cy="8" r="7" />
          <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" />
        </>
      );
      break;
    case 'speed_demon':
      svgContent = (
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      );
      break;
    case 'slow_burn':
      svgContent = (
        <>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </>
      );
      break;
    case 'centurion':
      svgContent = (
        <>
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </>
      );
      break;
    case 'master_speaker':
      svgContent = (
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      );
      break;
    case 'quick_learner':
      svgContent = (
        <>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </>
      );
      break;
    case 'story_teller':
      svgContent = (
        <>
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </>
      );
      break;
    case 'negotiator':
      svgContent = (
        <>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </>
      );
      break;
    case 'hour_glass':
    case 'dedicated':
      svgContent = (
        <>
          <path d="M5 2h14" />
          <path d="M5 22h14" />
          <path d="M19 2v4c0 1.38-.5 2-1 3l-4 3 4 3c.5 1 .5 1.62.5 3v4" />
          <path d="M5 2v4c0 1.38.5 2 1 3l4 3-4 3c-.5 1-.5 1.62-.5 3v4" />
        </>
      );
      break;
    case 'vocab_rich':
      svgContent = (
        <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z M16 8L2 22M17.5 15H9" />
      );
      break;
    case 'coherent_thinker':
      svgContent = (
        <>
          <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
          <line x1="9" y1="18" x2="15" y2="18" />
          <line x1="10" y1="22" x2="14" y2="22" />
        </>
      );
      break;
    case 'no_fillers':
      svgContent = (
        <>
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </>
      );
      break;
    default:
      svgContent = (
        <circle cx="12" cy="12" r="10" />
      );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={tierColor}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {svgContent}
    </svg>
  );
}

function XpProgressBar({ xp, rank }) {
  const bounds = {
    'Newbie':        { min: 0,     max: 500 },
    'Beginner':      { min: 500,   max: 2000 },
    'Intermediate':  { min: 2000,  max: 5000 },
    'Advanced':      { min: 5000,  max: 10000 },
    'Expert':        { min: 10000, max: 20000 },
    'Master':        { min: 20000, max: 20000 }
  };

  const currentBound = bounds[rank] || bounds.Newbie;
  const range = currentBound.max - currentBound.min;
  const relativeXp = xp - currentBound.min;
  const pct = rank === 'Master' ? 100 : Math.max(0, Math.min(100, Math.round((relativeXp / range) * 100)));

  const rankOrder = ['Newbie', 'Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master'];
  const currentIdx = rankOrder.indexOf(rank);
  const nextRank = rankOrder[currentIdx + 1] || 'Master';

  return (
    <div className="xp-bar-wrap">
      <div className="xp-bar-labels">
        <span className="xp-rank-now">{rank}</span>
        <span className="xp-rank-next">{rank !== 'Master' ? nextRank : 'Max Rank'}</span>
      </div>
      <div className="xp-bar-track">
        <div className="xp-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="xp-bar-info">
        <span>{xp?.toLocaleString()} XP</span>
        {rank !== 'Master' && (
          <span>{Math.max(0, currentBound.max - xp)?.toLocaleString()} XP to {nextRank}</span>
        )}
      </div>
      <style jsx>{`
        .xp-bar-wrap { display: flex; flex-direction: column; gap: 0.6rem; }
        .xp-bar-labels { display: flex; justify-content: space-between; }
        .xp-rank-now  { font-size: 0.9rem; font-weight: 800; color: #a855f7; }
        .xp-rank-next { font-size: 0.9rem; font-weight: 700; color: #475569; }
        .xp-bar-track {
          height: 10px;
          background: #1e293b;
          border-radius: 99px;
          overflow: hidden;
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.5);
        }
        .xp-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #6d28d9, #a855f7);
          border-radius: 99px;
          box-shadow: 0 0 10px rgba(168, 85, 247, 0.4);
          transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .xp-bar-info { display: flex; justify-content: space-between; font-size: 0.8rem; color: #64748b; font-weight: 600; }
      `}</style>
    </div>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {sub && <span className="stat-sub">{sub}</span>}
      <style jsx>{`
        .stat-card {
          background: rgba(13, 17, 23, 0.65);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 1.25rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          transition: all 0.2s ease-in-out;
        }
        .stat-card:hover {
          border-color: rgba(168, 85, 247, 0.3);
          box-shadow: 0 4px 20px rgba(168, 85, 247, 0.06);
          transform: translateY(-2px);
        }
        .stat-label {
          font-size: 0.65rem;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .stat-value {
          font-size: 1.5rem;
          font-weight: 800;
          color: #f8fafc;
        }
        .stat-sub {
          font-size: 0.75rem;
          color: #475569;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}

function BadgeCard({ badge }) {
  const tier = TIER_CONFIG[badge.tier] || TIER_CONFIG.bronze;
  const locked = !badge.earned;

  return (
    <div className={`badge-card ${locked ? 'locked' : 'earned'}`}
      style={{ '--bc': tier.border, '--bb': tier.bg }}>
      <div className="badge-icon-wrap" style={{
        background: locked ? 'rgba(17, 24, 39, 0.5)' : `${tier.bg}`,
        border: `2px solid ${locked ? 'rgba(255, 255, 255, 0.05)' : tier.border}`,
        boxShadow: locked ? 'none' : `0 0 15px ${tier.border}22`
      }}>
        <div className="badge-icon-graphic">
          <BadgeIcon id={badge.id} tier={badge.tier} locked={locked} />
        </div>
        {locked && (
          <div className="badge-lock">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
        )}
      </div>
      <div className="badge-info">
        <div className="badge-name" style={{ color: locked ? '#4b5563' : '#f1f5f9' }}>
          {badge.name}
        </div>
        <div className="badge-desc">{badge.description}</div>
        {badge.earned && badge.earnedAt && (
          <div className="badge-date">
            Earned {new Date(badge.earnedAt).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric'
            })}
          </div>
        )}
      </div>
      <div className="badge-tier-pill" style={{
        color: locked ? '#4b5563' : tier.color,
        background: locked ? 'rgba(31, 41, 55, 0.3)' : `${tier.bg}`,
        border: `1px solid ${locked ? 'rgba(255, 255, 255, 0.05)' : tier.border}`,
      }}>
        {tier.label}
      </div>
      
      <style jsx>{`
        .badge-card {
          background: rgba(13, 17, 23, 0.65);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 1.25rem;
          display: flex;
          align-items: center;
          gap: 1.25rem;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .badge-card.earned {
          border-color: var(--bc);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2), 0 0 15px var(--bc)0c;
        }
        .badge-card.earned:hover {
          box-shadow: 0 4px 25px rgba(0, 0, 0, 0.3), 0 0 25px var(--bc)25;
          transform: translateY(-3px);
          border-color: var(--bc);
        }
        .badge-card.locked {
          opacity: 0.6;
          border-color: rgba(255, 255, 255, 0.02);
        }
        .badge-card.locked:hover {
          opacity: 0.8;
          border-color: rgba(255, 255, 255, 0.08);
          transform: translateY(-1px);
        }

        .badge-icon-wrap {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }
        .badge-card:hover .badge-icon-wrap {
          transform: scale(1.05);
        }
        .badge-lock {
          position: absolute;
          bottom: -4px;
          right: -4px;
          background: #1f2937;
          border: 1.5px solid rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          width: 20px; height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9ca3af;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        }

        .badge-info { flex: 1; min-width: 0; }
        .badge-name { font-size: 0.95rem; font-weight: 700; margin-bottom: 0.25rem; letter-spacing: -0.01em; }
        .badge-desc { font-size: 0.78rem; color: #64748b; line-height: 1.45; }
        .badge-date { font-size: 0.7rem; color: #4b5563; margin-top: 0.35rem; font-weight: 500; }

        .badge-tier-pill {
          padding: 0.2rem 0.55rem;
          border-radius: 6px;
          font-size: 0.6rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}

export default function RewardsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    fetch('/api/badges')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filteredBadges = () => {
    if (!data?.allBadges) return [];
    if (activeFilter === 'earned') return data.allBadges.filter(b => b.earned);
    if (activeFilter === 'locked')  return data.allBadges.filter(b => !b.earned);
    if (TIER_ORDER.includes(activeFilter)) return data.allBadges.filter(b => b.tier === activeFilter);
    return data.allBadges;
  };

  if (loading) {
    return (
      <div className="rw-page">
        <Navbar />
        <div className="rw-center">
          <div className="rw-spinner" />
          <p>Loading rewards...</p>
        </div>
        <style jsx>{`
          .rw-page { background: #080c14; min-height: 100vh; color: #e2e8f0; }
          .rw-center { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 80vh; gap: 1rem; }
          .rw-spinner { width: 36px; height: 36px; border: 3px solid #1e293b; border-top-color: #a855f7; border-radius: 50%; animation: spin 0.8s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (!data || data.error) {
    return (
      <div className="rw-page" style={{ background: '#080c14', minHeight: '100vh', color: '#e2e8f0' }}>
        <Navbar />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifycontent: 'center', minHeight: '80vh', gap: '1rem' }}>
          <h2 style={{ color: '#f1f5f9' }}>Sign in to view your rewards</h2>
          <a href="/auth/signin" style={{ background: '#1d4ed8', color: '#fff', padding: '0.75rem 2rem', borderRadius: '10px', textDecoration: 'none', fontWeight: 700 }}>Sign In</a>
        </div>
      </div>
    );
  }

  const { user, earnedCount, totalCount, completionPercent, recentBadges } = data;
  const badges = filteredBadges();

  return (
    <div className="rw-page">
      <Navbar />
      <main className="rw-main">

        {/* Page header */}
        <div className="rw-header">
          <div>
            <h1 className="rw-title">Rewards &amp; Achievements</h1>
            <p className="rw-subtitle">
              Track your progress, unlock badges, and climb the ranks.
            </p>
          </div>
          <div className="rw-completion">
            <div className="completion-ring">
              <svg viewBox="0 0 80 80" width="80" height="80">
                <circle cx="40" cy="40" r="32" fill="none" stroke="#1e293b" strokeWidth="6" />
                <circle
                  cx="40" cy="40" r="32"
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 32}`}
                  strokeDashoffset={`${2 * Math.PI * 32 * (1 - completionPercent / 100)}`}
                  transform="rotate(-90 40 40)"
                />
              </svg>
              <div className="completion-pct">{completionPercent}%</div>
            </div>
            <div className="completion-label">
              <span className="cl-count">{earnedCount} / {totalCount}</span>
              <span className="cl-sub">badges earned</span>
            </div>
          </div>
        </div>

        {/* User stats row */}
        <div className="stats-row">
          <StatCard label="Current Rank"   value={user.rank}   sub={`Level ${user.level}`} />
          <StatCard label="Total XP"        value={user.xp?.toLocaleString()} sub="experience points" />
          <StatCard label="Current Streak"  value={`${user.streak}d`}  sub={`Best: ${(user.bestStreak || user.streak || 0)}d`} />
          <StatCard label="Sessions"        value={user.totalSessions || 0} sub="completed" />
          <StatCard label="Practice Time"   value={`${user.totalPracticeMinutes || 0} min`} sub="total" />
        </div>

        {/* XP progress bar */}
        <div className="xp-section">
          <XpProgressBar xp={user.xp} rank={user.rank} />
        </div>

        {/* Recent unlocks timeline */}
        {recentBadges?.length > 0 && (
          <section className="recent-section">
            <h2 className="section-title">Recent Unlocks</h2>
            <div className="recent-list">
              {recentBadges.map(b => (
                <div key={b.id} className="recent-item">
                  <div className="recent-dot" />
                  <div>
                    <div className="recent-name">{b.name}</div>
                    <div className="recent-date">
                      {new Date(b.earnedAt).toLocaleDateString('en-US', {
                        month: 'long', day: 'numeric', year: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Badge gallery */}
        <section className="gallery-section">
          <div className="gallery-header">
            <h2 className="section-title">Badge Collection</h2>
            <div className="filter-bar">
              {['all', 'earned', 'locked', ...TIER_ORDER].map(f => (
                <button
                  key={f}
                  className={`filter-btn ${activeFilter === f ? 'active' : ''}`}
                  onClick={() => setActiveFilter(f)}
                >
                  {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="badge-grid">
            {badges.length === 0 ? (
              <p className="empty-filter">No badges match this filter.</p>
            ) : (
              badges.map(badge => (
                <BadgeCard key={badge.id} badge={badge} />
              ))
            )}
          </div>
        </section>
      </main>

      <style jsx>{`
        .rw-page {
          background: #080c14;
          min-height: 100vh;
          color: #e2e8f0;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .rw-main {
          max-width: 1000px;
          margin: 0 auto;
          padding: 2rem 2rem 5rem;
        }

        /* Header */
        .rw-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2.5rem;
          flex-wrap: wrap;
          gap: 2rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 2rem;
        }
        .rw-title {
          font-size: 2.5rem;
          font-weight: 800;
          letter-spacing: -0.04em;
          color: #f8fafc;
          margin: 0 0 0.4rem;
        }
        .rw-subtitle { font-size: 0.9rem; color: #64748b; margin: 0; }

        /* Completion ring */
        .rw-completion { display: flex; align-items: center; gap: 1.2rem; }
        .completion-ring {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .completion-pct {
          position: absolute;
          font-size: 1rem;
          font-weight: 800;
          color: #a855f7;
        }
        .completion-label { display: flex; flex-direction: column; }
        .cl-count { font-size: 1.2rem; font-weight: 800; color: #f1f5f9; }
        .cl-sub   { font-size: 0.75rem; color: #64748b; }

        /* Stats row */
        .stats-row {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 1.25rem;
          margin-bottom: 1.5rem;
        }

        /* XP bar wrapper container */
        .xp-section {
          background: rgba(13, 17, 23, 0.65);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 2.5rem;
        }

        /* Section title */
        .section-title {
          font-size: 1.2rem;
          font-weight: 700;
          color: #f1f5f9;
          margin: 0;
          letter-spacing: -0.02em;
        }

        /* Recent unlocks */
        .recent-section {
          background: rgba(13, 17, 23, 0.65);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 2.5rem;
        }
        .recent-list {
          display: flex;
          flex-direction: column;
          gap: 0;
          margin-top: 1.2rem;
        }
        .recent-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
        }
        .recent-item:last-child { border-bottom: none; }
        .recent-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #a855f7;
          flex-shrink: 0;
          box-shadow: 0 0 8px #a855f7;
        }
        .recent-name { font-size: 0.9rem; font-weight: 700; color: #f1f5f9; }
        .recent-date { font-size: 0.75rem; color: #4b5563; }

        /* Badge gallery */
        .gallery-section { }
        .gallery-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .filter-bar { display: flex; gap: 0.4rem; flex-wrap: wrap; }
        .filter-btn {
          background: #0d1117;
          border: 1px solid rgba(255, 255, 255, 0.05);
          color: #64748b;
          padding: 0.45rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 600;
          transition: all 0.2s;
        }
        .filter-btn.active {
          background: rgba(168, 85, 247, 0.15);
          border-color: #a855f7;
          color: #d8b4fe;
          box-shadow: 0 0 10px rgba(168, 85, 247, 0.1);
        }
        .filter-btn:hover:not(.active) { border-color: rgba(255, 255, 255, 0.1); color: #94a3b8; }

        .badge-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.25rem;
        }
        .empty-filter { color: #64748b; text-align: center; padding: 3rem 0; font-weight: 500; }

        @media (max-width: 900px) {
          .stats-row { grid-template-columns: repeat(3, 1fr); }
          .badge-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
          .rw-title { font-size: 2rem; }
          .stats-row { grid-template-columns: repeat(2, 1fr); }
          .gallery-header { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </div>
  );
}
