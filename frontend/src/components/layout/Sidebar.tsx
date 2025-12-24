// Caminho: frontend/src/components/layout/Sidebar.tsx

'use client';

import { useAuth } from '@/context/AuthContext';
import { useTurno } from '@/context/TurnoContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home, Users, UtensilsCrossed, BookOpen, ClipboardList, BarChart2,
    Settings, Building2, DoorOpen, ChefHat, Landmark, Presentation,
    Calendar, MapPin, Package, Map, QrCode, Search, Receipt, Calculator, User,
    Crown, Shield // Ícones para Super Admin e features premium
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { getAmbientes } from '@/services/ambienteService';
import { Ambiente } from '@/types/ambiente';
import { usePlanFeatures, Feature } from '@/hooks/usePlanFeatures';

interface NavLink {
    href: string;
    label: string;
    icon: React.ElementType;
    roles: string[];
    feature?: Feature | string; // Feature requerida para mostrar o link
    premium?: boolean; // Indica se é feature premium (mostra badge)
}

const baseNavLinks: NavLink[] = [
  // --- Super Admin (apenas SUPER_ADMIN) ---
  { href: '/super-admin', label: 'Dashboard SaaS', icon: Crown, roles: ['SUPER_ADMIN'] },
  { href: '/super-admin/tenants', label: 'Gestão de Empresas', icon: Building2, roles: ['SUPER_ADMIN'] },
  { href: '/super-admin/pagamentos', label: 'Config. Pagamentos', icon: Settings, roles: ['SUPER_ADMIN'] },
  { href: '/super-admin/planos', label: 'Planos e Faturamento', icon: BarChart2, roles: ['SUPER_ADMIN'] },
  
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
  
  // --- Área de Preparo (Cozinha/Bar) ---
  { href: '/cozinha', label: 'Área de Preparo', icon: ChefHat, roles: ['COZINHA', 'COZINHEIRO', 'BARTENDER'] },
  { href: '/dashboard/operacional/pedidos-prontos', label: 'Pedidos Prontos', icon: ClipboardList, roles: ['COZINHA', 'COZINHEIRO', 'BARTENDER'] },
  
  // --- Dashboard Administrativo ---
  { href: '/dashboard', label: 'Dashboard', icon: Home, roles: ['ADMIN', 'GERENTE'] },
  { href: '/dashboard/gestaopedidos', label: 'Gestão de Pedidos', icon: Package, roles: ['ADMIN', 'GERENTE'] },
  { href: '/dashboard/operacional/mesas', label: 'Mapa de Mesas', icon: UtensilsCrossed, roles: ['ADMIN', 'GERENTE'] },
  
  // --- Links de Administração ---
  { href: '/dashboard/admin/mesas', label: 'Gerir Mesas', icon: Settings, roles: ['ADMIN'] },
  { href: '/dashboard/admin/cardapio', label: 'Gerir Cardápio', icon: BookOpen, roles: ['ADMIN'] },
  { href: '/dashboard/admin/funcionarios', label: 'Funcionários', icon: Users, roles: ['ADMIN'] },
  { href: '/dashboard/admin/ambientes', label: 'Ambientes', icon: DoorOpen, roles: ['ADMIN'] },
  { href: '/dashboard/admin/pontos-entrega', label: 'Pontos de Entrega', icon: MapPin, roles: ['ADMIN'] },
  
  // --- Features BASIC+ (Eventos) ---
  { href: '/dashboard/admin/agenda-eventos', label: 'Agenda de Eventos', icon: Calendar, roles: ['ADMIN'], feature: Feature.EVENTOS, premium: true },
  
  { href: '/dashboard/admin/paginas-evento', label: 'Páginas de Boas-Vindas', icon: Presentation, roles: ['ADMIN'] },
  { href: '/dashboard/admin/empresa', label: 'Empresa', icon: Building2, roles: ['ADMIN'] },
  
  // --- Features PRO+ (Analytics, Relatórios Avançados) ---
  { href: '/dashboard/relatorios', label: 'Relatórios', icon: BarChart2, roles: ['ADMIN'], feature: Feature.ANALYTICS, premium: true },
  
  // --- Configurações ---
  { href: '/dashboard/configuracoes/plano', label: 'Meu Plano', icon: Crown, roles: ['ADMIN'] },
  
  // --- Perfil (todos os cargos) ---
  { href: '/dashboard/perfil', label: 'Meu Perfil', icon: User, roles: ['ADMIN', 'GERENTE', 'GARCOM', 'CAIXA', 'COZINHA', 'COZINHEIRO', 'BARTENDER'] },
];

export function Sidebar() {
  const { user } = useAuth();
  const { temCheckIn } = useTurno();
  const pathname = usePathname();
  const [operationalLinks, setOperationalLinks] = useState<NavLink[]>([]);
  const { hasFeature, loading: planLoading } = usePlanFeatures();

  useEffect(() => {
    const fetchOperationalLinks = async () => {
      try {
        const ambientes = await getAmbientes();
        
        let dynamicLinks = ambientes
          .filter(ambiente => ambiente.tipo === 'PREPARO'); // Filtra apenas ambientes de preparo
        
        // Se for COZINHA/COZINHEIRO, mostra apenas o ambiente onde trabalha
        if (['COZINHA', 'COZINHEIRO', 'BARTENDER'].includes(user?.cargo || '')) {
          if (user?.ambienteId) {
            dynamicLinks = dynamicLinks.filter(ambiente => ambiente.id === user.ambienteId);
          } else {
            // Se não tiver ambienteId configurado, não mostra nenhum painel
            dynamicLinks = [];
          }
        }
        // ADMIN vê todos os painéis (sem filtro adicional)
        
        const links = dynamicLinks.map(ambiente => ({
          href: `/dashboard/operacional/${ambiente.id}`,
          label: `Painel ${ambiente.nome}`,
          icon: ChefHat,
          roles: ['ADMIN', 'COZINHA', 'COZINHEIRO', 'BARTENDER'],
        }));
        
        setOperationalLinks(links);
      } catch (error) {
        console.error('Erro ao buscar links operacionais:', error);
      }
    };

    if (user?.cargo && ['ADMIN', 'COZINHA', 'COZINHEIRO', 'BARTENDER'].includes(user.cargo)) {
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

  // Filtrar por cargo E por feature do plano
  const accessibleLinks = allLinks.filter(link => {
    // Verificar cargo
    if (!user?.cargo || !link.roles.includes(user.cargo)) {
      return false;
    }
    // Verificar feature do plano (se especificada)
    if (link.feature && !hasFeature(link.feature)) {
      return false;
    }
    return true;
  });

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
            <span className="flex-1">{link.label}</span>
            {link.premium && (
              <Crown className="h-3 w-3 text-yellow-500" title="Feature Premium" />
            )}
          </Link>
        ))}
      </nav>
    </aside>
  );
}