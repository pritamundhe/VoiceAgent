'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

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
            {name === 'Edit2' && <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />}
        </svg>
    );
};

export default function ProfilePage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    const router = useRouter();

    const fetchUser = () => {
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (data.user) {
                    setUser(data.user);
                } else {
                    router.push('/auth/signin');
                }
            })
            .catch(err => console.error('Error fetching profile:', err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchUser();
    }, [router]);

    const handleSignout = async () => {
        try {
            await fetch('/api/auth/signout', { method: 'POST' });
            window.location.href = '/';
        } catch (err) {
            console.error('Signout failed', err);
        }
    };

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/auth/profile/image', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                setUser(prev => ({ ...prev, image: data.imageUrl }));
                fetchUser();
            } else {
                alert('Failed to upload image');
            }
        } catch (err) {
            console.error('Upload Error:', err);
            alert('Something went wrong during upload');
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return <div className="loading-state">Loading...</div>;
    }

    const pointsToGo = 1500 - (user.xp || 651);

    return (
        <div className="profile-page-wrapper">
            <Navbar />

            <main className="profile-content">
                <div className="profile-layout">

                    {/* LEFT SECTION: IDENTITY */}
                    <section className="identity-section">
                        <div className="avatar-capsule" onClick={handleImageClick}>
                            <div className="avatar-border">
                                {user.image ? (
                                    <img src={user.image} alt={user.name} className="avatar-img" />
                                ) : (
                                    <div className="avatar-placeholder">{user.name?.charAt(0)}</div>
                                )}
                                {uploading && <div className="pulse-loader"></div>}
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
                        </div>

                        <div className="identity-info">
                            <h1 className="display-name">{user.name}</h1>
                            <div className="badge-row">
                                <span className="rank-badge">{user.rank || 'Beginner'}</span>
                                <span className="xp-text">{user.xp || 0} / {user.nextRankXp || 1500} XP</span>
                            </div>
                            <div className="hr-line"></div>
                            <div className="actions-row">
                                <button className="btn-glass" onClick={() => router.push('/practice')}>Practice</button>
                                <button className="btn-red-outline" onClick={handleSignout}>Sign Out</button>
                            </div>
                        </div>
                    </section>

                    {/* RIGHT SECTION: CARDS */}
                    <section className="cards-section">
                        <div className="cards-grid">
                            {/* Card 1: Account Info */}
                            <div className="dynamic-card">
                                <div className="card-field">
                                    <label>EMAIL ADDRESS</label>
                                    <div className="field-value">{user.email}</div>
                                </div>
                                <div className="card-field">
                                    <label>MEMBER SINCE</label>
                                    <div className="field-value">March 2026</div>
                                </div>
                            </div>

                            {/* Card 2: Social Stats */}
                            <div className="dynamic-card">
                                <div className="stats-container">
                                    <div className="stat-item">
                                        <label>Followers</label>
                                        <div className="stat-number">{user.followerCount || 0}</div>
                                    </div>
                                    <div className="stat-item">
                                        <label>Following</label>
                                        <div className="stat-number">{user.followingCount || 0}</div>
                                    </div>
                                </div>
                                <button className="btn-glass" onClick={() => router.push('/practice')}>Practice</button>
                            </div>
                        </div>
                    </section>

                </div>

                {/* YOUR PROGRESS SECTION */}
                <section className="progress-section">
                    <header className="progress-header">
                        <div className="title-area">
                            <h2>Your progress</h2>
                        </div>
                    </header>

                    <div className="progress-grid">
                        {/* Card 1: Daily Streak */}
                        <div className="progress-card">
                            <div className="card-top">
                                <span className="card-title">Daily streak</span>

                            </div>
                            <div className="streak-content">
                                <div className="streak-main">
                                    <span className="fire-icon">🔥</span>
                                    <span className="streak-value">0 days</span>
                                </div>
                                <div className="shield-toggle">
                                    <div className="shield-icon">🛡️</div>
                                    <div className="toggle-switch"></div>
                                </div>
                            </div>
                        </div>

                        {/* Card 2: Streak Bonus */}
                        <div className="progress-card">
                            <div className="card-top">
                                <span className="card-title">Streak bonus</span>
                                <div className="points-info">
                                    <span className="points-val">1,000 pts</span>

                                </div>
                            </div>
                            <div className="bonus-grid">
                                {[...Array(12)].map((_, i) => (
                                    <div key={i} className="star-circle">★</div>
                                ))}
                            </div>
                        </div>

                        {/* Card 3: Rewards Goal */}
                        <div className="progress-card">
                            <div className="card-top">
                                <span className="card-title">Set a Rewards goal</span>
                            </div>
                            <div className="rewards-content">
                                <div className="rewards-text">
                                    <p>Choose a gift card or donation as your goal</p>
                                    <Link href="#" className="rewards-link">Browse rewards &gt;</Link>
                                </div>
                                <div className="rewards-icon-box">
                                    <div className="gift-box">🎁</div>
                                    <div className="plus-btn">+</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
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
                    height: 100vh; display: flex; align-items: center; justify-content: center; background: #0d1117; color: #fff;
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
                    cursor: pointer;
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
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    background: #0d1117;
                }
                .avatar-border:hover {
                    box-shadow: 0 0 40px rgba(30, 88, 242, 0.4);
                    transform: scale(1.02);
                }

                .avatar-img { 
                    width: 100%; height: 100%; border-radius: 50%; object-fit: cover; 
                    /* Subtle inner glow to match the reference better */
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
                    padding: 0.6rem;
                    border-radius: 10px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-glass:hover { background: #30363d; }

                .btn-red-outline {
                    flex: 1;
                    background: transparent;
                    border: 1px solid #da363355;
                    color: #f85149;
                    padding: 0.6rem;
                    border-radius: 10px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-red-outline:hover { background: #da363311; border-color: #da3633; }

                .stats-container {
                    display: flex;
                    gap: 2rem;
                    margin-bottom: 2rem;
                }
                .stat-item label { display: block; font-size: 0.7rem; color: #8b949e; margin-bottom: 0.4rem; }
                .stat-number { font-size: 2.2rem; font-weight: 900; color: #fff; }

                .btn-full-glass {
                    background: #161b22;
                    border: 1px solid #30363d;
                    color: #4493f8;
                    padding: 0.75rem;
                    border-radius: 12px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-full-glass:hover { background: #30363d; border-color: #4493f8; }

                /* YOUR PROGRESS SECTION */
                .progress-section {
                    margin-top: 4rem;
                }

                .progress-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                }

                .title-area {
                    display: flex;
                    align-items: center;
                    gap: 0.8rem;
                }

                .title-area h2 {
                    font-size: 1.5rem;
                    font-weight: 800;
                    margin: 0;
                }

                .info-icon {
                    color: #8b949e;
                    font-size: 0.9rem;
                    cursor: help;
                }

                .collapse-btn {
                    background: #161b22;
                    border: 1px solid #30363d;
                    color: #8b949e;
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                }

                .progress-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1.5rem;
                }

                .progress-card {
                    background: #161b22;
                    border: 1px solid #30363d;
                    border-radius: 20px;
                    padding: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    transition: border-color 0.2s;
                }
                .progress-card:hover { border-color: #30363d; background: #1c2128; }

                .card-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .card-title {
                    font-size: 0.95rem;
                    font-weight: 500;
                    color: #8b949e;
                }

                .streak-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .streak-main {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                }

                .fire-icon { font-size: 2.8rem; }
                .streak-value { font-size: 2.2rem; font-weight: 900; color: #fff; }

                .shield-toggle {
                    width: 48px;
                    height: 64px;
                    background: #0d1117;
                    border: 1px solid #30363d;
                    border-radius: 12px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                }

                .shield-icon { font-size: 1.2rem; opacity: 0.5; }
                .toggle-switch {
                    width: 24px;
                    height: 12px;
                    background: #30363d;
                    border-radius: 10px;
                    position: relative;
                }
                .toggle-switch::after {
                    content: '';
                    position: absolute;
                    width: 10px;
                    height: 10px;
                    background: #8b949e;
                    border-radius: 50%;
                    left: 1px;
                    top: 1px;
                }

                .points-info {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .points-val {
                    color: #a855f7;
                    font-size: 0.85rem;
                    font-weight: 700;
                }

                .bonus-grid {
                    display: grid;
                    grid-template-columns: repeat(6, 1fr);
                    gap: 1rem;
                }

                .star-circle {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    border: 1px solid #30363d;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #30363d;
                    font-size: 1.2rem;
                }

                .rewards-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .rewards-text p {
                    font-size: 1.15rem;
                    font-weight: 800;
                    color: #fff;
                    margin: 0 0 1rem 0;
                    line-height: 1.3;
                }

                .rewards-link {
                    color: #8b949e;
                    text-decoration: none;
                    font-size: 0.85rem;
                    font-weight: 600;
                }

                .rewards-icon-box {
                    position: relative;
                    width: 80px;
                    height: 80px;
                    background: #0d1117;
                    border: 1px solid #30363d;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .gift-box { font-size: 2.5rem; opacity: 0.8; }
                .plus-btn {
                    position: absolute;
                    bottom: 12px;
                    right: 12px;
                    width: 20px;
                    height: 20px;
                    background: #1e58f2;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #fff;
                    font-size: 1rem;
                    font-weight: 800;
                }

                @media (max-width: 1100px) {
                    .profile-layout { flex-direction: column; align-items: stretch; }
                    .identity-section { min-width: 0; margin-bottom: 2rem; }
                    .cards-section { min-width: 0; }
                }

                @media (max-width: 600px) {
                    .identity-section { flex-direction: column; text-align: center; }
                    .cards-grid { grid-template-columns: 1fr; }
                    .display-name { font-size: 2.2rem; }
                    .member-badge { margin: 0 auto; }
                }
            `}</style>
        </div>
    );
}
