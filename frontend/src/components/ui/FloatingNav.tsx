// Local: src/components/ui/FloatingNav.tsx

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Home, Beer, ReceiptText } from 'lucide-react';
import { getPublicComandaById } from '@/services/comandaService';
import { ComandaStatus } from '@/types/comanda';

// Define a estrutura de cada link de navegação
type NavLink = {
  href: (id: string) => string;
  label: string;
  icon: React.ReactNode;
  activePath: string; // Padrão de rota para verificar se está ativa
};

// Array com os links da navegação
const navLinks: NavLink[] = [
  { href: (id) => `/portal-cliente/${id}`, label: 'Portal', icon: <Home className="h-4 w-4" />, activePath: '/portal-cliente' },
  { href: (id) => `/cardapio/${id}`, label: 'Cardápio', icon: <Beer className="h-4 w-4" />, activePath: '/cardapio' },
  { href: (id) => `/acesso-cliente/${id}`, label: 'Pedidos', icon: <ReceiptText className="h-4 w-4" />, activePath: '/acesso-cliente' },
];

export function FloatingNav() {
  const params = useParams();
  const pathname = usePathname();
  const [comandaStatus, setComandaStatus] = useState<ComandaStatus | null>(null);

  // ==================================================================
  // ## A CORREÇÃO ESTÁ AQUI ##
  // 1. Buscamos o parâmetro da URL, seja ele 'comandaId' ou 'id'.
  const idParam = params.comandaId || params.id;
  
  // 2. Criamos (declaramos) a variável 'comandaId' que será usada logo abaixo.
  const comandaId = Array.isArray(idParam) ? idParam[0] : idParam;
  // ==================================================================

  // Verifica status da comanda
  useEffect(() => {
    const verificarStatus = async () => {
      if (!comandaId) return;
      
      try {
        const comanda = await getPublicComandaById(comandaId as string);
        setComandaStatus(comanda.status);
      } catch (error) {
        console.error('Erro ao verificar status da comanda:', error);
      }
    };

    verificarStatus();
  }, [comandaId]);

  // Agora esta verificação funcionará, pois a variável 'comandaId' existe.
  if (!comandaId) {
    return null;
  }

  // Se comanda está paga/fechada, esconde botão Cardápio
  const comandaPaga = comandaStatus === ComandaStatus.PAGA || comandaStatus === ComandaStatus.FECHADA;
  const linksVisiveis = comandaPaga 
    ? navLinks.filter(link => link.activePath !== '/cardapio')
    : navLinks;

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-background/80 backdrop-blur-sm border border-border rounded-full shadow-lg z-50">
      {linksVisiveis.map((link) => {
        const isActive = pathname.startsWith(link.activePath);

        return (
          <Link href={link.href(comandaId)} key={link.label} passHref aria-label={link.label}>
            <Button
              variant={isActive ? 'secondary' : 'ghost'}
              className="flex flex-col h-auto p-2 sm:flex-row sm:h-9 sm:px-4 sm:py-2 gap-1"
            >
              {link.icon}
              <span className="text-xs sm:text-sm">{link.label}</span>
            </Button>
          </Link>
        );
      })}
    </nav>
  );
}