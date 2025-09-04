// Caminho: frontend/src/components/layout/Sidebar.tsx

'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
    Home, 
    Users, 
    UtensilsCrossed, 
    Beer, 
    ClipboardList, 
    BarChart2, 
    Settings, 
    LayoutGrid, 
    Building2, // Ícone para Empresa
    DoorOpen // Ícone para Ambientes
} from 'lucide-react';
import React from 'react';
import clsx from 'clsx'; // NOVO: Importamos a biblioteca clsx

// MELHORIA: Rotas padronizadas sob /dashboard/
const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: Home, roles: ['ADMIN', 'GARCOM', 'CAIXA', 'COZINHA'] },
  { href: '/dashboard/mesas', label: 'Mapa de Mesas', icon: UtensilsCrossed, roles: ['ADMIN', 'GARCOM'] },
  { href: '/dashboard/pedidos', label: 'Pedidos', icon: ClipboardList, roles: ['ADMIN', 'GARCOM', 'COZINHA', 'CAIXA'] },
  { href: '/dashboard/cardapio', label: 'Cardápio', icon: Beer, roles: ['ADMIN'] },
  { href: '/dashboard/funcionarios', label: 'Funcionários', icon: Users, roles: ['ADMIN'] },
  { href: '/dashboard/ambientes', label: 'Ambientes', icon: DoorOpen, roles: ['ADMIN'] },
  { href: '/dashboard/empresa', label: 'Empresa', icon: Building2, roles: ['ADMIN'] },
  { href: '/dashboard/relatorios', label: 'Relatórios', icon: BarChart2, roles: ['ADMIN'] },
];

export function Sidebar() {
  const { user } = useAuth();
  const pathname = usePathname();

  // A sua lógica de filtro já está perfeita, não precisa de alterações.
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
            // MELHORIA: Usamos clsx para uma sintaxe mais limpa
            className={clsx(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-gray-600 transition-all hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-50',
              {
                'bg-gray-200 dark:bg-gray-700 font-bold': pathname === link.href,
              }
            )}
          >
            <link.icon className="h-5 w-5" />
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}