// src/app/(protected)/layout.tsx (Versão Final)
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { PlanLimitToast } from '@/components/plan/PlanLimitToast';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <DashboardLayout>
        <PlanLimitToast />
        {children}
      </DashboardLayout>
    </AuthGuard>
  );
}