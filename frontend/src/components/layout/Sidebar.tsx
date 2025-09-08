// Caminho: frontend/src/components/layout/Sidebar.tsx

'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home,
    Users,
    UtensilsCrossed,
    Book,
    ClipboardList,
    BarChart2,
    Settings,
    Building2,
    DoorOpen,
    ChefHat,
    BookOpen
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';

// ... (baseNavLinks continua igual)
const baseNavLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: Home, roles: ['ADMIN', 'GARCOM', 'CAIXA', 'COZINHA'] },
  { href: '/dashboard/mesas', label: 'Mapa de Mesas', icon: UtensilsCrossed, roles: ['ADMIN', 'GARCOM'] },
  { href: '/dashboard/pedidos', label: 'Pedidos', icon: ClipboardList, roles: ['ADMIN', 'GARCOM', 'CAIXA'] },
  { href: '/dashboard/admin/mesas', label: 'Gerir Mesas', icon: Settings, roles: ['ADMIN'] },
  { href: '/dashboard/admin/cardapio', label: 'Gerir Cardápio', icon: BookOpen, roles: ['ADMIN'] },
  { href: '/dashboard/funcionarios', label: 'Funcionários', icon: Users, roles: ['ADMIN'] },
  { href: '/dashboard/ambientes', label: 'Ambientes', icon: DoorOpen, roles: ['ADMIN'] },
  { href: '/dashboard/empresa', label: 'Empresa', icon: Building2, roles: ['ADMIN'] },
  { href: '/dashboard/relatorios', label: 'Relatórios', icon: BarChart2, roles: ['ADMIN'] },
];

interface NavLink {
    href: string;
    label: string;
    icon: React.ElementType;
    roles: string[];
}

interface Ambiente {
    id: string;
    nome: string;
}

export function Sidebar() {
  const { user, token } = useAuth();
  const pathname = usePathname();
  const [operationalLinks, setOperationalLinks] = useState<NavLink[]>([]);

  useEffect(() => {
    const fetchOperationalLinks = async () => {
      if (!token) return;

      try {
        const response = await fetch('http://localhost:3000/ambientes', {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
            console.error('Falha ao buscar ambientes.');
            return;
        }
        const ambientes: Ambiente[] = await response.json();
        
        // CORREÇÃO: Removemos o .filter() que limitava os nomes
        const dynamicLinks = ambientes.map(ambiente => ({
            href: `/dashboard/operacional/${ambiente.id}`,
            label: `Painel ${ambiente.nome}`,
            icon: ChefHat,
            roles: ['ADMIN', 'COZINHA'],
        }));

        setOperationalLinks(dynamicLinks);
      } catch (error) {
        console.error('Erro ao processar links operacionais:', error);
      }
    };

    if (user?.cargo && ['ADMIN', 'COZINHA'].includes(user.cargo)) {
        fetchOperationalLinks();
    }
  }, [user, token]);

  const allLinks = useMemo(() => {
    const insertIndex = baseNavLinks.findIndex(link => link.href === '/dashboard/mesas') + 1;
    const newLinks = [...baseNavLinks];
    newLinks.splice(insertIndex, 0, ...operationalLinks);
    return newLinks;
  }, [operationalLinks]);

  const accessibleLinks = allLinks.filter(link =>
    user?.cargo && link.roles.includes(user.cargo)
  );

  return (
    <aside className="hidden w-64 flex-shrink-0 border-r bg-white p-4 dark:bg-gray-800 md:block">
      <nav className="flex flex-col gap-2">
        {accessibleLinks.map(link => (
          <Link
            key={link.href}
            href={link.href}
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