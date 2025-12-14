'use client';

import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { 
  Home, 
  UtensilsCrossed, 
  ShoppingBag, 
  Receipt, 
  User,
  Users,
  Settings,
  BarChart2,
  LucideIcon 
} from 'lucide-react';

interface TabItem {
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: number;
  roles?: string[];
}

// Tabs para ADMIN/GERENTE
const adminTabs: TabItem[] = [
  { label: 'Início', icon: Home, href: '/dashboard' },
  { label: 'Mesas', icon: UtensilsCrossed, href: '/dashboard/operacional/mesas' },
  { label: 'Pedidos', icon: ShoppingBag, href: '/dashboard/gestaopedidos' },
  { label: 'Gestão', icon: Settings, href: '/dashboard/admin/mesas' },
  { label: 'Perfil', icon: User, href: '/dashboard/perfil' },
];

// Tabs para GARCOM
const garcomTabs: TabItem[] = [
  { label: 'Início', icon: Home, href: '/garcom' },
  { label: 'Mesas', icon: UtensilsCrossed, href: '/garcom/mapa-visual' },
  { label: 'Pedidos', icon: ShoppingBag, href: '/dashboard/gestaopedidos' },
  { label: 'Perfil', icon: User, href: '/dashboard/perfil' },
];

// Tabs para CAIXA
const caixaTabs: TabItem[] = [
  { label: 'Início', icon: Home, href: '/caixa' },
  { label: 'Terminal', icon: Receipt, href: '/caixa/terminal' },
  { label: 'Comandas', icon: ShoppingBag, href: '/caixa/comandas-abertas' },
  { label: 'Perfil', icon: User, href: '/dashboard/perfil' },
];

// Tabs para PREPARO (Cozinheiro, Bartender, etc.)
const preparoTabs: TabItem[] = [
  { label: 'Início', icon: Home, href: '/cozinha' },
  { label: 'Pedidos', icon: ShoppingBag, href: '/cozinha' },
  { label: 'Perfil', icon: User, href: '/dashboard/perfil' },
];

// Tabs padrão
const defaultTabs: TabItem[] = [
  { label: 'Início', icon: Home, href: '/dashboard' },
  { label: 'Perfil', icon: User, href: '/dashboard/perfil' },
];

export function TabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  // Seleciona tabs baseado no cargo
  const getTabs = (): TabItem[] => {
    switch (user?.cargo) {
      case 'ADMIN':
      case 'GERENTE':
        return adminTabs;
      case 'GARCOM':
        return garcomTabs;
      case 'CAIXA':
        return caixaTabs;
      case 'COZINHEIRO':
      case 'BARTENDER':
        return preparoTabs;
      default:
        return defaultTabs;
    }
  };

  const tabs = getTabs();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden">
      <nav className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');

          return (
            <button
              key={tab.href}
              onClick={() => router.push(tab.href)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full relative',
                'transition-colors duration-200',
                'active:scale-95',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <div className="relative">
                <Icon className={cn(
                  'h-6 w-6',
                  isActive && 'drop-shadow-sm'
                )} />
                {tab.badge && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                )}
              </div>
              <span className={cn(
                'text-[10px] font-medium mt-1',
                isActive && 'font-semibold'
              )}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-t-full" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
