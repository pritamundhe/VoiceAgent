'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function UserProfilePage() {
    const { id } = useParams();
    const [profile, setProfile] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch current user for follow/unfollow logic
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => setCurrentUser(data.user))
            .catch(err => console.error('Auth check failed', err));

        // Fetch target user profile
        fetch(`/api/users/${id}`)
            .then(res => res.json())
            .then(data => {
                if (data.user) setProfile(data.user);
                setLoading(false);
            })
            .catch(err => {
                console.error('Fetch profile failed', err);
                setLoading(false);
            });
    }, [id]);

    const handleFollow = async () => {
        if (!currentUser || !profile) return;
        const isFollowing = profile.followers.includes(currentUser.userId);
        const endpoint = isFollowing ? '/api/users/unfollow' : '/api/users/follow';
        
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId: profile.userId })
            });
            if (res.ok) {
                // Refresh profile to update counts
                const updatedRes = await fetch(`/api/users/${id}`);
                const updatedData = await updatedRes.json();
                if (updatedData.user) setProfile(updatedData.user);
            }
        } catch (err) {
            console.error('Action failed', err);
        }
    };

    if (loading) return <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)' }}>Loading Profile...</div>;
    if (!profile) return <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)' }}>User not found</div>;

    const isOwnProfile = currentUser && currentUser.userId === profile.userId;
    const isFollowing = currentUser && profile.followers.includes(currentUser.userId);

    return (
        <div className="profile-container" style={{ background: 'var(--bg)', minHeight: '100vh' }}>
            <Navbar mode="User Profile" />
            
            <main className="profile-content" style={{ padding: '8rem 2rem 4rem' }}>
                <div className="content-inner" style={{ 
                    maxWidth: '1600px', 
                    width: '95%',
                    margin: '0 auto' 
                }}>
                    <div className="profile-grid" style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '240px 1fr', 
                        gap: '3rem' 
                    }}>
                        <div className="left-col">
                            <div className="avatar-card" style={{
                                width: '240px',
                                height: '240px',
                                background: 'var(--surface)',
                                borderRadius: '24px',
                                border: '1px solid var(--border)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '5rem',
                                color: 'var(--accent)',
                                fontWeight: 700,
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                {profile.image ? (
                                    <img src={profile.image} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    profile.name[0].toUpperCase()
                                )}
                            </div>

                            {!isOwnProfile && currentUser && (
                                <button 
                                    onClick={handleFollow}
                                    style={{
                                        width: '100%',
                                        marginTop: '1.5rem',
                                        padding: '1rem',
                                        borderRadius: '16px',
                                        border: isFollowing ? '1px solid var(--border)' : 'none',
                                        background: isFollowing ? 'var(--surface-2)' : 'var(--text)',
                                        color: isFollowing ? 'var(--text)' : 'var(--bg)',
                                        fontSize: '1rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    {isFollowing ? 'Unfollow' : 'Follow User'}
                                </button>
                            )}
                        </div>

                        <div className="info-card" style={{
                            background: 'var(--surface)',
                            padding: '3rem',
                            borderRadius: '32px',
                            border: '1px solid var(--border)',
                            width: '100%',
                            flex: 1
                        }}>
                            <div className="info-grid" style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '2rem'
                            }}>
                                <div className="info-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                    <div className="info-field">
                                        <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.5rem' }}>Full Name</label>
                                        <div className="field-value" style={{ fontSize: '1.85rem', fontWeight: 600, color: 'var(--text)' }}>{profile.name}</div>
                                    </div>
                                    <div className="info-field">
                                        <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.5rem' }}>Email Address</label>
                                        <div className="field-value" style={{ fontSize: '1.85rem', fontWeight: 600, color: 'var(--text)' }}>{profile.email}</div>
                                    </div>
                                </div>

                                <div className="info-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                    <div className="info-field">
                                        <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.5rem' }}>Followers</label>
                                        <div className="field-value" style={{ fontSize: '1.85rem', fontWeight: 600, color: 'var(--text)' }}>{profile.followerCount}</div>
                                    </div>
                                    <div className="info-field">
                                        <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.5rem' }}>Following</label>
                                        <div className="field-value" style={{ fontSize: '1.85rem', fontWeight: 600, color: 'var(--text)' }}>{profile.followingCount}</div>
                                    </div>
                                </div>

                                <div className="info-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                    <div className="info-field">
                                        <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.5rem' }}>Account ID</label>
                                        <div className="field-value" style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>{profile.userId}</div>
                                    </div>
                                    <div className="info-field">
                                        <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.5rem' }}>Member Since</label>
                                        <div className="field-value" style={{ fontSize: '1.85rem', fontWeight: 600, color: 'var(--text)' }}>{new Date(profile.createdAt).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
