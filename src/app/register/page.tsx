import { Suspense } from 'react';
import RegisterForm from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <div style={{
      display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#1e1e1e', color: '#f0f0f0'
    }}>
      <Suspense fallback={<div style={{ color: '#aaa' }}>Loading...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
