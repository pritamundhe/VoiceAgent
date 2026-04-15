'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/auth/signin');
      } else {
        setError(data.error || 'Failed to sign up');
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ 
      minHeight: '100vh', 
      background: 'radial-gradient(circle at top right, #111, #000)', 
      color: 'var(--text)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Decor */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '-5%',
        width: '40%',
        height: '40%',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.07) 0%, transparent 70%)',
        filter: 'blur(60px)',
        zIndex: 0
      }}></div>
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        right: '-5%',
        width: '40%',
        height: '40%',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.07) 0%, transparent 70%)',
        filter: 'blur(60px)',
        zIndex: 0
      }}></div>

      <div className="glass-panel" style={{ 
        background: 'var(--surface)', 
        backdropFilter: 'var(--glass-blur)',
        borderRadius: '24px', 
        padding: '2.5rem 3rem', 
        width: '100%', 
        maxWidth: '440px', 
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', 
        border: '1px solid var(--border)',
        zIndex: 1,
        animation: 'fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        
        <h1 style={{ 
          fontFamily: 'var(--font-serif), serif', 
          fontSize: '2.5rem', 
          fontWeight: 700, 
          letterSpacing: '-0.02em',
          marginBottom: '0.25rem', 
          color: 'var(--text)', 
          textAlign: 'center' 
        }}>
          Create Account
        </h1>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2rem', fontSize: '0.95rem', fontWeight: 400 }}>
          Start your journey with VoiceAgent.
        </p>
        
        {error && (
          <div style={{ 
            color: '#ff6b6b', 
            background: 'rgba(255, 107, 107, 0.05)', 
            padding: '1rem', 
            borderRadius: '12px', 
            marginBottom: '1.5rem', 
            fontSize: '0.85rem', 
            textAlign: 'center',
            border: '1px solid rgba(255, 107, 107, 0.2)',
            animation: 'fadeIn 0.4s ease'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ position: 'relative' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.85rem', 
              fontWeight: 600, 
              color: 'var(--text-muted)', 
              marginBottom: '0.5rem'
            }}>Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Jane Smith"
              style={{ 
                width: '100%', 
                padding: '0.875rem 1rem', 
                borderRadius: '12px', 
                border: '1px solid var(--border)', 
                background: 'rgba(255, 255, 255, 0.03)', 
                fontSize: '0.95rem', 
                color: 'var(--text)', 
                outline: 'none',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border)';
                e.target.style.background = 'rgba(255, 255, 255, 0.03)';
              }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.85rem', 
              fontWeight: 600, 
              color: 'var(--text-muted)', 
              marginBottom: '0.5rem'
            }}>Email Address</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="jane@superior.com"
              style={{ 
                width: '100%', 
                padding: '0.875rem 1rem', 
                borderRadius: '12px', 
                border: '1px solid var(--border)', 
                background: 'rgba(255, 255, 255, 0.03)', 
                fontSize: '0.95rem', 
                color: 'var(--text)', 
                outline: 'none',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border)';
                e.target.style.background = 'rgba(255, 255, 255, 0.03)';
              }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.85rem', 
              fontWeight: 600, 
              color: 'var(--text-muted)', 
              marginBottom: '0.5rem'
            }}>Password</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              style={{ 
                width: '100%', 
                padding: '0.875rem 1rem', 
                borderRadius: '12px', 
                border: '1px solid var(--border)', 
                background: 'rgba(255, 255, 255, 0.03)', 
                fontSize: '0.95rem', 
                color: 'var(--text)', 
                outline: 'none',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border)';
                e.target.style.background = 'rgba(255, 255, 255, 0.03)';
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
             <input type="checkbox" required style={{ width: '16px', height: '16px', accentColor: 'var(--text)', cursor: 'pointer' }} />
             <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>I agree to the Privacy Policy</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ 
              marginTop: '0.5rem', 
              padding: '0.875rem', 
              borderRadius: '12px', 
              fontWeight: 600, 
              fontSize: '1rem', 
              background: 'var(--text)', 
              color: 'var(--bg)', 
              border: 'none', 
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Signing up...' : 'Sign Up'}
            {!loading && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>}
          </button>
        </form>

        <p style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Already have an account? <Link href="/auth/signin" style={{ color: 'var(--text)', fontWeight: 700, textDecoration: 'none' }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}
