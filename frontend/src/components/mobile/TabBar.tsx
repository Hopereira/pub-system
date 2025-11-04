'use client';

import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Home, 
  UtensilsCrossed, 
  ShoppingBag, 
  Receipt, 
  User,
  LucideIcon 
} from 'lucide-react';

interface TabItem {
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: number;
}

const tabs: TabItem[] = [
  { label: 'Início', icon: Home, href: '/dashboard' },
  { label: 'Mesas', icon: UtensilsCrossed, href: '/dashboard/operacional/mesas' },
  { label: 'Pedidos', icon: ShoppingBag, href: '/dashboard/operacional/todos-pedidos' },
  { label: 'Conta', icon: Receipt, href: '/dashboard/operacional/caixa' },
  { label: 'Perfil', icon: User, href: '/dashboard/perfil' },
];

export function TabBar() {
  const pathname = usePathname();
  const router = useRouter();

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
