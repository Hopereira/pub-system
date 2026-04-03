// Caminho: frontend/src/components/layout/MobileMenu.tsx

'use client';

import { useAuth } from '@/context/AuthContext';
import { useTurno } from '@/context/TurnoContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Users, UtensilsCrossed, BookOpen, ClipboardList, BarChart2,
  Settings, Building2, DoorOpen, ChefHat, Landmark, Presentation,
  Calendar, MapPin, Package, Map, QrCode, Search, Receipt, Calculator,
  Menu, Lock, X
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { getAmbientes } from '@/services/ambienteService';
import { usePlanFeatures, Feature } from '@/hooks/usePlanFeatures';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface NavLink {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: string[];
  feature?: Feature | string;
}

/** Espelha PLAN_FEATURES do backend */
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

const baseNavLinks: NavLink[] = [
  // --- Área do Garçom ---
  { href: '/garcom', label: 'Área do Garçom', icon: Home, roles: ['GARCOM'] },
  { href: '/dashboard/mapa/visualizar', label: 'Mapa Visual', icon: Map, roles: ['GARCOM'] },
  { href: '/dashboard/gestaopedidos', label: 'Gestão de Pedidos', icon: Package, roles: ['GARCOM'] },
  { href: '/garcom/qrcode-comanda', label: 'Gerar QR Code', icon: QrCode, roles: ['GARCOM'] },
  
  // --- Área do Caixa ---
  { href: '/caixa', label: 'Área do Caixa', icon: Landmark, roles: ['CAIXA', 'ADMIN', 'GERENTE'] },
  { href: '/caixa/terminal', label: 'Terminal de Caixa', icon: Search, roles: ['CAIXA', 'ADMIN', 'GERENTE'] },
  { href: '/caixa/comandas-abertas', label: 'Comandas Abertas', icon: Receipt, roles: ['CAIXA', 'ADMIN', 'GERENTE'] },
  { href: '/caixa/gestao', label: 'Gestão de Caixas', icon: Calculator, roles: ['ADMIN', 'GERENTE'] },
  
  // --- Área de Preparo (Cozinha/Bar) ---
  { href: '/cozinha', label: 'Área de Preparo', icon: ChefHat, roles: ['COZINHEIRO', 'BARTENDER'] },
  
  // --- Dashboard Administrativo ---
  { href: '/dashboard', label: 'Dashboard', icon: Home, roles: ['ADMIN', 'GERENTE'] },
  { href: '/dashboard/gestaopedidos', label: 'Gestão de Pedidos', icon: Package, roles: ['ADMIN', 'GERENTE'] },
  { href: '/dashboard/operacional/mesas', label: 'Mapa de Mesas', icon: UtensilsCrossed, roles: ['ADMIN', 'GERENTE'] },
  { href: '/dashboard/operacional/pedidos-prontos', label: 'Pedidos Prontos', icon: ClipboardList, roles: ['ADMIN', 'GERENTE'] },
  
  // --- Links de Administração ---
  { href: '/dashboard/admin/mesas', label: 'Gerir Mesas', icon: Settings, roles: ['ADMIN'] },
  { href: '/dashboard/admin/cardapio', label: 'Gerir Cardápio', icon: BookOpen, roles: ['ADMIN'] },
  { href: '/dashboard/admin/funcionarios', label: 'Funcionários', icon: Users, roles: ['ADMIN'] },
  { href: '/dashboard/admin/ambientes', label: 'Ambientes', icon: DoorOpen, roles: ['ADMIN'] },
  { href: '/dashboard/admin/pontos-entrega', label: 'Pontos de Entrega', icon: MapPin, roles: ['ADMIN'], feature: Feature.PONTOS_ENTREGA },
  { href: '/dashboard/admin/agenda-eventos', label: 'Agenda de Eventos', icon: Calendar, roles: ['ADMIN'], feature: Feature.EVENTOS },
  { href: '/dashboard/admin/paginas-evento', label: 'Páginas de Boas-Vindas', icon: Presentation, roles: ['ADMIN'] },
  { href: '/dashboard/admin/empresa', label: 'Empresa', icon: Building2, roles: ['ADMIN'] },
  { href: '/dashboard/relatorios', label: 'Relatórios', icon: BarChart2, roles: ['ADMIN'], feature: Feature.ANALYTICS },
];

