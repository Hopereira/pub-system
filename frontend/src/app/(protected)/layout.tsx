// src/app/(protected)/layout.tsx (Versão Final)
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/layouts/DashboardLayout';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </AuthGuard>
  );
}