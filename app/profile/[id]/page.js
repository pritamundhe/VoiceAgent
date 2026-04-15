'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

const Icon = ({ name, size = 16, color = 'currentColor' }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            {name === 'Mail' && <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></>}
            {name === 'Calendar' && <><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>}
            {name === 'Users' && <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>}
            {name === 'Target' && <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>}
            {name === 'Hash' && <><line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="15" x2="20" y2="15" /><line x1="10" y1="3" x2="8" y2="21" /><line x1="16" y1="3" x2="14" y2="21" /></>}
            {name === 'ArrowRight' && <><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12,5 19,12 12,19" /></>}
            {name === 'LogOut' && <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>}
        </svg>
    );
};

export default function UserProfilePage() {
    const { id } = useParams();
    const router = useRouter();
    const [profile, setProfile] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async () => {
        try {
            // Fetch target user profile
            const res = await fetch(`/api/users/${id}`);
            const data = await res.json();
            if (data.user) setProfile(data.user);
            
            // Fetch current user for follow logic
            const authRes = await fetch('/api/auth/me');
            const authData = await authRes.json();
            if (authData.user) setCurrentUser(authData.user);
        } catch (err) {
            console.error('Fetch failed', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [id]);

    const handleFollow = async () => {
        if (!currentUser || !profile) return;
        const isFollowing = profile.followers?.includes(currentUser.userId);
        const endpoint = isFollowing ? '/api/users/unfollow' : '/api/users/follow';
        
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId: profile.userId })
            });
            if (res.ok) {
                fetchProfile();
            }
        } catch (err) {
            console.error('Action failed', err);
        }
    };

    if (loading) return (
        <div className="loading-state">
            <Navbar />
            <div className="center-msg">Loading Profile...</div>
        </div>
    );

    if (!profile) return (
        <div className="loading-state">
            <Navbar />
            <div className="center-msg">User not found</div>
        </div>
    );

    const isOwnProfile = currentUser && currentUser.userId === profile.userId;
    const isFollowing = currentUser && profile.followers?.includes(currentUser.userId);
    const pointsToGo = 1500 - (profile.xp || 651);

    return (
        <div className="profile-page-wrapper">
            <Navbar />

            <main className="profile-content">
                <div className="profile-layout">

                    {/* LEFT SECTION: IDENTITY */}
                    <section className="identity-section">
                        <div className="avatar-capsule">
                            <div className="avatar-border">
                                {profile.image ? (
                                    <img src={profile.image} alt={profile.name} className="avatar-img" />
                                ) : (
                                    <div className="avatar-placeholder">{profile.name?.charAt(0)}</div>
                                )}
                            </div>
                        </div>

                        <div className="identity-info">
                            <h1 className="display-name">{profile.name}</h1>
                            <div className="badge-row">
                                <span className="rank-badge">{profile.rank || 'Beginner'}</span>
                                <span className="xp-text">{profile.xp || 0} / {profile.nextRankXp || 1500} XP</span>
                            </div>
                            <div className="hr-line"></div>
                            <p className="progression-text">
                                Progress towards <span className="highlight">Silver</span> • Points to go: <span className="highlight">{pointsToGo}</span>
                            </p>
                            <div className="actions-row">
                                {!isOwnProfile && currentUser && (
                                    <button 
                                        className={isFollowing ? "btn-glass active" : "btn-blue-solid"}
                                        onClick={handleFollow}
                                    >
                                        {isFollowing ? 'Unfollow' : 'Follow User'}
                                    </button>
                                )}
                                {isOwnProfile && (
                                    <button className="btn-glass" onClick={() => router.push('/profile')}>Edit Profile</button>
                                )}
                                <button className="btn-glass" onClick={() => router.push('/dashboard')}>Dashboard</button>
                            </div>
                        </div>
                    </section>

                    {/* RIGHT SECTION: CARDS */}
                    <section className="cards-section">
                        <div className="cards-grid">
                            {/* Card 1: Public Info */}
                            <div className="dynamic-card">
                                <div className="card-field">
                                    <label>EMAIL ADDRESS</label>
                                    <div className="field-value">{profile.email}</div>
                                </div>
                                <div className="card-field">
                                    <label>MEMBER SINCE</label>
                                    <div className="field-value">
                                        {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : 'March 2026'}
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Social Stats */}
                            <div className="dynamic-card">
                                <div className="stats-container">
                                    <div className="stat-item">
                                        <label>Followers</label>
                                        <div className="stat-number">{profile.followerCount || 0}</div>
                                    </div>
                                    <div className="stat-item">
                                        <label>Following</label>
                                        <div className="stat-number">{profile.followingCount || 0}</div>
                                    </div>
                                </div>
                                <button className="btn-mini-glass" onClick={() => router.push(`/profile/${id}/following`)}>Connections</button>
                            </div>
                        </div>
                    </section>

                </div>
            </main>

            <style jsx>{`
                .profile-page-wrapper {
                    background: #0d1117;
                    height: 100vh;
                    overflow-y: auto;
                    color: #e6edf3;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
                }

                .loading-state {
                    height: 100vh; background: #0d1117; color: #fff;
                }
                .center-msg {
                    height: calc(100vh - 80px); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; font-weight: 600;
                }

                .profile-content {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 4rem 2rem;
                }

                .profile-layout {
                    display: flex;
                    align-items: flex-start;
                    gap: 4rem;
                    flex-wrap: wrap;
                }

                /* IDENTITY SECTION (Left) */
                .identity-section {
                    flex: 1;
                    min-width: 450px;
                    display: flex;
                    align-items: center;
                    gap: 2.5rem;
                }

                .avatar-capsule {
                    flex-shrink: 0;
                }

                .avatar-border {
                    width: 180px;
                    height: 180px;
                    border-radius: 50%;
                    border: 4px solid #1e58f2;
                    padding: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 0 25px rgba(30, 88, 242, 0.25);
                    background: #0d1117;
                }

                .avatar-img { 
                    width: 100%; height: 100%; border-radius: 50%; object-fit: cover; 
                    box-shadow: inset 0 0 10px rgba(0,0,0,0.5);
                }
                .avatar-placeholder { 
                    width: 100%; height: 100%; border-radius: 50%; 
                    background: #0d1117; display: flex; align-items: center; justify-content: center;
                    font-size: 3rem; font-weight: 800; color: #30363d;
                }

                .display-name {
                    font-size: 2.8rem;
                    font-weight: 900;
                    margin: 0 0 0.5rem 0;
                    letter-spacing: -0.04em;
                    white-space: nowrap;
                }

                .badge-row {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }

                .rank-badge {
                    background: #1e58f2;
                    color: #fff;
                    padding: 0.35rem 1.2rem;
                    border-radius: 10px;
                    font-size: 0.95rem;
                    font-weight: 700;
                    box-shadow: 0 4px 15px rgba(30, 88, 242, 0.2);
                }

                .xp-text {
                    color: #4493f8;
                    font-size: 0.95rem;
                    font-weight: 600;
                }

                .hr-line {
                    height: 1px;
                    background: #30363d;
                    margin: 1.5rem 0;
                    width: 100%;
                }

                .progression-text {
                    color: #8b949e;
                    font-size: 1rem;
                    font-weight: 400;
                }
                .highlight { font-weight: 700; color: #fff; }

                /* CARDS SECTION (Right) */
                .cards-section {
                    flex: 1.5;
                    min-width: 600px;
                    position: relative;
                }

                .cards-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                }

                .dynamic-card {
                    background: #0d1117;
                    border: 1px solid #30363d;
                    border-radius: 24px;
                    padding: 1.5rem 2rem;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
                    transition: border-color 0.2s;
                    min-height: 160px;
                }
                .dynamic-card:hover { border-color: #3b82f6; }

                .card-field {
                    margin-bottom: 1.5rem;
                }
                .card-field:last-child {
                    margin-bottom: 0;
                }
                .card-field label {
                    display: block;
                    font-size: 0.7rem;
                    font-weight: 700;
                    color: #8b949e;
                    margin-bottom: 0.35rem;
                }
                .field-value {
                    font-size: 1.35rem;
                    font-weight: 800;
                    color: #fff;
                }

                .actions-row {
                    display: flex;
                    gap: 0.8rem;
                    margin-top: 1rem;
                    width: 100%;
                }

                .stats-container {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 1rem;
                }

                .stat-item {
                    display: flex;
                    flex-direction: column;
                }
                .stat-item label { display: block; font-size: 0.7rem; color: #8b949e; margin-bottom: 0.4rem; }
                .stat-number { font-size: 2.2rem; font-weight: 900; color: #fff; }

                .btn-mini-glass {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid #30363d;
                    color: #fff;
                    padding: 0.6rem;
                    border-radius: 12px;
                    font-size: 0.85rem;
                    font-weight: 700;
                    cursor: pointer;
                    margin-top: auto;
                    width: 100%;
                    transition: all 0.2s;
                }
                .btn-mini-glass:hover {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: #3b82f6;
                }

                .btn-glass {
                    flex: 1;
                    background: #161b22;
                    border: 1px solid #30363d;
                    color: #e6edf3;
                    padding: 0.8rem;
                    border-radius: 12px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-glass:hover { background: #30363d; }
                .btn-glass.active { background: #30363d; border-color: #4493f8; }

                .btn-blue-solid {
                    flex: 1;
                    background: #1e58f2;
                    border: none;
                    color: #fff;
                    padding: 0.8rem;
                    border-radius: 12px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 4px 15px rgba(30, 88, 242, 0.3);
                }
                .btn-blue-solid:hover { background: #1a4cd2; transform: translateY(-1px); }

                @media (max-width: 1100px) {
                    .profile-layout { flex-direction: column; align-items: stretch; }
                    .identity-section { min-width: 0; margin-bottom: 2rem; }
                    .cards-section { min-width: 0; }
                }

                @media (max-width: 600px) {
                    .identity-section { flex-direction: column; text-align: center; }
                    .cards-grid { grid-template-columns: 1fr; }
                    .display-name { font-size: 2.2rem; }
                }
            `}</style>
        </div>
    );
}
