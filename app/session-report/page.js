'use client';

import { useEffect, useState, useMemo } from 'react';
import Navbar from '../../components/Navbar';
import Link from 'next/link';

const FILLER_WORDS = ['um', 'uh', 'like', 'actually', 'basically'];
const STOP_WORDS = new Set(['a','an','the','and','but','or','nor','for','yet','so','at','by','from','in','into','of','on','to','up','as','be','been','being','is','are','was','were','am','has','have','had','do','does','did','will','would','could','should','may','might','shall','can','this','that','these','those','i','me','my','we','our','you','your','he','him','his','she','her','they','them','their','it','its','what','which','who','when','where','how','with','about','against','through','during','before','after','again','here','there','then']);

function ScoreRing({ score, label, color = '#4493f8', size = 140 }) {
  const r = (size / 2) - 14;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill='none' stroke='#21262d' strokeWidth='10'/>
        <circle cx={size/2} cy={size/2} r={r} fill='none' stroke={color} strokeWidth='10'
          strokeDasharray={`${dash} ${circ}`} strokeLinecap='round'
          style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 6px ${color}88)` }}/>
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <span style={{ fontSize: size > 120 ? '2rem' : '1.3rem', fontWeight: 800, color: '#fff' }}>{score}</span>
        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', padding: '0 4px' }}>{label}</span>
      </div>
    </div>
  );
}

function RadarChart({ data, size = 260 }) {
  const cx = size / 2, cy = size / 2, r = size / 2 - 36;
  const axes = data.map((d, i) => {
    const angle = (i / data.length) * 2 * Math.PI - Math.PI / 2;
    return { ...d, angle, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });
  const getPoint = (axis, val) => {
    const frac = Math.max(0, Math.min(100, val)) / 100;
    return { x: cx + r * frac * Math.cos(axis.angle), y: cy + r * frac * Math.sin(axis.angle) };
  };
  const polyPoints = axes.map(ax => { const p = getPoint(ax, ax.value); return `${p.x},${p.y}`; }).join(' ');
  const gridLevels = [0.25, 0.5, 0.75, 1.0];
  return (
    <svg width={size} height={size}>
      {gridLevels.map(level => (
        <polygon key={level} points={axes.map(ax => `${cx + r * level * Math.cos(ax.angle)},${cy + r * level * Math.sin(ax.angle)}`).join(' ')}
          fill='none' stroke='#21262d' strokeWidth='1'/>
      ))}
      {axes.map((ax, i) => (
        <line key={i} x1={cx} y1={cy} x2={ax.x} y2={ax.y} stroke='#30363d' strokeWidth='1'/>
      ))}
      <polygon points={polyPoints} fill='rgba(68,147,248,0.12)' stroke='#4493f8' strokeWidth='2'
        style={{ filter: 'drop-shadow(0 0 4px rgba(68,147,248,0.4))' }}/>
      {axes.map((ax, i) => {
        const p = getPoint(ax, ax.value);
        return <circle key={i} cx={p.x} cy={p.y} r='4' fill='#4493f8' style={{ filter: 'drop-shadow(0 0 3px #4493f8)' }}/>;
      })}
      {axes.map((ax, i) => (
        <text key={i} x={ax.x + (ax.x - cx) * 0.22} y={ax.y + (ay => ay < cy ? -6 : ay > cy ? 14 : 5)(ax.y)}
          textAnchor={ax.x < cx - 5 ? 'end' : ax.x > cx + 5 ? 'start' : 'middle'}
          fill='#8b949e' fontSize='10' fontWeight='700' fontFamily='Outfit, sans-serif'>{ax.label}</text>
      ))}
    </svg>
  );
}

function MetricBar({ label, value, max = 100, color = '#4493f8', unit = '' }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ marginBottom: '0.9rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
        <span style={{ fontSize: '0.8rem', color: '#8b949e', fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 700 }}>{value}{unit}</span>
      </div>
      <div style={{ height: '6px', background: '#21262d', borderRadius: '100px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '100px',
          boxShadow: `0 0 8px ${color}66`, transition: 'width 1s cubic-bezier(0.4,0,0.2,1)' }}/>
      </div>
    </div>
  );
}

export default function SessionReport() {
  const [report, setReport] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const data = localStorage.getItem('lastSessionReport');
      if (data) {
        const parsed = JSON.parse(data);
        setReport(parsed);
        if (parsed.xpData?.newBadges?.length > 0)
          sessionStorage.setItem('newBadgeEarned', 'true');
      }
    } catch (err) { console.error(err); }
    setTimeout(() => setMounted(true), 100);
  }, []);

  const wordFrequency = useMemo(() => {
    if (!report?.transcript) return [];
    const words = report.transcript.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w) && !FILLER_WORDS.includes(w));
    const freq = {};
    words.forEach(w => freq[w] = (freq[w] || 0) + 1);
    return Object.entries(freq).sort((a,b) => b[1]-a[1]).slice(0, 25);
  }, [report]);

  const hapaxWords = useMemo(() => {
    if (!report?.transcript) return [];
    const words = report.transcript.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 3 && !STOP_WORDS.has(w) && !FILLER_WORDS.includes(w));
    const freq = {};
    words.forEach(w => freq[w] = (freq[w] || 0) + 1);
    return Object.entries(freq).filter(([,v]) => v === 1).map(([w]) => w).slice(0, 30);
  }, [report]);

  const allWords = useMemo(() => {
    if (!report?.transcript) return new Set();
    return new Set(report.transcript.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/));
  }, [report]);

  const tfidfSet = useMemo(() => new Set(report?.metrics?.tfidfTopKeywords || []), [report]);

  const renderAnnotatedTranscript = () => {
    if (!report?.transcript) return null;
    const wordCounts = {};
    report.transcript.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).forEach(w => wordCounts[w] = (wordCounts[w] || 0) + 1);
    const tokens = report.transcript.split(/(\s+)/);
    return tokens.map((token, i) => {
      if (/^\s+$/.test(token)) return <span key={i}>{token}</span>;
      const clean = token.toLowerCase().replace(/[.,!?;:'"()]/g, '');
      if (FILLER_WORDS.includes(clean)) return <span key={i} style={{ background: 'rgba(255,107,107,0.25)', color: '#ff6b6b', padding: '1px 5px', borderRadius: '4px', fontWeight: 700, fontSize: '0.95em' }} title='Filler word'>{token}</span>;
      if (tfidfSet.has(clean)) return <span key={i} style={{ background: 'rgba(68,147,248,0.2)', color: '#79c0ff', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }} title='Key topic word'>{token}</span>;
      if (STOP_WORDS.has(clean)) return <span key={i} style={{ color: '#555d6b', borderBottom: '1px dashed #30363d' }}>{token}</span>;
      if (wordCounts[clean] >= 3) return <span key={i} style={{ background: 'rgba(240,165,0,0.15)', color: '#f0a500', padding: '1px 3px', borderRadius: '3px' }} title='Repeated word'>{token}</span>;
      return <span key={i} style={{ color: '#e6edf3' }}>{token}</span>;
    });
  };

  if (!report) return (
    <div style={{ background: '#0d1117', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b949e' }}>
        No session report found. Try recording something first!
      </div>
    </div>
  );

  const { metrics, aiAnalysis, transcript, modeTitle, timestamp, xpData } = report;
  const m = metrics || {};
  const ai = aiAnalysis || {};
  const fillerRate = m.totalWords > 0 ? ((m.totalFillers / m.totalWords) * 100).toFixed(1) : '0.0';
  const formatDur = s => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;

  const radarData = [
    { label: 'Hesitation', value: m.hesitationScore ?? 75 },
    { label: 'Coherence', value: m.coherenceScore ?? 75 },
    { label: 'Readability', value: m.readabilityScore ?? 60 },
    { label: 'Vocabulary', value: Math.round((m.vocabularyDiversity ?? 0.5) * 100) },
    { label: 'Pace', value: Math.max(0, 100 - (m.paceVariance ?? 20) * 1.5) },
    { label: 'Fluency', value: m.fluencyScore ?? 70 },
  ];

  const maxFreq = wordFrequency[0]?.[1] || 1;

  return (
    <div style={{ background: '#0d1117', minHeight: '100vh', fontFamily: "'Outfit', sans-serif", color: '#e6edf3' }}>
      <Navbar />
      <main style={{ maxWidth: '1300px', margin: '0 auto', padding: '2rem 2rem 6rem' }}>

        {/* ═══ HERO HEADER ═══ */}
        <div style={{ background: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)', border: '1px solid #30363d', borderRadius: '24px', padding: '2.5rem', marginBottom: '2rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '400px', height: '100%', background: 'radial-gradient(ellipse at top right, rgba(68,147,248,0.08) 0%, transparent 70%)', pointerEvents: 'none' }}/>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '280px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#4493f8', textTransform: 'uppercase', letterSpacing: '0.12em', background: 'rgba(68,147,248,0.1)', border: '1px solid rgba(68,147,248,0.2)', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>ML ANALYSIS</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{modeTitle || 'Practice Session'}</span>
              </div>
              <h1 style={{ fontSize: '2.4rem', fontWeight: 800, margin: '0 0 0.5rem', background: 'linear-gradient(135deg, #fff 0%, #8b949e 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Session Analysis</h1>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#8b949e' }}>{timestamp ? new Date(timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : ''}</p>
              {ai.topic && <p style={{ margin: '0.75rem 0 0', fontSize: '1rem', color: '#c9d1d9', fontWeight: 500 }}>Topic: <span style={{ color: '#79c0ff', fontWeight: 600 }}>{ai.topic}</span></p>}
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <ScoreRing score={mounted ? (m.overallMlScore ?? 0) : 0} label='ML Score' color='#4493f8' size={140}/>
              <ScoreRing score={mounted ? (m.fluencyScore ?? 0) : 0} label='Fluency' color='#69db7c' size={110}/>
              <ScoreRing score={mounted ? (ai.confidenceScore ?? 0) : 0} label='Confidence' color='#a855f7' size={110}/>
            </div>
          </div>
          {xpData && (
            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #21262d', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)', borderRadius: '12px', padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#c084fc' }}>+{xpData.xpGained} XP</span>
                <div><div style={{ fontSize: '0.65rem', color: '#a855f7', fontWeight: 700, textTransform: 'uppercase' }}>Earned</div><div style={{ fontSize: '0.8rem', color: '#8b949e' }}>Rank: {xpData.rank}</div></div>
              </div>
              {xpData.streak > 0 && <div style={{ background: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: '12px', padding: '0.6rem 1.2rem' }}>
                <span style={{ fontSize: '1.3rem' }}>🔥</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f0a500', marginLeft: '0.4rem' }}>{xpData.streak} day streak</span>
              </div>}
              {xpData.newBadges?.map(b => (
                <div key={b.id} style={{ background: 'rgba(105,219,124,0.1)', border: '1px solid rgba(105,219,124,0.25)', borderRadius: '12px', padding: '0.6rem 1.2rem' }}>
                  <span style={{ fontSize: '0.7rem', color: '#69db7c', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>New Badge</span>
                  <span style={{ fontWeight: 700, color: '#fff' }}>{b.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ═══ 5 METRIC CARDS ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Total Words', value: m.totalWords ?? 0, icon: '📝', color: '#4493f8' },
            { label: 'Avg Pace', value: `${m.wpm ?? 0} WPM`, icon: '⚡', color: '#69db7c' },
            { label: 'Fluency Score', value: `${m.fluencyScore ?? 0}%`, icon: '✨', color: '#a855f7' },
            { label: 'Filler Rate', value: `${fillerRate}%`, icon: '⚠️', color: m.totalFillers > 5 ? '#ff6b6b' : '#f0a500' },
            { label: 'Duration', value: formatDur(m.duration ?? 0), icon: '⏱️', color: '#79c0ff' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '16px', padding: '1.25rem', textAlign: 'center', transition: 'transform 0.2s, border-color 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = color + '44'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#30363d'; }}>
              <div style={{ fontSize: '1.4rem', marginBottom: '0.4rem' }}>{icon}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color, marginBottom: '0.25rem' }}>{value}</div>
              <div style={{ fontSize: '0.7rem', color: '#8b949e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* ═══ RADAR + WORD CLOUD ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>

          {/* Radar Chart */}
          <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '20px', padding: '1.75rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.1em' }}>ML Profile</span>
              <h3 style={{ margin: '0.2rem 0 0', fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Speech Radar</h3>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <RadarChart data={radarData} size={260}/>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '1rem' }}>
              {radarData.map(d => (
                <div key={d.label} style={{ textAlign: 'center', padding: '0.4rem', background: '#0d1117', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#4493f8' }}>{d.value}</div>
                  <div style={{ fontSize: '0.6rem', color: '#8b949e', fontWeight: 600, textTransform: 'uppercase' }}>{d.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Word Frequency Cloud */}
          <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '20px', padding: '1.75rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Vocabulary</span>
              <h3 style={{ margin: '0.2rem 0 0', fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Word Frequency Cloud</h3>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', padding: '0.5rem 0' }}>
              {wordFrequency.map(([word, count]) => {
                const size = 0.75 + (count / maxFreq) * 1.25;
                const opacity = 0.5 + (count / maxFreq) * 0.5;
                const hue = Math.floor((word.charCodeAt(0) / 26) * 360);
                return (
                  <span key={word} title={`${count}×`} style={{ fontSize: `${size}rem`, fontWeight: count > maxFreq * 0.5 ? 800 : 600, color: `hsl(${hue}, 70%, 65%)`, opacity, cursor: 'default', transition: 'opacity 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={e => e.currentTarget.style.opacity = String(opacity)}>
                    {word}
                  </span>
                );
              })}
              {wordFrequency.length === 0 && <p style={{ color: '#8b949e', fontStyle: 'italic' }}>Not enough content words detected.</p>}
            </div>
          </div>
        </div>

        {/* ═══ LINGUISTIC INTELLIGENCE ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>

          {/* ML Metrics Bars */}
          <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '20px', padding: '1.75rem' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Deep Analysis</span>
              <h3 style={{ margin: '0.2rem 0 0', fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>ML Metric Breakdown</h3>
            </div>
            <MetricBar label='Hesitation Score' value={m.hesitationScore ?? 0} color='#4493f8'/>
            <MetricBar label='Semantic Coherence' value={m.coherenceScore ?? 0} color='#69db7c'/>
            <MetricBar label='Readability (Flesch)' value={m.readabilityScore ?? 0} color='#a855f7'/>
            <MetricBar label='Vocab Diversity (Simpson)' value={Math.round((m.vocabularyDiversity ?? 0) * 100)} color='#f0a500'/>
            <MetricBar label='Hapax Ratio' value={Math.round((m.hapaxRatio ?? 0) * 100)} color='#79c0ff'/>
            <MetricBar label='Pace Control' value={Math.max(0, 100 - (m.paceVariance ?? 20) * 1.5)} color='#69db7c'/>
          </div>

          {/* Hapax Legomena */}
          <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '20px', padding: '1.75rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Lexical Richness</span>
              <h3 style={{ margin: '0.2rem 0 0', fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Unique Vocabulary</h3>
              <p style={{ margin: '0.4rem 0 0', fontSize: '0.8rem', color: '#8b949e' }}>Words used only once — indicates breadth of vocabulary</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ background: '#0d1117', borderRadius: '10px', padding: '0.6rem 1rem', flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#79c0ff' }}>{m.uniqueWords ?? 0}</div>
                <div style={{ fontSize: '0.65rem', color: '#8b949e', fontWeight: 700, textTransform: 'uppercase' }}>Unique Words</div>
              </div>
              <div style={{ background: '#0d1117', borderRadius: '10px', padding: '0.6rem 1rem', flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#69db7c' }}>{hapaxWords.length}</div>
                <div style={{ fontSize: '0.65rem', color: '#8b949e', fontWeight: 700, textTransform: 'uppercase' }}>Hapax Words</div>
              </div>
              <div style={{ background: '#0d1117', borderRadius: '10px', padding: '0.6rem 1rem', flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f0a500' }}>{m.repeatedWordsCount ?? 0}</div>
                <div style={{ fontSize: '0.65rem', color: '#8b949e', fontWeight: 700, textTransform: 'uppercase' }}>Repeats</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', maxHeight: '130px', overflowY: 'auto' }}>
              {hapaxWords.map(w => (
                <span key={w} style={{ background: 'rgba(121,192,255,0.08)', border: '1px solid rgba(121,192,255,0.15)', color: '#79c0ff', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>{w}</span>
              ))}
              {hapaxWords.length === 0 && <p style={{ color: '#8b949e', fontStyle: 'italic', fontSize: '0.9rem' }}>Speak more to generate vocabulary data.</p>}
            </div>
          </div>
        </div>

        {/* ═══ TF-IDF KEYWORDS ═══ */}
        {m.tfidfTopKeywords?.length > 0 && (
          <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '20px', padding: '1.75rem', marginBottom: '2rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.1em' }}>NLP · TF-IDF</span>
              <h3 style={{ margin: '0.2rem 0 0', fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Top Topic Keywords</h3>
              <p style={{ margin: '0.3rem 0 0', fontSize: '0.8rem', color: '#8b949e' }}>Statistically significant terms that define your speech topic</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {m.tfidfTopKeywords.map((kw, i) => (
                <div key={kw} style={{ background: 'rgba(68,147,248,0.08)', border: '1px solid rgba(68,147,248,0.25)', borderRadius: '12px', padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', boxShadow: '0 0 15px rgba(68,147,248,0.08)' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#4493f8', background: 'rgba(68,147,248,0.2)', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>#{i+1}</span>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: '#79c0ff' }}>{kw}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ AI COACH FEEDBACK ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '20px', padding: '1.75rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.1em' }}>AI Coach · GPT-4</span>
              <h3 style={{ margin: '0.2rem 0 0', fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Performance Feedback</h3>
            </div>
            <p style={{ fontSize: '1rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.85)', margin: '0 0 1.5rem' }}>{ai.feedback}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              {(ai.suggestions || []).map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.8rem', padding: '0.85rem 1rem', background: '#0d1117', borderRadius: '10px', borderLeft: '3px solid #a855f7', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#a855f7', background: 'rgba(168,85,247,0.15)', padding: '0.15rem 0.45rem', borderRadius: '5px', minWidth: 'fit-content', marginTop: '2px' }}>TIP {i+1}</span>
                  <span style={{ fontSize: '0.92rem', lineHeight: 1.5, color: '#c9d1d9' }}>{s}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sentence stats */}
          <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '20px', padding: '1.75rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Structure</span>
              <h3 style={{ margin: '0.2rem 0 0', fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Sentence Analysis</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {[
                { label: 'Sentence Complexity', value: `${m.sentenceComplexity ?? 0} words/sent`, color: '#4493f8', note: m.sentenceComplexity > 20 ? 'Complex — consider shorter sentences' : m.sentenceComplexity < 8 ? 'Too short — expand your thoughts' : 'Ideal range ✓' },
                { label: 'Pace Variance', value: `±${m.paceVariance ?? 0} WPM`, color: '#f0a500', note: m.paceVariance > 40 ? 'High variance — work on consistent pacing' : 'Good pace control ✓' },
                { label: 'Grammar Errors', value: m.grammarErrors ?? 0, color: m.grammarErrors > 5 ? '#ff6b6b' : '#69db7c', note: m.grammarErrors > 5 ? 'Several errors detected' : 'Good grammatical control ✓' },
                { label: 'Vocab Richness (TTR)', value: m.vocabRichness ?? 0, color: '#a855f7', note: m.vocabRichness > 0.7 ? 'Excellent vocabulary variety ✓' : 'Try using more varied vocabulary' },
                { label: 'Filler Words', value: m.totalFillers ?? 0, color: m.totalFillers > 5 ? '#ff6b6b' : '#69db7c', note: m.totalFillers > 5 ? 'Reduce um/uh/like usage' : 'Minimal fillers — great! ✓' },
              ].map(({ label, value, color, note }) => (
                <div key={label} style={{ background: '#0d1117', borderRadius: '10px', padding: '0.75rem 1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.78rem', color: '#8b949e', fontWeight: 600 }}>{label}</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color }}>{value}</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#555d6b' }}>{note}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ ANNOTATED TRANSCRIPT ═══ */}
        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '20px', padding: '1.75rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Full Transcript</span>
              <h3 style={{ margin: '0.2rem 0 0', fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Annotated Speech</h3>
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              {[
                { bg: 'rgba(255,107,107,0.25)', color: '#ff6b6b', label: 'Filler Word' },
                { bg: 'rgba(68,147,248,0.2)', color: '#79c0ff', label: 'Key Topic' },
                { bg: 'rgba(240,165,0,0.15)', color: '#f0a500', label: 'Repeated (3×+)' },
                { bg: 'transparent', color: '#555d6b', label: 'Stop Word', border: '1px dashed #30363d' },
              ].map(({ bg, color, label, border }) => (
                <span key={label} style={{ fontSize: '0.7rem', fontWeight: 700, color, background: bg, border: border || 'none', padding: '0.2rem 0.6rem', borderRadius: '5px' }}>{label}</span>
              ))}
            </div>
          </div>
          <div style={{ lineHeight: 2.1, fontSize: '1.05rem', padding: '1rem', background: '#0d1117', borderRadius: '12px', border: '1px solid #21262d', maxHeight: '400px', overflowY: 'auto' }}>
            {transcript ? renderAnnotatedTranscript() : <span style={{ color: '#8b949e', fontStyle: 'italic' }}>No transcript available.</span>}
          </div>
        </div>

        {/* ═══ ACTION BUTTONS ═══ */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link href='/practice' style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, #4493f8, #79c0ff)', color: '#0d1117', borderRadius: '14px', padding: '0.9rem 2rem', fontWeight: 800, fontSize: '1rem', textDecoration: 'none', boxShadow: '0 4px 20px rgba(68,147,248,0.3)', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(68,147,248,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(68,147,248,0.3)'; }}>
            🎤 Practice Again
          </Link>
          <Link href='/analytics' style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#161b22', color: '#e6edf3', border: '1px solid #30363d', borderRadius: '14px', padding: '0.9rem 2rem', fontWeight: 700, fontSize: '1rem', textDecoration: 'none', transition: 'border-color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#4493f8'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#30363d'}>
            📊 View All Analytics
          </Link>
        </div>

      </main>
    </div>
  );
}
