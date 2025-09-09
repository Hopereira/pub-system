// Caminho: frontend/src/components/layout/Sidebar.tsx

'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home, Users, UtensilsCrossed, BookOpen, ClipboardList, BarChart2,
    Settings, Building2, DoorOpen, ChefHat
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
// NOVO: Importamos o nosso serviço
import { getAmbientes } from '@/services/ambienteService';
import { AmbienteData } from '@/types/ambiente'; // Supondo o tipo aqui

const baseNavLinks = [
  // ... (a sua lista de links base continua igual)
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

export function Sidebar() {
  const { user } = useAuth(); // ATUALIZADO: Não precisamos mais do token aqui
  const pathname = usePathname();
  const [operationalLinks, setOperationalLinks] = useState<NavLink[]>([]);

  useEffect(() => {
    const fetchOperationalLinks = async () => {
      // O token já é injetado automaticamente pelo nosso serviço
      try {
        // ATUALIZADO: Usamos a função do serviço, muito mais limpa
        const ambientes = await getAmbientes();
        
        const dynamicLinks = ambientes.map(ambiente => ({
            href: `/dashboard/operacional/${ambiente.id}`,
            label: `Painel ${ambiente.nome}`,
            icon: ChefHat,
            roles: ['ADMIN', 'COZINHA'],
        }));

        setOperationalLinks(dynamicLinks);
      } catch (error) {
        console.error('Erro ao buscar links operacionais:', error);
      }
    };

    if (user?.cargo && ['ADMIN', 'COZINHA'].includes(user.cargo)) {
        fetchOperationalLinks();
    } else {
        setOperationalLinks([]); // Garante que os links são limpos se o perfil não for o correto
    }
  }, [user]);

  const allLinks = useMemo(() => {
    // A sua lógica de 'merge' das listas de links já está ótima
    const insertIndex = baseNavLinks.findIndex(link => link.href === '/dashboard/mesas') + 1;
    const newLinks = [...baseNavLinks];
    newLinks.splice(insertIndex, 0, ...operationalLinks);
    return newLinks;
  }, [baseNavLinks, operationalLinks]);

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
            className={clsx( /* ... */ )}
          >
            <link.icon className="h-5 w-5" />
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}