// Caminho do arquivo: frontend/src/components/layout/Sidebar.tsx

'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
// ALTERADO: Adicionamos o ícone 'Settings'
import { Home, Users, UtensilsCrossed, Beer, ClipboardList, BarChart2, Settings } from 'lucide-react';
import React from 'react';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: Home, roles: ['ADMIN'] },
  { href: '/mesas', label: 'Mapa de Mesas', icon: UtensilsCrossed, roles: ['ADMIN', 'GARCOM'] },
  { href: '/pedidos', label: 'Pedidos', icon: ClipboardList, roles: ['ADMIN', 'GARCOM', 'COZINHA', 'CAIXA'] },
  { href: '/cardapio', label: 'Cardápio', icon: Beer, roles: ['ADMIN'] },
  { href: '/funcionarios', label: 'Funcionários', icon: Users, roles: ['ADMIN'] },
  // NOVO: Adicionamos o link para a página da Empresa
  { href: '/empresa', label: 'Empresa', icon: Settings, roles: ['ADMIN'] },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart2, roles: ['ADMIN'] },
];

export function Sidebar() {
  const { user } = useAuth();
  const pathname = usePathname();

  const accessibleLinks = navLinks.filter(link => 
    user?.cargo && link.roles.includes(user.cargo)
  );

  return (
    <aside className="hidden w-64 flex-shrink-0 border-r bg-white p-4 dark:bg-gray-800 md:block">
      <nav className="flex flex-col gap-2">
        {accessibleLinks.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-gray-600 transition-all hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-50 ${
              pathname === link.href ? 'bg-gray-200 dark:bg-gray-700 font-bold' : ''
            }`}
          >
            <link.icon className="h-5 w-5" />
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}