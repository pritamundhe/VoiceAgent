'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import { LEARNING_PATH, SPEAKING_TASKS, READING_TASKS, LISTENING_TASKS } from '../../lib/learningPathData';
import { useRouter } from 'next/navigation';
// ── Config
const PART_CONFIG = { speaking: SPEAKING_TASKS, reading: READING_TASKS, listening: LISTENING_TASKS };
const RANK_ORDER  = ['Newbie', 'Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master'];

const TASK_MAPS = {
  speaking:  Object.fromEntries(SPEAKING_TASKS.questionTypes.map(t => [t.id, t])),
  reading:   Object.fromEntries(READING_TASKS.questionTypes.map(t => [t.id, t])),
  listening: Object.fromEntries(LISTENING_TASKS.questionTypes.map(t => [t.id, t])),
};
const getTask = (part, id) => TASK_MAPS[part]?.[id] || null;

// Built-in Vector Icons for extreme performance and 0 dependencies
const PATHS = {
  Mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>',
  FileText: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><line x1="10" x2="14" y1="9" y2="9"/><line x1="8" x2="16" y1="13" y2="13"/><line x1="8" x2="16" y1="17" y2="17"/>',
  MessageCircle: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  Waves: '<path d="M2 6c.6.5 1.2 1 2.5 1S7 6.5 7.6 6 8.8 5 10.1 5s2.5 1 3.1 1.5 1.2 1 2.5 1 2.6-.5 3.2-1 .7-1 1.9-1c1.3 0 2.4 1 2.4 1"/><path d="M2 12c.6.5 1.2 1 2.5 1S7 12.5 7.6 12 8.8 11 10.1 11s2.5 1 3.1 1.5 1.2 1 2.5 1 2.6-.5 3.2-1 .7-1 1.9-1c1.3 0 2.4 1 2.4 1"/><path d="M2 18c.6.5 1.2 1 2.5 1S7 18.5 7.6 18 8.8 17 10.1 17s2.5 1 3.1 1.5 1.2 1 2.5 1 2.6-.5 3.2-1 .7-1 1.9-1c1.3 0 2.4 1 2.4 1"/>',
  Headphones: '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>',
  Repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  MessageSquare: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  Image: '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
  Zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  BookOpen: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  Target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  Puzzle: '<path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 0-.288.877c.113.743.168 1.503.168 2.268 0 4.14-3.327 7.502-7.442 7.502a7.68 7.68 0 0 1-2.285-.353.98.98 0 0 0-.877.288l-1.556 1.556c-.47.47-1.086.706-1.703.706s-1.233-.235-1.704-.706l-1.571-1.571a.98.98 0 0 0-.877-.289A7.26 7.26 0 0 1 1.785 22.1c-4.114 0-7.441-3.361-7.441-7.502 0-.766.055-1.526.168-2.268a.98.98 0 0 0-.288-.877L-7.387 9.842C-7.857 9.372-8.093 8.756-8.093 8.139c0-.617.236-1.234.706-1.704l1.571-1.571a.98.98 0 0 0 .289-.877A7.26 7.26 0 0 1 -5.696 1.72C-1.581 1.72 1.746 5.082 1.746 9.223c0 .766-.055 1.526-.168 2.268a.98.98 0 0 0 .288.877l1.611 1.611c.47.47 1.087.706 1.704.706s1.233-.235 1.703-.706l1.556-1.556a.98.98 0 0 0 .878-.288c.742-.113 1.502-.168 2.267-.168 4.115 0 7.442 3.362 7.442 7.502 0 .765-.054 1.525-.168 2.268z" transform="translate(8.093 -1.72)"/>',
  PieChart: '<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>',
  CheckCircle: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>',
  CheckSquare: '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  ListChecks: '<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>',
  ArrowUpDown: '<path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/>',
  FileEdit: '<path d="M4 13.5V4a2 2 0 0 1 2-2h8.5L20 7.5V20a2 2 0 0 1-2 2h-5.5"/><polyline points="14 2 14 8 20 8"/><path d="M10.42 12.61a2.1 2.1 0 1 1 2.97 2.97L7.95 21 4 22l.99-3.95 5.43-5.44Z"/>',
  PenTool: '<path d="m12 19 7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="m2 2 7.586 7.586"/><circle cx="11" cy="11" r="2"/>',
  AudioLines: '<path d="M2 10v3"/><path d="M6 6v11"/><path d="M10 3v18"/><path d="M14 8v7"/><path d="M18 5v13"/><path d="M22 10v3"/>',
  ClipboardList: '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>',
  Keyboard: '<rect width="20" height="16" x="2" y="4" rx="2" ry="2"/><path d="M6 8h.001"/><path d="M10 8h.001"/><path d="M14 8h.001"/><path d="M18 8h.001"/><path d="M8 12h.001"/><path d="M12 12h.001"/><path d="M16 12h.001"/><path d="M7 16h10"/>',
  MousePointer2: '<path d="M2.38 31.81L11.75 42L25 18L-1.19 18z" transform="translate(6.620000000000001 -10.869999999999997) scale(0.6666666666666666)"/>',
  Check: '<path d="M20 6 9 17l-5-5"/>',
  Lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  ArrowRight: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  Clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  ChevronDown: '<path d="m6 9 6 6 6-6"/>',
  Layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
};