export function MobileMenu() {
  const { user } = useAuth();
  const { temCheckIn } = useTurno();
  const pathname = usePathname();
  const [operationalLinks, setOperationalLinks] = useState<NavLink[]>([]);
  const [open, setOpen] = useState(false);
  const [lockedInfo, setLockedInfo] = useState<{ label: string; minPlan: string; trialDias: number } | null>(null);
  const { hasFeature } = usePlanFeatures();

  useEffect(() => {
    const fetchOperationalLinks = async () => {
      try {
        const ambientes = await getAmbientes();
        
        let dynamicLinks = ambientes.filter(ambiente => ambiente.tipo === 'PREPARO');
        
        if (['COZINHEIRO', 'BARTENDER'].includes(user?.cargo || '')) {
          if (user?.ambienteId) {
            dynamicLinks = dynamicLinks.filter(ambiente => ambiente.id === user.ambienteId);
          } else {
            dynamicLinks = [];
          }
        }
        
        const links = dynamicLinks.map(ambiente => ({
          href: `/dashboard/operacional/${ambiente.id}`,
          label: `Painel ${ambiente.nome}`,
          icon: ChefHat,
          roles: ['ADMIN', 'COZINHEIRO', 'BARTENDER'],
        }));
        
        setOperationalLinks(links);
      } catch (error) {
        console.error('Erro ao buscar links operacionais:', error);
      }
    };

    if (user?.cargo && ['ADMIN', 'COZINHEIRO', 'BARTENDER'].includes(user.cargo)) {
      fetchOperationalLinks();
    } else {
      setOperationalLinks([]);
    }
  }, [user, temCheckIn]);

  const allLinks = useMemo(() => {
    const combinedLinks = [...baseNavLinks];
    
    if (operationalLinks.length > 0) {
      const insertIndexOp = combinedLinks.findIndex(link => link.href.includes('Pedidos')) + 1;
      combinedLinks.splice(insertIndexOp, 0, ...operationalLinks);
    }

    return combinedLinks;
  }, [operationalLinks]);

  // Links visíveis para o cargo do usuário (role filter)
  const roleLinks = allLinks.filter(link =>
    user?.cargo && link.roles.includes(user.cargo)
  );

  const handleLinkClick = () => {
    setLockedInfo(null);
    setOpen(false);
  };

  const handleLockedClick = (link: NavLink) => {
    const info = link.feature ? FEATURE_PLAN_INFO[link.feature] : null;
    setLockedInfo({
      label: link.label,
      minPlan: info?.minPlan ?? 'superior',
      trialDias: info?.trialDias ?? 0,
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Abrir menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 p-4 overflow-y-auto max-h-[calc(100vh-80px)]">
          {/* Banner de upgrade ao tocar em link bloqueado */}
          {lockedInfo && (
            <div className="mb-3 rounded-lg bg-gray-900 text-white p-3 text-xs space-y-1 relative">
              <button
                onClick={() => setLockedInfo(null)}
                className="absolute top-2 right-2 text-gray-400 hover:text-white"
                aria-label="Fechar"
              >
                <X className="h-3 w-3" />
              </button>
              <p className="font-semibold flex items-center gap-1">
                🔒 Plano {lockedInfo.minPlan} ou superior
              </p>
              <p className="text-gray-300 leading-relaxed">
                <strong>{lockedInfo.label}</strong> requer o plano {lockedInfo.minPlan}.
                {lockedInfo.trialDias > 0 && (
                  <> Teste grátis por <strong>{lockedInfo.trialDias} dias</strong> disponível.</>
                )}
              </p>
              <a
                href="/dashboard/configuracoes/plano"
                className="inline-block text-purple-300 hover:text-purple-200 underline underline-offset-2"
                onClick={() => setOpen(false)}
              >
                Ver planos e fazer upgrade →
              </a>
            </div>
          )}

          {roleLinks.map(link => {
            const isLocked = !!link.feature && !hasFeature(link.feature);
            if (isLocked) {
              return (
                <div
                  key={link.href}
                  onClick={() => handleLockedClick(link)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-gray-400 opacity-40 cursor-not-allowed select-none"
                  aria-disabled="true"
                >
                  <link.icon className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm flex-1">{link.label}</span>
                  <Lock className="h-3 w-3 flex-shrink-0" />
                </div>
              );
            }
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={handleLinkClick}
                className={clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-gray-600 transition-all hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-50',
                  {
                    'bg-gray-200 dark:bg-gray-700 font-bold text-gray-900 dark:text-white': pathname === link.href,
                  }
                )}
              >
                <link.icon className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
