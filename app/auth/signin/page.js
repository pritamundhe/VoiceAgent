'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SigninPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        // Refresh to update Navbar
        window.location.href = '/dashboard';
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ minHeight: '100vh', background: '#ffffff', color: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="glass-panel" style={{ background: '#ffffff', borderRadius: '24px', padding: '3.5rem', width: '100%', maxWidth: '480px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', border: '1px solid #eee' }}>
        
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '3rem', fontWeight: 700, marginBottom: '1rem', color: '#000', textAlign: 'center' }}>
          Welcome Back
        </h1>
        <p style={{ color: '#666', textAlign: 'center', marginBottom: '2.5rem', fontSize: '1.05rem' }}>Continue your progress with VoiceAgent.</p>
        
        {error && <div style={{ color: '#ff6b6b', background: 'rgba(255, 107, 107, 0.1)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#4a4a4a', marginBottom: '0.6rem' }}>Email Address</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="jane@superior.com"
              style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '10px', border: '1px solid #e0e0e0', background: '#fff', fontSize: '1rem', color: '#000', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#4a4a4a', marginBottom: '0.6rem' }}>Password</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '10px', border: '1px solid #e0e0e0', background: '#fff', fontSize: '1rem', color: '#000', outline: 'none' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ 
              marginTop: '1.5rem', 
              padding: '1rem', 
              borderRadius: '12px', 
              fontWeight: 600, 
              fontSize: '1rem', 
              background: '#121217', 
              color: '#fff', 
              border: 'none', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'opacity 0.2s'
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
            {!loading && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>}
          </button>
        </form>

        <p style={{ marginTop: '2.5rem', textAlign: 'center', color: '#666', fontSize: '0.95rem' }}>
          New here? <Link href="/auth/signup" style={{ color: '#000', fontWeight: 700, textDecoration: 'none' }}>Create an account</Link>
        </p>
      </div>
    </div>
  );
}
