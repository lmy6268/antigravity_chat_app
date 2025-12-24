'use client';

import { useAdminAuth } from '@/hooks/admin/useAdminAuth';
import AdminLoginForm from '@/components/admin/AdminLoginForm';
import AdminDashboard from '@/components/admin/AdminDashboard';

export default function AdminPage() {
  const { admin } = useAdminAuth();

  return admin ? <AdminDashboard /> : <AdminLoginForm />;
}