// Dynamic Icon Component (Rendered natively, 0 dependencies)
const Icon = ({ name, size = 16, className = '', color = 'currentColor' }) => {
  const path = PATHS[name];
  if (!path) return null;
  return (
    <svg 
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} 
      strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" 
      className={className} dangerouslySetInnerHTML={{ __html: path }} 
    />
  );
};

// ════════════════════════════════════════════════
// MODULE CARD — individual task card in the grid
// ════════════════════════════════════════════════
function ModuleCard({ mission, unlocked, isPassed, onStart, activeTab }) {
  const [open, setOpen] = useState(false);
  if (activeTab !== 'all' && mission.part !== activeTab) return null;

  const cfg  = PART_CONFIG[mission.part];
  const task = getTask(mission.part, mission.taskType);

  const borderColor = isPassed
    ? `${cfg.color}55`
    : unlocked
    ? 'var(--border)'
    : 'transparent';

  return (
    <div style={{
      background: unlocked ? 'var(--surface)' : 'var(--surface-3)',
      border: `1.5px solid ${borderColor}`,
      borderRadius: 'var(--radius-md)',
      padding: '1rem',
      opacity: unlocked ? 1 : 0.5,
      transition: 'all 0.25s ease',
      boxShadow: unlocked ? 'var(--shadow-sm)' : 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.6rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Accent top stripe */}
      {unlocked && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: isPassed ? cfg.colorVar : `${cfg.colorVar}55`,
          borderRadius: '3px 3px 0 0',
        }} />
      )}

      {/* Row 1: Part badge + status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.15rem' }}>
        <span style={{
          fontSize: '0.72rem', fontWeight: 700, padding: '0.12rem 0.5rem',
          borderRadius: '9999px', background: cfg.bgVar,
          color: cfg.colorVar, border: `1px solid ${cfg.color}33`,
          display: 'flex', alignItems: 'center', gap: '0.25rem',
        }}>
          <Icon name={cfg.icon} size={14} /> {cfg.label}
        </span>

        {isPassed ? (
          <span style={{ color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.78rem', fontWeight: 700 }}>
            <Icon name="Check" size={14} /> Done
          </span>
        ) : !unlocked ? (
          <span style={{ color: 'var(--text-muted)' }}><Icon name="Lock" size={15} /></span>
        ) : null}
      </div>

      {/* Row 2: Title */}
      <div>
        <h3 style={{ margin: '0 0 0.25rem', fontSize: '0.92rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.3 }}>
          {mission.title}
        </h3>
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {mission.desc}
        </p>
      </div>

      {/* Row 3: Task type + duration */}
      {task && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '0.72rem', fontWeight: 700, padding: '0.12rem 0.5rem',
            borderRadius: '9999px', background: task.bg,
            color: task.color, border: `1px solid ${task.color}33`,
            display: 'flex', alignItems: 'center', gap: '0.2rem',
          }}>
            <Icon name={task.icon} size={13} /> {task.label}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            <Icon name="Clock" size={13} /> {cfg.duration} min
          </span>
        </div>
      )}

      {/* Row 4: Scoring focus pills */}
      {mission.scoringFocus && (
        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {mission.scoringFocus.map(c => {
            const ev = cfg.evaluation.find(e => e.label === c);
            return (
              <span key={c} style={{
                fontSize: '0.72rem', fontWeight: 700, padding: '0.1rem 0.45rem',
                borderRadius: '9999px', background: cfg.bgVar,
                color: cfg.colorVar, border: `1px solid ${cfg.color}33`,
                display: 'flex', alignItems: 'center', gap: '0.2rem',
              }}>
                {ev && <Icon name={ev.icon} size={12} />} {c}
              </span>
            );
          })}
          {/* 0-5 pips (speaking only) */}
          {mission.part === 'speaking' && (
            <div style={{ display: 'flex', gap: '2px', alignItems: 'center', marginLeft: '2px' }}>
              {[1,2,3,4,5].map(n => (
                <div key={n} style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: n <= 3 ? cfg.colorVar : 'var(--border)',
                }} />
              ))}
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: '2px' }}>/5</span>
            </div>
          )}
        </div>
      )}

      {/* Row 5: Tip */}
      {mission.tip && (
        <div style={{
          padding: '0.4rem 0.65rem',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--accent-orange-bg)',
          border: '1px solid rgba(255,181,71,0.3)',
          fontSize: '0.8rem', color: 'var(--accent-orange)',
          display: 'flex', gap: '0.35rem', lineHeight: 1.4,
        }}>
          <span style={{ flexShrink: 0 }}>💡</span>
          <span>{mission.tip}</span>
        </div>
      )}

      {/* Row 6: Actions */}
      {unlocked && (
        <div style={{ display: 'flex', gap: '0.4rem', marginTop: 'auto', paddingTop: '0.25rem' }}>
          <button
            onClick={() => onStart(mission)}
            style={{
              flex: 1,
              background: `linear-gradient(135deg, ${cfg.colorVar} 0%, ${cfg.color} 100%)`,
              color: '#fff', border: 'none',
              padding: '0.5rem 0.75rem', borderRadius: '9999px',
              fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
              boxShadow: `0 3px 10px ${cfg.color}44`,
              transition: 'all 0.2s ease', fontFamily: 'inherit',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {isPassed ? 'Redo' : 'Begin'} <Icon name="ArrowRight" size={14} />
          </button>

          <button
            onClick={() => setOpen(o => !o)}
            style={{
              background: 'var(--surface-3)', border: '1px solid var(--border)',
              borderRadius: '9999px', padding: '0.5rem 0.65rem',
              fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
              color: 'var(--text-muted)', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: '0.25rem',
              transition: 'all 0.18s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = cfg.colorVar; e.currentTarget.style.color = cfg.colorVar; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <Icon name={cfg.icon} size={15} /> 
            <span style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', display: 'flex' }}>
              <Icon name="ChevronDown" size={15} />
            </span>
          </button>
        </div>
      )}

      {/* Expandable task detail */}
      {open && (
        <div style={{
          padding: '0.85rem', borderRadius: 'var(--radius-sm)',
          background: 'var(--surface-3)', border: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', gap: '0.65rem',
          animation: 'fadeIn 0.2s ease',
          fontSize: '0.85rem',
        }}>
          {/* Scoring */}
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.07em', marginBottom: '0.35rem' }}>
              Scoring
            </div>
            <p style={{ color: 'var(--text-muted)', margin: '0 0 0.45rem', lineHeight: 1.5, fontSize: '0.85rem' }}>
              {cfg.scoring.description}
            </p>
            {cfg.scoring.type === 'scale' ? (
              <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                {cfg.scoring.levels.map(({ score, label, color }) => (
                  <span key={score} style={{
                    padding: '0.15rem 0.5rem', borderRadius: '9999px',
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    fontSize: '0.75rem',
                  }}>
                    <span style={{ fontWeight: 800, color }}>{score}</span>
                    <span style={{ color: 'var(--text-muted)' }}> {label}</span>
                  </span>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {cfg.scoring.types.map(({ label, icon, color }) => (
                  <span key={label} style={{
                    padding: '0.2rem 0.55rem', borderRadius: '9999px',
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    fontSize: '0.75rem', display: 'flex', gap: '0.25rem', alignItems: 'center',
                  }}>
                    <span style={{ color }}><Icon name={icon} size={12} /></span>
                    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Evaluation criteria */}
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.07em', marginBottom: '0.35rem' }}>
              Evaluation
            </div>
            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
              {cfg.evaluation.map(({ label, icon }) => {
                const focus = mission.scoringFocus?.includes(label);
                return (
                  <span key={label} style={{
                    padding: '0.2rem 0.55rem', borderRadius: '9999px',
                    background: focus ? cfg.bgVar : 'var(--surface)',
                    border: `1px solid ${focus ? cfg.color + '55' : 'var(--border)'}`,
                    color: focus ? cfg.colorVar : 'var(--text-muted)',
                    fontWeight: focus ? 700 : 500, fontSize: '0.75rem',
                    display: 'flex', gap: '0.25rem', alignItems: 'center',
                  }}>
                    <Icon name={icon} size={12} /> {label}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ════════════════════════════════════════════════
// PART OVERVIEW CARD (filter tabs at top)
// ════════════════════════════════════════════════
function PartCard({ config, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      flex: '1 1 160px',
      padding: '0.9rem 1rem',
      borderRadius: 'var(--radius-md)',
      border: active ? `2px solid ${config.color}` : '1.5px solid var(--border)',
      background: active ? config.bgVar : 'var(--surface)',
      cursor: 'pointer', textAlign: 'left',
      transition: 'all 0.2s ease',
      boxShadow: active ? `0 4px 18px ${config.color}22` : 'var(--shadow-sm)',
      position: 'relative', overflow: 'hidden',
    }}>
      {active && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: config.colorVar }} />}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
        <span style={{ color: config.colorVar }}><Icon name={config.icon} size={24} /></span>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: active ? config.colorVar : 'var(--text-muted)' }}>
            Part {config.part}
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text)' }}>{config.label}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.45rem' }}>
        <Icon name="Clock" size={13} /> {config.duration} min
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
        {config.evaluation.map(e => (
          <span key={e.label} style={{
            fontSize: '0.75rem', fontWeight: 700, padding: '0.12rem 0.45rem',
            borderRadius: '9999px',
            background: active ? 'rgba(255,255,255,0.55)' : 'var(--surface-3)',
            color: active ? config.colorVar : 'var(--text-muted)',
            border: `1px solid ${active ? config.color + '44' : 'var(--border)'}`,
            display: 'flex', alignItems: 'center', gap: '0.2rem'
          }}>
            <Icon name={e.icon} size={11} /> {e.label}
          </span>
        ))}
      </div>
    </button>
  );
}

// ════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════
export default function LearningPathPage() {
  const [progress,  setProgress]  = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const router = useRouter();

  useEffect(() => {
    fetch('/api/user/progress')
      .then(r => r.json())
      .then(d => { setProgress(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const hasRank = req => true; // Unlocked all activities per user request

  const handleStart = mission => {
    if (hasRank(mission.rankRequired)) {
      const qs = new URLSearchParams({
        mode: mission.targetMode || 'casual',
        customTitle: mission.title,
        customDesc: mission.desc,
        taskType: mission.taskType,
        part: mission.part
      });
      router.push(`/dashboard?${qs.toString()}`);
    }
  };

  const TABS = [
    { id: 'all',       label: 'All Parts', icon: 'Layers' },
    { id: 'speaking',  label: 'Speaking',  icon: 'Mic' },
    { id: 'reading',   label: 'Reading',   icon: 'BookOpen' },
    { id: 'listening', label: 'Listening', icon: 'AudioLines' },
  ];

  // Count modules per section for active filter stats
  const allMods = LEARNING_PATH.flatMap(l => l.modules);
  const counts = {
    all:       allMods.length,
    speaking:  allMods.filter(m => m.part === 'speaking').length,
    reading:   allMods.filter(m => m.part === 'reading').length,
    listening: allMods.filter(m => m.part === 'listening').length,
  };

  // Flatten all modules for a global grid instead of grouped by level
  const allMissions = LEARNING_PATH.flatMap(level => 
    level.modules.map(mod => ({
      ...mod,
      levelId: level.level,
      rankRequired: level.rankRequired,
      targetMode: level.targetMode
    }))
  );

  const getMissionStatus = (rankRequired) => {
    const currentIdx = RANK_ORDER.indexOf(progress?.rank || 'Newbie');
    const reqIdx     = RANK_ORDER.indexOf(rankRequired);
    return {
      unlocked: true, // Always unlocked
      isPassed: currentIdx > reqIdx
    };
  };

  return (
    <div className="app-container">
      <Navbar />
      <style>{`
        .hide-scroll { -ms-overflow-style:none; scrollbar-width:none; }
        .hide-scroll::-webkit-scrollbar { display:none; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <main className="hide-scroll" style={{
        paddingTop: '1.25rem',
        paddingBottom: '5rem',
        paddingLeft: 0,
        paddingRight: 0,
        height: 'calc(100vh - 70px)',
        overflowY: 'auto',
        width: '100%',
        boxSizing: 'border-box',
      }}>

        {/* ── Page Header ─────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem', gap: '1rem', flexWrap: 'wrap', padding: '0 1rem' }}>
          <div>
            <h1 style={{
              fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.04em', margin: 0,
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent-purple) 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              Certification Roadmap
            </h1>
            <p style={{ fontSize: '1rem', color: 'var(--text-muted)', margin: '0.3rem 0 0' }}>
              TOEFL · IELTS · PTE — 3 exam sections · {counts.all} total modules
            </p>
          </div>

          {/* XP Widget */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', padding: '0.7rem 1rem',
            minWidth: '200px', boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Rank</span>
              <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>⚡ {progress?.rank || 'Newbie'}</span>
            </div>
            <div style={{ height: 6, background: 'var(--surface-3)', borderRadius: '9999px', overflow: 'hidden', marginBottom: '0.3rem' }}>
              <div style={{
                width: `${Math.min(100, ((progress?.xp || 0) / (progress?.targetXp || 500)) * 100)}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--primary), var(--primary-light))',
                borderRadius: '9999px', transition: 'width 1s ease',
              }} />
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {progress?.xp || 0} / {progress?.targetXp || 500} XP
            </div>
          </div>
        </div>

        {/* ── Part Cards (3-col grid) ───────────────── */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', padding: '0 1rem' }}>
          {[SPEAKING_TASKS, READING_TASKS, LISTENING_TASKS].map(cfg => (
            <PartCard
              key={cfg.label}
              config={cfg}
              active={activeTab === cfg.label.toLowerCase()}
              onClick={() => setActiveTab(t => t === cfg.label.toLowerCase() ? 'all' : cfg.label.toLowerCase())}
            />
          ))}
        </div>

        {/* ── Tab Filter ───────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem', padding: '0 1rem' }}>
          <div style={{
            display: 'flex', gap: '0.3rem',
            background: 'var(--surface-3)', padding: '0.25rem',
            borderRadius: 'var(--radius-xl)', width: 'fit-content',
          }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                padding: '0.35rem 0.9rem', borderRadius: 'var(--radius-xl)',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: '0.85rem', fontWeight: 600,
                background: activeTab === tab.id ? 'var(--surface)' : 'transparent',
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: activeTab === tab.id ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.18s ease',
                display: 'flex', alignItems: 'center', gap: '0.3rem',
              }}>
                <Icon name={tab.icon} size={15} /> {tab.label}
                <span style={{
                  background: activeTab === tab.id ? 'var(--primary-subtle)' : 'var(--surface-3)',
                  color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                  fontSize: '0.75rem', fontWeight: 800,
                  padding: '0.05rem 0.35rem', borderRadius: '9999px',
                }}>
                  {counts[tab.id]}
                </span>
              </button>
            ))}
          </div>

          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Showing {counts[activeTab]} module{counts[activeTab] !== 1 ? 's' : ''}
            {activeTab !== 'all' ? ` · ${activeTab}` : ''}
          </span>
        </div>

        {/* ── Flat Modules Grid ──────────────────────────── */}
        {loading ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '200px', color: 'var(--text-muted)',
            flexDirection: 'column', gap: '0.75rem',
          }}>
            <span style={{ fontSize: '1rem' }}>Loading roadmap...</span>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.25rem',
            padding: '0 1rem',
          }}>
            {allMissions.map(mission => {
              const { unlocked, isPassed } = getMissionStatus(mission.rankRequired);
              return (
                <ModuleCard
                  key={mission.id}
                  mission={mission}
                  unlocked={unlocked}
                  isPassed={isPassed}
                  activeTab={activeTab}
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
