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
    Crown, Shield, Lock // Ícones para Super Admin e features premium
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { getAmbientes } from '@/services/ambienteService';
import { Ambiente } from '@/types/ambiente';
import { usePlanFeatures, Feature } from '@/hooks/usePlanFeatures';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface NavLink {
    href: string;
    label: string;
    icon: React.ElementType;
    roles: string[];
    feature?: Feature | string; // Feature requerida para mostrar o link
    premium?: boolean; // Indica se é feature premium (mostra badge)
}

/**
 * Mapa: feature → plano mínimo + texto de trial
 * Espelha PLAN_FEATURES do backend (plan-features.service.ts)
 */
const FEATURE_PLAN_INFO: Record<string, { minPlan: string; trialDias: number }> = {
  [Feature.CLIENTES]:             { minPlan: 'Básico',     trialDias: 14 },
  [Feature.AVALIACOES]:           { minPlan: 'Básico',     trialDias: 14 },
  [Feature.EVENTOS]:              { minPlan: 'Básico',     trialDias: 14 },
  [Feature.PONTOS_ENTREGA]:       { minPlan: 'Básico',     trialDias: 14 },
  [Feature.ANALYTICS]:            { minPlan: 'Básico',     trialDias: 14 },
  [Feature.RELATORIOS_AVANCADOS]: { minPlan: 'Pro',        trialDias: 7  },
  [Feature.MEDALHAS]:             { minPlan: 'Pro',        trialDias: 7  },
  [Feature.TURNOS]:               { minPlan: 'Pro',        trialDias: 7  },
  [Feature.CAIXA_AVANCADO]:       { minPlan: 'Pro',        trialDias: 7  },
  [Feature.API_EXTERNA]:          { minPlan: 'Enterprise', trialDias: 0  },
  [Feature.WEBHOOKS]:             { minPlan: 'Enterprise', trialDias: 0  },
  [Feature.WHITE_LABEL]:          { minPlan: 'Enterprise', trialDias: 0  },
  [Feature.MULTI_UNIDADE]:        { minPlan: 'Enterprise', trialDias: 0  },
  [Feature.SUPORTE_PRIORITARIO]:  { minPlan: 'Enterprise', trialDias: 0  },
};

/** Componente para links bloqueados pelo plano — opaco + tooltip de upgrade */
function LockedNavLink({ link }: { link: NavLink }) {
  const planInfo = link.feature ? FEATURE_PLAN_INFO[link.feature] : null;
  const minPlan = planInfo?.minPlan ?? 'superior';
  const trialDias = planInfo?.trialDias ?? 0;

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <div
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-400 opacity-40 cursor-not-allowed select-none dark:text-gray-600"
          aria-disabled="true"
        >
          <link.icon className="h-5 w-5 flex-shrink-0" />
          <span className="flex-1 text-sm">{link.label}</span>
          <Lock className="h-3 w-3 flex-shrink-0" />
        </div>
      </TooltipTrigger>
      <TooltipContent side="right" className="bg-gray-900 text-white border-gray-700 max-w-[240px] p-3">
        <div className="space-y-2">
          <p className="font-semibold text-xs flex items-center gap-1">
            🔒 Plano {minPlan} ou superior
          </p>
          <p className="text-xs text-gray-300 leading-relaxed">
            <strong>{link.label}</strong> requer o plano {minPlan}.
            {trialDias > 0 && (
              <> Teste grátis por <strong>{trialDias} dias</strong> disponível.</>
            )}
            {trialDias === 0 && <> Entre em contato para acesso.</>}
          </p>
          <a
            href="/dashboard/configuracoes/plano"
            className="inline-block text-xs text-purple-300 hover:text-purple-200 underline underline-offset-2"
          >
            Ver planos e fazer upgrade →
          </a>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

const baseNavLinks: NavLink[] = [
  // --- Super Admin (apenas SUPER_ADMIN) ---
  { href: '/super-admin', label: 'Dashboard SaaS', icon: Crown, roles: ['SUPER_ADMIN'] },
  { href: '/super-admin/tenants', label: 'Gestão de Empresas', icon: Building2, roles: ['SUPER_ADMIN'] },
  { href: '/super-admin/pagamentos', label: 'Config. Pagamentos', icon: Settings, roles: ['SUPER_ADMIN'] },
  { href: '/super-admin/planos', label: 'Planos e Faturamento', icon: BarChart2, roles: ['SUPER_ADMIN'] },
  { href: '/super-admin/planos/gestao', label: 'Gestão de Planos', icon: Settings, roles: ['SUPER_ADMIN'] },
  { href: '/super-admin/configuracoes', label: 'Configurações', icon: User, roles: ['SUPER_ADMIN'] },
  
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
  { href: '/dashboard/admin/pontos-entrega', label: 'Pontos de Entrega', icon: MapPin, roles: ['ADMIN'], feature: Feature.PONTOS_ENTREGA, premium: true },
  
  // --- Features BASIC+ (Eventos) ---
  { href: '/dashboard/admin/agenda-eventos', label: 'Agenda de Eventos', icon: Calendar, roles: ['ADMIN'], feature: Feature.EVENTOS, premium: true },
  
  { href: '/dashboard/admin/paginas-evento', label: 'Páginas de Boas-Vindas', icon: Presentation, roles: ['ADMIN'], feature: Feature.CARDAPIO_DIGITAL },
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

  // Links visíveis para o cargo do usuário (role filter — não muda)
  const roleLinks = allLinks.filter(link =>
    user?.cargo && link.roles.includes(user.cargo)
  );

  return (
    <aside className="hidden w-64 flex-shrink-0 border-r bg-white p-4 dark:bg-gray-800 md:block">
      <TooltipProvider>
        <nav className="flex flex-col gap-2">
          {roleLinks.map(link => {
            // Feature bloqueada pelo plano → link opaco com tooltip
            const isLocked = !!link.feature && !hasFeature(link.feature);
            if (isLocked) {
              return <LockedNavLink key={link.href} link={link} />;
            }
            // Link normal acessível
            return (
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
                  <span title="Feature Premium">
                    <Crown className="h-3 w-3 text-yellow-500" />
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </TooltipProvider>
    </aside>
  );
}