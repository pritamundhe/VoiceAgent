'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Navbar from '../../components/Navbar';
import { LEARNING_PATH, SPEAKING_TASKS, READING_TASKS, LISTENING_TASKS } from '../../lib/learningPathData';
import { useRouter } from 'next/navigation';

// ── Config ──────────────────────────────────────────────────────────────────
const PART_CONFIG   = { speaking: SPEAKING_TASKS, reading: READING_TASKS, listening: LISTENING_TASKS };
const RANK_ORDER    = ['Newbie', 'Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master'];
const PART_PALETTE  = {
  speaking:  { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   label: 'Speaking',  icon: '🎤' },
  reading:   { color: '#ef4444', bg: 'rgba(239,68,68,0.10)',   label: 'Reading',   icon: '📖' },
  listening: { color: '#a855f7', bg: 'rgba(168,85,247,0.12)',  label: 'Listening', icon: '🎧' },
};
const STATUS_CONFIG = {
  locked:   { icon: '🔒', label: 'Locked',     color: '#4b5563' },
  unlocked: { icon: '▶️', label: 'Start',       color: '#22c55e' },
  passed:   { icon: '✅', label: 'Passed',      color: '#06b6d4' },
};

// ── Flat module list with levelId attached ───────────────────────────────────
const ALL_MISSIONS = LEARNING_PATH.flatMap(level =>
  level.modules.map(mod => ({
    ...mod,
    levelId:      level.level,
    rankRequired: level.rankRequired,
    targetMode:   level.targetMode,
    levelTitle:   level.title,
  }))
);

// ── Inline SVG Icon (zero deps) ──────────────────────────────────────────────
const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

// ════════════════════════════════════════════════════════════════════════════
// MODULE CARD
// ════════════════════════════════════════════════════════════════════════════
function ModuleCard({ mission, status, bestScore, attempts, xpReward, passThreshold, onStart, activeTab, isStarting }) {
  const [hovered, setHovered] = useState(false);
  if (activeTab !== 'all' && mission.part !== activeTab) return null;

  const part    = PART_PALETTE[mission.part] || PART_PALETTE.speaking;
  const cfg     = STATUS_CONFIG[status] || STATUS_CONFIG.locked;
  const locked  = status === 'locked';
  const passed  = status === 'passed';

  // Progress bar — use bestScore if available
  const progressPct = bestScore != null ? Math.min(100, bestScore) : 0;

  return (
    <div
      onClick={() => !locked && !isStarting && onStart(mission)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:    'var(--surface-2)',
        border:        `1px solid ${hovered && !locked ? part.color : 'var(--border)'}`,
        borderRadius:  '18px',
        padding:       '1.25rem',
        cursor:        locked ? 'not-allowed' : 'pointer',
        opacity:       locked ? 0.55 : 1,
        transform:     hovered && !locked ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow:     hovered && !locked ? `0 12px 28px rgba(0,0,0,0.15), 0 0 0 1px ${part.color}22` : '0 2px 8px rgba(0,0,0,0.08)',
        transition:    'all 0.25s cubic-bezier(0.4,0,0.2,1)',
        display:       'flex',
        flexDirection: 'column',
        gap:           '0.65rem',
        position:      'relative',
        overflow:      'hidden',
      }}
    >
      {/* Passed glow accent line */}
      {passed && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
          background: `linear-gradient(90deg, ${part.color}, transparent)`,
          borderRadius: '18px 18px 0 0',
        }} />
      )}

      {/* Top row — part badge + status badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          background: part.bg, color: part.color,
          padding: '0.2rem 0.65rem', borderRadius: '99px',
          fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em',
        }}>
          {part.icon} {part.label}
        </span>
        <span style={{
          background: passed ? 'rgba(6,182,212,0.1)' : locked ? 'rgba(75,85,99,0.15)' : 'rgba(34,197,94,0.1)',
          color:      cfg.color,
          padding:    '0.18rem 0.6rem', borderRadius: '99px',
          fontSize:   '0.72rem', fontWeight: 700,
          display:    'flex', alignItems: 'center', gap: '0.3rem',
        }}>
          {isStarting ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
              Loading...
            </span>
          ) : (
            <>
              {cfg.icon} {cfg.label}
            </>
          )}
        </span>
      </div>

      {/* Module title & description */}
      <div>
        <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1.25 }}>
          {mission.title}
        </h3>
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.45,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {mission.desc}
        </p>
      </div>

      {/* Progress bar — shows best score */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
          <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Best score
          </span>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: progressPct >= passThreshold ? part.color : 'var(--text-muted)' }}>
            {bestScore != null ? `${Math.round(bestScore)}%` : '—'}
            {bestScore != null && <span style={{ opacity: 0.5, fontWeight: 500 }}> / {passThreshold}% needed</span>}
          </span>
        </div>
        <div style={{ height: '4px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{
            width:      `${progressPct}%`,
            height:     '100%',
            background: progressPct >= passThreshold ? part.color : `${part.color}80`,
            borderRadius: '4px',
            transition:  'width 0.8s cubic-bezier(0.4,0,0.2,1)',
          }} />
        </div>
      </div>

      {/* Footer — attempts + XP reward + duration */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: 'auto',
      }}>
        <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          ⏱ {PART_CONFIG[mission.part]?.duration ?? '?'} min
          {attempts > 0 && <> · {attempts} attempt{attempts !== 1 ? 's' : ''}</>}
        </span>
        <span style={{
          background: 'rgba(250,204,21,0.12)', color: '#facc15',
          padding: '0.18rem 0.55rem', borderRadius: '8px',
          fontSize: '0.73rem', fontWeight: 800,
        }}>
          ⚡ +{xpReward} XP
        </span>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════════════════
