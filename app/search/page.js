'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function SearchPage() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q');
    const [users, setUsers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch current user
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => setCurrentUser(data.user))
            .catch(err => console.error('Auth check failed', err));

        if (query) {
            setLoading(true);
            fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
                .then(res => res.json())
                .then(data => {
                    setUsers(data.users || []);
                    setLoading(false);
                })
                .catch(err => {
                    console.error('Search failed', err);
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, [query]);

    const handleFollow = async (targetUserId, isFollowing) => {
        const endpoint = isFollowing ? '/api/users/unfollow' : '/api/users/follow';
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId })
            });
            if (res.ok) {
                // Update local state
                setUsers(prev => prev.map(u => {
                    if (u._id === targetUserId) {
                        const newFollowers = isFollowing 
                            ? u.followers.filter(id => id !== currentUser._id)
                            : [...u.followers, currentUser._id];
                        return { ...u, followers: newFollowers };
                    }
                    return u;
                }));
            }
        } catch (err) {
            console.error('Action failed', err);
        }
    };

    return (
        <div className="search-container" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
            <Navbar mode="Search" />
            
            <main style={{ padding: '6rem 2rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
                <header style={{ marginBottom: '3rem' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.5rem' }}>
                        Search Results
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {query ? `Found ${users.length} users for "${query}"` : 'Enter a search term in the navbar'}
                    </p>
                </header>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                        Searching for talent...
                    </div>
                ) : (
                    <div className="results-list" style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        gap: '1rem'
                    }}>
                        {users.map(u => {
                            const isFollowing = currentUser && u.followers.includes(currentUser._id);
                            return (
                                <div key={u._id} className="search-item" style={{ 
                                    padding: '0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    background: 'var(--surface)',
                                    borderRadius: '16px',
                                    border: '1px solid var(--border)',
                                    transition: 'all 0.2s ease',
                                    cursor: 'pointer',
                                    overflow: 'hidden'
                                }}>
                                    <Link href={`/profile/${u._id}`} style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '1.5rem', 
                                        padding: '1.25rem 2rem',
                                        flex: 1,
                                        textDecoration: 'none',
                                        color: 'inherit'
                                    }}>
                                        <div className="avatar-preview" style={{
                                            width: '56px',
                                            height: '56px',
                                            borderRadius: '50%',
                                            background: 'var(--surface-2)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1.25rem',
                                            fontWeight: 700,
                                            color: 'var(--accent)',
                                            border: '1px solid var(--border)',
                                            overflow: 'hidden',
                                            flexShrink: 0
                                        }}>
                                            {u.image ? (
                                                <img src={u.image} alt={u.name || 'User'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                (u.name ? u.name[0].toUpperCase() : '?')
                                            )}
                                        </div>
                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '3rem' }}>
                                            <div style={{ minWidth: '200px' }}>
                                                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.1rem' }}>
                                                    {u.name || 'Anonymous User'}
                                                </h3>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                    {u.email}
                                                </p>
                                            </div>
                                            
                                            <div style={{ display: 'flex', gap: '2rem', flex: 1 }}>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Followers</span>
                                                    <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)' }}>{u.followers?.length || 0}</span>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Following</span>
                                                    <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)' }}>{u.following?.length || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                    
                                    <div style={{ padding: '0 2rem' }}>
                                        {currentUser && currentUser.userId !== u._id && (
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleFollow(u._id, isFollowing);
                                                }}
                                                style={{
                                                    padding: '0.6rem 1.5rem',
                                                    borderRadius: '12px',
                                                    border: isFollowing ? '1px solid var(--border)' : 'none',
                                                    background: isFollowing ? 'var(--surface-2)' : 'var(--text)',
                                                    color: isFollowing ? 'var(--text)' : 'var(--bg)',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease',
                                                    minWidth: '100px'
                                                }}
                                            >
                                                {isFollowing ? 'Unfollow' : 'Follow'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {!loading && users.length === 0 && query && (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                        No users found matching your search.
                    </div>
                )}
            </main>

            <style jsx>{`
                .search-item:hover {
                    background: var(--surface-2) !important;
                    border-color: var(--accent);
                }
            `}</style>
        </div>
    );
}
