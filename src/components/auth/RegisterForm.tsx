'use client';

import Link from 'next/link';
import { useRegister } from '@/hooks/auth/useRegister';

/**
 * RegisterForm Component (Pure View)
 * 
 * Responsibilities:
 * - Render UI only
 * - No business logic
 * 
 * All logic is handled by useRegister hook (ViewModel)
 */
export default function RegisterForm() {
  const {
    username,
    password,
    showPassword,
    error,
    isLoading,
    setUsername,
    setPassword,
    togglePasswordVisibility,
    register,
  } = useRegister();

  return (
    <form onSubmit={register} style={{
      backgroundColor: '#252526', padding: '40px', borderRadius: '12px',
      display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '400px'
    }}>
      <h1 style={{ margin: '0 0 10px 0', textAlign: 'center' }}>Register</h1>

      {error && <div style={{ color: '#d9534f', textAlign: 'center' }}>{error}</div>}

      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
        disabled={isLoading}
        style={{ padding: '12px', borderRadius: '6px', border: '1px solid #3e3e3e', backgroundColor: '#1e1e1e', color: 'white' }}
      />

      <div style={{ position: 'relative', width: '100%' }}>
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
          style={{
            padding: '12px',
            paddingRight: '40px',
            borderRadius: '6px',
            border: '1px solid #3e3e3e',
            backgroundColor: '#1e1e1e',
            color: 'white',
            width: '100%',
            boxSizing: 'border-box'
          }}
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          disabled={isLoading}
          style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: '#aaa',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '18px',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? "🙈" : "👁️"}
        </button>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        style={{
          padding: '14px',
          borderRadius: '6px',
          border: 'none',
          backgroundColor: isLoading ? '#555' : '#28a745',
          color: 'white',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.6 : 1
        }}
      >
        {isLoading ? 'Registering...' : 'Register'}
      </button>

      <div style={{ textAlign: 'center', fontSize: '14px', color: '#aaa' }}>
        Already have an account? <Link href="/login" style={{ color: '#007acc' }}>Login</Link>
      </div>
    </form>
  );
}
