'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

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
        return (
            <div className="loading-state">
                <p>Loading your profile...</p>
                <style jsx>{`
                    .loading-state {
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: var(--bg);
                        color: var(--text-muted);
                        font-family: var(--font-inter);
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="app-container profile-container">
            <Navbar />
            
            <main className="profile-content">
                <div className="content-inner">
                    
                    <header className="profile-header">
                        <div className="badge">User Account — Profile</div>
                    </header>

                    <div className="profile-grid">
                        
                        {/* Avatar Card */}
                        <div className="avatar-section">
                            <div 
                                className="avatar-card"
                                onClick={handleImageClick}
                            >
                                {user.image ? (
                                    <img src={user.image} alt={user.name} className="avatar-img" />
                                ) : (
                                    <div className="avatar-placeholder">{user.name?.charAt(0)}</div>
                                )}
                                
                                {uploading && (
                                    <div className="uploading-overlay">
                                        <span>Uploading...</span>
                                    </div>
                                )}
                                
                                <div className="upload-hint">
                                    Click to change
                                </div>
                            </div>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleFileChange} 
                                style={{ display: 'none' }} 
                                accept="image/*"
                            />
                            <p className="avatar-label">Change Profile Photo</p>
                        </div>

                        {/* Information Card */}
                        <div className="info-section">
                            <div className="visual-card info-card">
                                <div className="info-row">
                                    <div className="info-field">
                                        <label>Full Name</label>
                                        <div className="field-value">{user.name}</div>
                                    </div>

                                    <div className="info-field">
                                        <label>Email Address</label>
                                        <div className="field-value">{user.email}</div>
                                    </div>
                                </div>

                                <div className="info-row">
                                    <div className="info-field">
                                        <label>Followers</label>
                                        <div className="field-value">{user.followerCount || 0}</div>
                                    </div>

                                    <div 
                                        className="info-field clickable" 
                                        onClick={() => router.push('/profile/following')}
                                        style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                                    >
                                        <label>Following</label>
                                        <div className="field-value" style={{ color: 'var(--accent)' }}>{user.followingCount || 0}</div>
                                    </div>
                                </div>

                                <div className="info-row">
                                    <div className="info-field">
                                        <label>Account ID</label>
                                        <div className="field-value small-mono" style={{ fontSize: '1rem', opacity: 0.7 }}>{user.userId}</div>
                                    </div>
                                    <div className="info-field">
                                        <label>Member Since</label>
                                        <div className="field-value small">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'March 2026'}</div>
                                    </div>
                                </div>

                                <div className="profile-actions">
                                    <button 
                                        className="btn btn-primary btn-flexible"
                                        onClick={() => router.push('/dashboard')}
                                    >
                                        Go to Dashboard
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                                    </button>
                                    <button 
                                        className="btn btn-stop btn-flexible"
                                        onClick={handleSignout}
                                    >
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <style jsx>{`
                .profile-container {
                    background: var(--bg);
                    min-height: 100vh;
                    overflow-y: auto !important;
                }

                .profile-content {
                    flex: 1;
                    padding: 4rem 1.5rem 8rem;
                }

                .content-inner {
                    width: 95%;
                    max-width: 1600px;
                    margin: 0 auto;
                }

                .profile-header {
                    margin-bottom: 2rem;
                }

                .badge {
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.15em;
                    margin-bottom: 1.5rem;
                }

                .title {
                    font-family: var(--font-inter); 
                    font-size: clamp(3rem, 8vw, 5rem); 
                    font-weight: 700; 
                    line-height: 0.95; 
                    letter-spacing: -0.05em; 
                    color: var(--text);
                    margin-bottom: 2rem;
                }

                .emphasis {
                    color: var(--text-muted);
                    font-style: italic;
                    font-weight: 400;
                }

                .subtitle {
                    font-size: 1.15rem;
                    color: var(--text-muted);
                    max-width: 580px;
                    line-height: 1.6;
                }

                .profile-grid {
                    display: grid;
                    grid-template-columns: 240px 1fr;
                    gap: 3rem;
                    align-items: start;
                }

                .avatar-section {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .avatar-card {
                    width: 240px;
                    height: 240px;
                    border-radius: 32px;
                    background: var(--surface-2);
                    border: 1px solid var(--border);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    cursor: pointer;
                    position: relative;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 12px 32px -8px rgba(0,0,0,0.3);
                }

                [data-theme="light"] .avatar-card {
                    box-shadow: 0 12px 32px -8px rgba(0,0,0,0.1);
                }

                .avatar-card:hover {
                    transform: translateY(-8px) scale(1.02);
                    box-shadow: 0 24px 48px -12px rgba(0,0,0,0.5);
                }

                [data-theme="light"] .avatar-card:hover {
                    box-shadow: 0 24px 48px -12px rgba(0,0,0,0.15);
                }

                .avatar-img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .avatar-placeholder {
                    font-size: 5rem;
                    color: var(--text-muted);
                    font-weight: 700;
                }

                .uploading-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(var(--bg), 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    backdrop-filter: blur(4px);
                }

                .upload-hint {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: rgba(0,0,0,0.6);
                    padding: 0.75rem;
                    color: #fff;
                    font-size: 0.8rem;
                    font-weight: 600;
                    text-align: center;
                    opacity: 0;
                    transform: translateY(100%);
                    transition: all 0.3s ease;
                }

                .avatar-card:hover .upload-hint {
                    opacity: 1;
                    transform: translateY(0);
                }

                .avatar-label {
                    margin-top: 1.5rem;
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                }

                .info-card {
                    padding: 3rem;
                    background: var(--surface);
                    border: 1px solid var(--border);
                    border-radius: 32px;
                    display: flex;
                    flex-direction: column;
                    gap: 3rem;
                    width: 100%;
                    max-width: none;
                }

                .info-field {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .info-field label {
                    font-size: 0.7rem;
                    font-weight: 700;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.15em;
                    line-height: 1;
                }

                .field-value {
                    font-size: 1.85rem;
                    font-weight: 600;
                    color: var(--text);
                    letter-spacing: -0.02em;
                    line-height: 1.1;
                }

                .field-value.small {
                    font-size: 1.4rem;
                }

                .field-value.small-mono {
                    font-size: 1.1rem;
                    font-family: monospace;
                    opacity: 0.8;
                }

                .info-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 2rem;
                    padding-top: 1rem;
                    border-top: 1px solid var(--border);
                }

                .profile-actions {
                    display: flex;
                    gap: 1rem;
                    margin-top: 1rem;
                }

                .btn-flexible {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    height: 56px;
                    font-size: 1rem;
                    border-radius: 16px;
                }

                @media (max-width: 900px) {
                    .profile-grid {
                        grid-template-columns: 1fr;
                        gap: 4rem;
                    }
                    .avatar-card {
                        width: 220px;
                        height: 220px;
                    }
                    .info-card {
                        padding: 2rem;
                    }
                    .field-value {
                        font-size: 1.75rem;
                    }
                    .info-row {
                        grid-template-columns: 1fr;
                        gap: 2.5rem;
                    }
                }
            `}</style>
        </div>
    );
}
