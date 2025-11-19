'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        const data = await res.json();
        // Persist user info
        localStorage.setItem('chat_user', JSON.stringify(data.user));
        localStorage.setItem('chat_nickname', data.user.username); // Keep for compatibility
        
        router.push(redirectUrl);
      } else {
        const data = await res.json();
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred');
    }
  };

  return (
    <div style={{
      display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#1e1e1e', color: '#f0f0f0'
    }}>
      <form onSubmit={handleLogin} style={{
        backgroundColor: '#252526', padding: '40px', borderRadius: '12px',
        display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '400px'
      }}>
        <h1 style={{ margin: '0 0 10px 0', textAlign: 'center' }}>Login</h1>
        {error && <div style={{ color: '#d9534f', textAlign: 'center' }}>{error}</div>}
        
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={{ padding: '12px', borderRadius: '6px', border: '1px solid #3e3e3e', backgroundColor: '#1e1e1e', color: 'white' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: '12px', borderRadius: '6px', border: '1px solid #3e3e3e', backgroundColor: '#1e1e1e', color: 'white' }}
        />
        
        <button type="submit" style={{
          padding: '14px', borderRadius: '6px', border: 'none',
          backgroundColor: '#007acc', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer'
        }}>
          Login
        </button>
        
        <div style={{ textAlign: 'center', fontSize: '14px', color: '#aaa' }}>
          Don't have an account? <Link href="/register" style={{ color: '#007acc' }}>Register</Link>
        </div>
      </form>
    </div>
  );
}