export default function LearningPathPage() {
  const [progress,    setProgress]    = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState('all');
  const [startingMissionId, setStartingMissionId] = useState(null);
  const router = useRouter();

  // ── Fetch progress ─────────────────────────────────────────────────────────
  const fetchProgress = useCallback(() => {
    setLoading(true);
    fetch('/api/learning-path/progress')
      .then(r => r.json())
      .then(d => { setProgress(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { fetchProgress(); }, [fetchProgress]);

  // ── Handle module click ────────────────────────────────────────────────────
  const handleStart = useCallback(async (mission) => {
    const moduleStatus = progress?.modules?.[mission.id];
    if (!moduleStatus || moduleStatus.locked) return;
    
    setStartingMissionId(mission.id);

    try {
      const res = await fetch('/api/learning-path/start', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          moduleId: mission.id,
          taskType: mission.taskType,
          part:     mission.part,
          levelId:  mission.levelId,
        }),
      });
      const content = await res.json();
      if (content.error) throw new Error(content.error);

      sessionStorage.setItem('pendingModule', JSON.stringify({
        moduleId:  mission.id,
        levelId:   mission.levelId,
        taskType:  mission.taskType,
        part:      mission.part,
        topic:     content?.topic || mission.title,
        xpReward:  moduleStatus?.xpReward,
      }));

      const qs = new URLSearchParams({
        mode:       content.targetMode || mission?.targetMode || 'casual',
        customTitle: mission?.title || '',
        customDesc:  content.topic || mission?.desc || '',
        taskType:    content.taskType || mission?.taskType || '',
        part:        content.part    || mission?.part     || '',
      });

      if (content.sentences || content.questions || content.scenario || content.script) {
        sessionStorage.setItem('moduleContent', JSON.stringify(content));
      }

      router.push(`/dashboard?${qs.toString()}`);
    } catch (e) {
      alert('Failed to start module. Please try again.');
      setStartingMissionId(null);
    }
  }, [progress, router]);

  // ── Tab counts ─────────────────────────────────────────────────────────────
  const counts = {
    all:       ALL_MISSIONS.length,
    speaking:  ALL_MISSIONS.filter(m => m.part === 'speaking').length,
    reading:   ALL_MISSIONS.filter(m => m.part === 'reading').length,
    listening: ALL_MISSIONS.filter(m => m.part === 'listening').length,
  };

  const TABS = [
    { id: 'all',       label: 'All',       icon: '⊞' },
    { id: 'speaking',  label: 'Speaking',  icon: '🎤' },
    { id: 'reading',   label: 'Reading',   icon: '📖' },
    { id: 'listening', label: 'Listening', icon: '🎧' },
  ];

  // ── Completion stats from progress ─────────────────────────────────────────
  const totalPassed     = progress?.totalPassed     ?? 0;
  const totalModules    = progress?.totalModules    ?? ALL_MISSIONS.length;
  const completionPct   = progress?.completionPct   ?? 0;
  const nextModuleId    = progress?.nextModuleId;

  return (
    <div className="app-container">
      <Navbar />

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin    { to { transform: rotate(360deg); } }
        .hide-scroll { -ms-overflow-style:none; scrollbar-width:none; }
        .hide-scroll::-webkit-scrollbar { display:none; }
      `}</style>

      <main className="hide-scroll" style={{
        paddingBottom: '5rem',
        height: 'calc(100vh - 70px)',
        overflowY: 'auto',
        width: '100%',
        boxSizing: 'border-box',
      }}>

        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <div style={{ padding: '1.5rem 1.25rem 0.75rem', display: 'flex',
          justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{
              fontSize: '1.9rem', fontWeight: 900, letterSpacing: '-0.04em', margin: 0,
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent-purple) 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              Certification Roadmap
            </h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0.3rem 0 0' }}>
              TOEFL · IELTS · PTE — {totalModules} modules · Personalised AI topics every session
            </p>
          </div>

          {/* XP + Progress widget */}
          <div style={{
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            borderRadius: '16px', padding: '0.9rem 1.2rem',
            display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '220px',
          }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '12px',
              background: 'rgba(250,204,21,0.12)', border: '1px solid rgba(250,204,21,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem',
            }}>⚡</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text)' }}>
                  {progress?.userRank || 'Newbie'}
                </span>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#facc15' }}>
                  {progress?.userXp || 0} XP
                </span>
              </div>
              <div style={{ height: '5px', background: 'var(--border)', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{
                  width: `${completionPct}%`, height: '100%',
                  background: 'linear-gradient(90deg, #facc15, #f59e0b)',
                  borderRadius: '5px', transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
                }} />
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.3rem', fontWeight: 500 }}>
                {totalPassed}/{totalModules} modules passed
              </div>
            </div>
          </div>
        </div>

        {/* ── Next-step banner (only when there's a recommended module) ─────── */}
        {nextModuleId && !loading && (() => {
          const nm = ALL_MISSIONS.find(m => m.id === nextModuleId);
          const p  = PART_PALETTE[nm?.part] || PART_PALETTE.speaking;
          return nm ? (
            <div
              onClick={() => handleStart(nm)}
              style={{
                margin: '0.75rem 1.25rem', padding: '0.9rem 1.25rem',
                background: `linear-gradient(135deg, ${p.color}18, ${p.color}08)`,
                border: `1px solid ${p.color}40`, borderRadius: '14px',
                display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>🚀</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: p.color, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Continue where you left off
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)', marginTop: '0.1rem' }}>
                  {nm.title}
                </div>
              </div>
              <span style={{ color: p.color, fontWeight: 800, fontSize: '1.1rem' }}>→</span>
            </div>
          ) : null;
        })()}

        {/* ── Section header cards ──────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem 1.25rem', flexWrap: 'wrap' }}>
          {[SPEAKING_TASKS, READING_TASKS, LISTENING_TASKS].map(cfg => {
            const p    = PART_PALETTE[cfg.label.toLowerCase()];
            const tab  = cfg.label.toLowerCase();
            const active = activeTab === tab;
            const passedInSection = !loading
              ? ALL_MISSIONS.filter(m => m.part === tab && progress?.modules?.[m.id]?.status === 'passed').length
              : 0;
            const totalInSection = ALL_MISSIONS.filter(m => m.part === tab).length;
            return (
              <div
                key={cfg.label}
                onClick={() => setActiveTab(t => t === tab ? 'all' : tab)}
                style={{
                  flex: '1 1 180px', background: 'var(--surface-2)',
                  border: `2px solid ${active ? p.color : 'transparent'}`,
                  borderRadius: '16px', padding: '1.1rem 1.25rem', cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  transform: active ? 'translateY(-3px)' : 'translateY(0)',
                  boxShadow: active ? `0 8px 24px ${p.color}25` : 'none',
                }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>{p.icon}</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text)' }}>{cfg.label}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {cfg.duration} min · {passedInSection}/{totalInSection} passed
                </div>
                <div style={{ marginTop: '0.5rem', height: '3px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${totalInSection > 0 ? (passedInSection / totalInSection) * 100 : 0}%`,
                    height: '100%', background: p.color, borderRadius: '3px',
                    transition: 'width 0.8s ease',
                  }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Tab filter bar ────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.25rem 1.25rem 0.75rem', flexWrap: 'wrap', gap: '0.5rem',
        }}>
          <div style={{
            display: 'flex', gap: '0.25rem',
            background: 'var(--surface-3)', padding: '0.25rem', borderRadius: '99px',
          }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                padding: '0.35rem 0.85rem', borderRadius: '99px', border: 'none',
                cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: 600,
                background: activeTab === tab.id ? 'var(--surface)' : 'transparent',
                color:      activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow:  activeTab === tab.id ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.18s ease',
                display: 'flex', alignItems: 'center', gap: '0.35rem',
              }}>
                {tab.icon} {tab.label}
                <span style={{
                  background: activeTab === tab.id ? 'var(--primary-subtle)' : 'var(--surface-3)',
                  color:      activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                  fontSize: '0.72rem', fontWeight: 800, padding: '0.05rem 0.35rem', borderRadius: '99px',
                }}>
                  {counts[tab.id]}
                </span>
              </button>
            ))}
          </div>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            {counts[activeTab]} module{counts[activeTab] !== 1 ? 's' : ''}
            {activeTab !== 'all' ? ` · ${activeTab}` : ''}
          </span>
        </div>

        {/* ── Module grid ───────────────────────────────────────────────────── */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '220px', gap: '1rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%',
              border: '3px solid var(--border)', borderTopColor: 'var(--primary)',
              animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Loading your roadmap…
            </span>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1rem', padding: '0 1.25rem',
            animation: 'fadeUp 0.4s ease',
          }}>
            {ALL_MISSIONS.map(mission => {
              const moduleStatus = progress?.modules?.[mission.id] || {};
              return (
                <ModuleCard
                  key={mission.id}
                  mission={mission}
                  status={moduleStatus.status || 'locked'}
                  bestScore={moduleStatus.bestScore}
                  attempts={moduleStatus.attempts || 0}
                  xpReward={moduleStatus.xpReward || 50}
                  passThreshold={moduleStatus.passThreshold || 60}
                  activeTab={activeTab}
                  isStarting={startingMissionId === mission.id}
                  onStart={handleStart}
                />
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
