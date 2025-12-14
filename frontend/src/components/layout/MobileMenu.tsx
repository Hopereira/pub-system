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
  Menu
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { getAmbientes } from '@/services/ambienteService';
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
}

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
  { href: '/dashboard/admin/pontos-entrega', label: 'Pontos de Entrega', icon: MapPin, roles: ['ADMIN'] },
  { href: '/dashboard/admin/agenda-eventos', label: 'Agenda de Eventos', icon: Calendar, roles: ['ADMIN'] },
  { href: '/dashboard/admin/paginas-evento', label: 'Páginas de Boas-Vindas', icon: Presentation, roles: ['ADMIN'] },
  { href: '/dashboard/admin/empresa', label: 'Empresa', icon: Building2, roles: ['ADMIN'] },
  { href: '/dashboard/relatorios', label: 'Relatórios', icon: BarChart2, roles: ['ADMIN'] },
];

export function MobileMenu() {
  const { user } = useAuth();
  const { temCheckIn } = useTurno();
  const pathname = usePathname();
  const [operationalLinks, setOperationalLinks] = useState<NavLink[]>([]);
  const [open, setOpen] = useState(false);

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

  const accessibleLinks = allLinks.filter(link =>
    user?.cargo && link.roles.includes(user.cargo)
  );

  const handleLinkClick = () => {
    setOpen(false);
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
          {accessibleLinks.map(link => (
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
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
