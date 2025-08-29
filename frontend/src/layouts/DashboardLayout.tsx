// src/layouts/DashboardLayout.tsx (Versão Final)

import React from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
// A BottomNav será criada se necessário, por enquanto focamos no desktop/tablet.

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen w-full flex-col md:flex-row bg-gray-100 dark:bg-gray-900">
      <Sidebar />

      <div className="flex flex-1 flex-col">
        <Header />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
      
      {/* A BottomNav para Mobile, quando criada, será posicionada de forma absoluta ou fixa */}
    </div>
  );
}