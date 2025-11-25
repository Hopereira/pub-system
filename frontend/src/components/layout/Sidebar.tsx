// Caminho: frontend/src/components/layout/Sidebar.tsx

'use client';

import { useAuth } from '@/context/AuthContext';
import { useTurno } from '@/context/TurnoContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home, Users, UtensilsCrossed, BookOpen, ClipboardList, BarChart2,
    Settings, Building2, DoorOpen, ChefHat, Landmark, Presentation,
    Calendar, MapPin, Package, Map, QrCode, Search, Receipt, Calculator // Ícones importados
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { getAmbientes } from '@/services/ambienteService';
import { Ambiente } from '@/types/ambiente';

interface NavLink {
    href: string;
    label: string;
    icon: React.ElementType;
    roles: string[];
}

const baseNavLinks: NavLink[] = [
  // --- Área do Garçom ---
  { href: '/garcom', label: 'Área do Garçom', icon: Home, roles: ['GARCOM'] },
  { href: '/garcom/mapa-visual', label: 'Mapa Visual', icon: Map, roles: ['GARCOM'] },
  { href: '/dashboard/gestaopedidos', label: 'Gestão de Pedidos', icon: Package, roles: ['GARCOM'] },
  { href: '/garcom/qrcode-comanda', label: 'Gerar QR Code', icon: QrCode, roles: ['GARCOM'] },
  
  // --- Área do Caixa ---
  { href: '/caixa', label: 'Área do Caixa', icon: Landmark, roles: ['CAIXA', 'ADMIN', 'GERENTE'] },
  { href: '/caixa/terminal', label: 'Terminal de Caixa', icon: Search, roles: ['CAIXA', 'ADMIN', 'GERENTE'] },
  { href: '/caixa/comandas-abertas', label: 'Comandas Abertas', icon: Receipt, roles: ['CAIXA', 'ADMIN', 'GERENTE'] },
  { href: '/caixa/gestao', label: 'Gestão de Caixas', icon: Calculator, roles: ['ADMIN', 'GERENTE'] },
  
  // --- Dashboard Administrativo ---
  { href: '/dashboard', label: 'Dashboard', icon: Home, roles: ['ADMIN', 'GERENTE'] },
  { href: '/dashboard/gestaopedidos', label: 'Gestão de Pedidos', icon: Package, roles: ['ADMIN', 'GERENTE', 'COZINHA'] },
  { href: '/dashboard/operacional/mesas', label: 'Mapa de Mesas', icon: UtensilsCrossed, roles: ['ADMIN', 'GERENTE'] },
  { href: '/dashboard/operacional/pedidos-prontos', label: 'Pedidos Prontos', icon: ClipboardList, roles: ['ADMIN', 'GERENTE'] },
  // --- Links de Administração ---
  { href: '/dashboard/admin/mesas', label: 'Gerir Mesas', icon: Settings, roles: ['ADMIN'] },
  { href: '/dashboard/admin/cardapio', label: 'Gerir Cardápio', icon: BookOpen, roles: ['ADMIN'] },
  { href: '/dashboard/admin/funcionarios', label: 'Funcionários', icon: Users, roles: ['ADMIN'] }, // Rota corrigida
  { href: '/dashboard/admin/ambientes', label: 'Ambientes', icon: DoorOpen, roles: ['ADMIN'] },
  { href: '/dashboard/admin/pontos-entrega', label: 'Pontos de Entrega', icon: MapPin, roles: ['ADMIN'] },
  { 
    href: '/dashboard/admin/agenda-eventos', 
    label: 'Agenda de Eventos', 
    icon: Calendar, 
    roles: ['ADMIN'] 
  },
  
  { href: '/dashboard/admin/paginas-evento', label: 'Páginas de Boas-Vindas', icon: Presentation, roles: ['ADMIN'] },
  { href: '/dashboard/admin/empresa', label: 'Empresa', icon: Building2, roles: ['ADMIN'] }, // Rota corrigida
  { href: '/dashboard/relatorios', label: 'Relatórios', icon: BarChart2, roles: ['ADMIN'] },
];

export function Sidebar() {
  const { user } = useAuth();
  const { temCheckIn } = useTurno(); // Adicionar para atualização dinâmica
  const pathname = usePathname();
  const [operationalLinks, setOperationalLinks] = useState<NavLink[]>([]);

  useEffect(() => {
    const fetchOperationalLinks = async () => {
      try {
        const ambientes = await getAmbientes();
        const dynamicLinks = ambientes
          .filter(ambiente => ambiente.tipo === 'PREPARO') // Mostra apenas painéis para ambientes de preparo
          .map(ambiente => ({
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
        setOperationalLinks([]);
    }
  }, [user, temCheckIn]); // Atualizar quando temCheckIn mudar

  const allLinks = useMemo(() => {
    const combinedLinks = [...baseNavLinks];
    
    // Adiciona apenas os links operacionais dinâmicos (painéis de cozinha)
    if (operationalLinks.length > 0) {
      const insertIndexOp = combinedLinks.findIndex(link => link.href.includes('Pedidos')) + 1;
      combinedLinks.splice(insertIndexOp, 0, ...operationalLinks);
    }

    return combinedLinks;
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