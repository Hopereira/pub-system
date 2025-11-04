// src/layouts/DashboardLayout.tsx (Versão Final)

import React from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { TabBar } from '@/components/mobile/TabBar';

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen w-full flex-col md:flex-row bg-gray-100 dark:bg-gray-900">
      <Sidebar />

      <div className="flex flex-1 flex-col">
        <Header />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>
      
      {/* Tab Bar Mobile - Aparece apenas em telas pequenas */}
      <TabBar />
    </div>
  );
}