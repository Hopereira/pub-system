// Local: src/components/ui/FloatingNav.tsx

'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

// Define a estrutura de cada link de navegação
type NavLink = {
  href: (id: string) => string;
  label: string;
  icon: React.ReactNode;
  activePath: string; // Padrão de rota para verificar se está ativa
};

// Link único para voltar ao portal
const portalLink: NavLink = {
  href: (id) => `/portal-cliente/${id}`,
  label: 'Portal do Cliente',
  icon: <Home className="h-5 w-5" />,
  activePath: '/portal-cliente'
};

export function FloatingNav() {
  const params = useParams();
  const pathname = usePathname();

  const idParam = params.comandaId || params.id;
  const comandaId = Array.isArray(idParam) ? idParam[0] : idParam;

  // Não mostra nada se já estiver no portal ou não tiver comandaId
  if (!comandaId || pathname.startsWith('/portal-cliente')) {
    return null;
  }

  // Botão único e grande para voltar ao portal
  return (
    <Link href={portalLink.href(comandaId)} passHref aria-label={portalLink.label}>
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <Button
          size="lg"
          className="h-14 px-6 rounded-full shadow-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base gap-3 transition-all hover:scale-105 active:scale-95"
        >
          {portalLink.icon}
          <span>{portalLink.label}</span>
        </Button>
      </nav>
    </Link>
  );
}