'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import { LEARNING_PATH } from '../../lib/learningPathData';
import { useRouter } from 'next/navigation';

export default function ProfessionalLearningPath() {
    const [progress, setProgress] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetch('/api/user/progress')
            .then(res => res.json())
            .then(data => {
                setProgress(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const rankOrder = ['Newbie', 'Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master'];

    const hasRequiredRank = (requiredRank) => {
        if (!progress || !progress.rank) return false;
        const currentIdx = rankOrder.indexOf(progress.rank);
        const requiredIdx = rankOrder.indexOf(requiredRank);
        return currentIdx >= requiredIdx;
    };

    // Flatten curriculum
    const allMissions = LEARNING_PATH.flatMap((level, levelIdx) => 
        level.modules.map((mod, modIdx) => ({
            ...mod,
            levelId: level.level,
            levelTitle: level.title,
            rankRequired: level.rankRequired,
            targetMode: level.targetMode,
            isCapstone: modIdx === level.modules.length - 1 // Last module of the level
        }))
    );

    const handleStartMission = (mission) => {
        if (hasRequiredRank(mission.rankRequired)) {
            router.push(`/dashboard?mode=${mission.targetMode}`);
        }
    };

    return (
        <div className="app-container" style={{ background: 'var(--background)' }}>
            <Navbar />
            <style jsx global>{`
                .hide-scroll {
                    -ms-overflow-style: none; /* IE and Edge */
                    scrollbar-width: none; /* Firefox */
                }
                .hide-scroll::-webkit-scrollbar {
                    display: none; /* Chrome, Safari and Opera */
                }
            `}</style>
            
            <main className="hide-scroll" style={{ padding: '3rem 1.5rem', maxWidth: '850px', margin: '0 auto', paddingBottom: '6rem', height: 'calc(100vh - 70px)', overflowY: 'auto' }}>
                <header style={{ marginBottom: '4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <div>
                            <h1 style={{ fontSize: '2.5rem', margin: 0, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--text)' }}>
                                Certification Roadmap
                            </h1>
                            <p style={{ opacity: 0.6, fontSize: '1.05rem', margin: '0.5rem 0 0 0', fontWeight: 400 }}>
                                Structured progression for TOEFL, IELTS & PTE Mastery.
                            </p>
                        </div>
                        
                        {/* Status Widget */}
                        <div className="glass-panel" style={{ 
                            position: 'fixed', 
                            top: '80px', 
                            right: '25px', 
                            zIndex: 100, 
                            padding: '0.4rem 1.25rem', 
                            borderRadius: '8px', 
                            border: '1px solid var(--border)', 
                            background: 'var(--surface)',
                            minWidth: '280px',
                            minHeight: 'auto',
                            height: 'fit-content',
                            boxShadow: '0 5px 20px rgba(0,0,0,0.1)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.75rem' }}>
                                <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Current Rank</span>
                                <span style={{ color: '#69db7c', fontWeight: 700 }}>{progress?.rank || 'Newbie'}</span>
                            </div>
                            <div style={{ width: '100%', height: '4px', background: 'var(--surface-3)', borderRadius: '2px', overflow: 'hidden', marginBottom: '0.2rem' }}>
                                <div style={{ 
                                    width: `${Math.min(100, ((progress?.xp || 0) / (progress?.targetXp || 500)) * 100)}%`, 
                                    height: '100%', 
                                    background: '#69db7c',
                                    transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}/>
                            </div>
                            <div style={{ textAlign: 'right', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                                {progress?.xp || 0} / {progress?.targetXp || 500} XP
                            </div>
                        </div>
                    </div>
                </header>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading roadmap...</div>
                ) : (
                    <div style={{ position: 'relative' }}>
                        {/* Professional vertical timeline spine */}
                        <div style={{
                            position: 'absolute',
                            top: '20px', bottom: '40px',
                            left: '23px',
                            width: '2px',
                            background: 'var(--border)',
                            zIndex: 0
                        }}/>

                        {allMissions.map((mission, idx) => {
                            const unlocked = hasRequiredRank(mission.rankRequired);
                            const currentIdx = rankOrder.indexOf(progress?.rank || 'Newbie');
                            const reqIdx = rankOrder.indexOf(mission.rankRequired);
                            const isPassed = currentIdx > reqIdx;

                            // Dynamic styles for states
                            const nodeColor = isPassed ? '#69db7c' : unlocked ? 'var(--text)' : 'var(--border)';
                            const nodeBg = isPassed ? '#69db7c' : 'var(--background)';
                            const cardBorder = isPassed ? '1px solid rgba(105, 219, 124, 0.3)' : unlocked ? '1px solid var(--border)' : '1px solid transparent';
                            const cardBg = unlocked ? 'var(--surface)' : 'transparent';
                            const opacityVal = unlocked ? 1 : 0.4;

                            return (
                                <div key={mission.id} style={{ 
                                    position: 'relative', 
                                    paddingLeft: '4rem', 
                                    marginBottom: mission.isCapstone ? '3rem' : '1.5rem',
                                    opacity: opacityVal,
                                    transition: 'all 0.3s ease'
                                }}>
                                    
                                    {/* Node */}
                                    <div style={{
                                        position: 'absolute',
                                        left: '16px',
                                        top: '24px',
                                        width: '16px',
                                        height: '16px',
                                        borderRadius: '50%',
                                        border: `2px solid ${nodeColor}`,
                                        background: nodeBg,
                                        zIndex: 1,
                                        boxShadow: isPassed ? '0 0 10px rgba(105, 219, 124, 0.5)' : 'none'
                                    }}/>

                                    {/* Course Card */}
                                    <div 
                                        onClick={() => handleStartMission(mission)}
                                        className="roadmap-card"
                                        style={{
                                            background: cardBg,
                                            border: cardBorder,
                                            borderRadius: '12px',
                                            padding: '1.5rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            cursor: unlocked ? 'pointer' : 'default',
                                            boxShadow: unlocked ? '0 4px 6px rgba(0,0,0,0.05)' : 'none',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (unlocked) {
                                                e.currentTarget.style.borderColor = '#69db7c';
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.boxShadow = '0 8px 15px rgba(0,0,0,0.1)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (unlocked) {
                                                e.currentTarget.style.borderColor = cardBorder.split(' ')[2];
                                                e.currentTarget.style.transform = 'none';
                                                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)';
                                            }
                                        }}
                                    >
                                        <div style={{ flex: 1, paddingRight: '2rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                                <span style={{ 
                                                    fontSize: '0.7rem', 
                                                    textTransform: 'uppercase', 
                                                    letterSpacing: '1px', 
                                                    color: mission.isCapstone ? '#ff6b6b' : 'var(--text-secondary)', 
                                                    fontWeight: 600,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.4rem'
                                                }}>
                                                    {mission.isCapstone && (
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                                    )}
                                                    {mission.levelTitle.split(':')[0]} {mission.isCapstone ? '— Capstone' : '— Module'}
                                                </span>
                                                {!unlocked && (
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '0.1rem 0.5rem', borderRadius: '4px' }}>
                                                        Requires {mission.rankRequired}
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: 600, color: 'var(--text)' }}>
                                                {mission.title}
                                            </h3>
                                            <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                                {mission.desc}
                                            </p>
                                        </div>

                                        {/* Action Area */}
                                        <div style={{ minWidth: '100px', display: 'flex', justifyContent: 'flex-end' }}>
                                            {isPassed ? (
                                                <div style={{ color: '#69db7c', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                                    Completed
                                                </div>
                                            ) : unlocked ? (
                                                <button style={{ 
                                                    background: 'var(--text)', color: 'var(--background)',
                                                    border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px',
                                                    fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', gap: '0.4rem'
                                                }}>
                                                    Begin <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                                                </button>
                                            ) : (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--border)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
