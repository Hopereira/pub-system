// Caminho: frontend/src/app/portal-cliente/[comandaId]/ClienteHubPage.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import EventosPubModal from '@/components/cliente/EventosPubModal'; 
import { Comanda } from '@/types/comanda';
import { MapPin, ShoppingBag, Receipt, Calendar, User, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { MudarLocalModal } from '@/components/pontos-entrega/MudarLocalModal';
import { getPublicComandaById } from '@/services/comandaService';

export interface ClienteHubPageProps {
  comanda: Comanda;
  paginaAtiva?: import('@/types/pagina-evento').PaginaEvento | null;
}

export default function ClienteHubPage({ comanda, paginaAtiva }: ClienteHubPageProps) {
  const [isEventosModalOpen, setIsEventosModalOpen] = useState(false);
  const [isLocalModalOpen, setIsLocalModalOpen] = useState(false);
  const [comandaAtualizada, setComandaAtualizada] = useState(comanda); 
  const { theme, setTheme } = useTheme(); 
  
  const comandaId = comanda.id;

  const nomeAmigavel = comanda.cliente?.nome 
    ? comanda.cliente.nome 
    : comanda.mesa?.numero 
        ? `Mesa ${comanda.mesa.numero}`
        : `Comanda ${comandaId.substring(0, 4)}`;

  const tituloPagina = comanda.paginaEvento?.titulo || "Boas vindas";

  return (
    <div className="min-h-screen bg-background">
      {/* Botão Modo Escuro */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="fixed top-4 right-4 z-50 h-10 w-10 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all"
        aria-label="Alternar modo escuro"
      >
        {theme === 'dark' ? (
          <Sun className="h-5 w-5 text-yellow-500" />
        ) : (
          <Moon className="h-5 w-5 text-gray-700" />
        )}
      </Button>

      {/* Hero Section com Imagem */}
      <div className="relative h-[45vh] min-h-[300px]">
        {comanda.paginaEvento?.urlImagem ? (
          <Image
            src={comanda.paginaEvento.urlImagem}
            alt={tituloPagina}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/10 to-background" />
        )}
        
        {/* Overlay Gradiente */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        
        {/* Conteúdo do Hero */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white drop-shadow-2xl mb-3">
            {tituloPagina}
          </h1>
          <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
            <User className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">
              Cliente: <span className="text-primary">{nomeAmigavel}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="container max-w-4xl mx-auto px-4 -mt-16 relative z-10 pb-20">
        <div className="space-y-6">

          {/* Card de Localização */}
          <div className="bg-card rounded-2xl shadow-2xl border-2 overflow-hidden">
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Onde Você Está?</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Informe sua localização para começar a fazer pedidos
              </p>
            </div>
            
            <div className="p-6">
              {(comandaAtualizada.pontoEntrega || comandaAtualizada.mesa) ? (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-sm">
                        <MapPin className="h-3 w-3 mr-1" />
                        Local Atual
                      </Badge>
                    </div>
                    <p className="text-lg font-semibold">
                      {comandaAtualizada.pontoEntrega 
                        ? comandaAtualizada.pontoEntrega.nome 
                        : `Mesa ${comandaAtualizada.mesa?.numero}`
                      }
                    </p>
                    {comandaAtualizada.pontoEntrega?.descricao && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {comandaAtualizada.pontoEntrega.descricao}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={() => setIsLocalModalOpen(true)}
                    variant="outline"
                    className="flex-shrink-0"
                  >
                    Mudar
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Button
                    onClick={() => setIsLocalModalOpen(true)}
                    size="lg"
                    className="w-full h-14"
                  >
                    <MapPin className="w-5 h-5 mr-2" />
                    Informar Minha Localização
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    ⚠️ Escolha seu local para habilitar o cardápio e pedidos
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Botões de Ação Principais */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Cardápio - Desabilitado se não tiver local (mesa OU ponto de entrega) */}
            {(comandaAtualizada.pontoEntrega || comandaAtualizada.mesa) ? (
              <Link href={`/cardapio/${comandaId}`} className="group">
                <div className="bg-primary text-primary-foreground rounded-xl p-6 shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95">
                  <ShoppingBag className="h-10 w-10 mb-3 mx-auto" />
                  <p className="text-center font-semibold text-lg">Cardápio</p>
                  <p className="text-center text-xs opacity-90 mt-1">
                    Faça seu pedido
                  </p>
                </div>
              </Link>
            ) : (
              <div className="opacity-40 cursor-not-allowed">
                <div className="bg-gray-200 text-gray-500 rounded-xl p-6 shadow-lg pointer-events-none">
                  <ShoppingBag className="h-10 w-10 mb-3 mx-auto" />
                  <p className="text-center font-semibold text-lg">Cardápio</p>
                  <p className="text-center text-xs mt-1">
                    Informe seu local primeiro
                  </p>
                </div>
              </div>
            )}

            {/* Meus Pedidos - Desabilitado se não tiver local (mesa OU ponto de entrega) */}
            {(comandaAtualizada.pontoEntrega || comandaAtualizada.mesa) ? (
              <Link href={`/acesso-cliente/${comandaId}`} className="group">
                <div className="bg-card border-2 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95">
                  <Receipt className="h-10 w-10 mb-3 mx-auto text-primary" />
                  <p className="text-center font-semibold text-lg">Meus Pedidos</p>
                  <p className="text-center text-xs text-muted-foreground mt-1">
                    Acompanhe sua conta
                  </p>
                </div>
              </Link>
            ) : (
              <div className="opacity-40 cursor-not-allowed">
                <div className="bg-gray-200 text-gray-500 rounded-xl p-6 shadow-lg pointer-events-none">
                  <Receipt className="h-10 w-10 mb-3 mx-auto" />
                  <p className="text-center font-semibold text-lg">Meus Pedidos</p>
                  <p className="text-center text-xs mt-1">
                    Informe seu local primeiro
                  </p>
                </div>
              </div>
            )}

            {/* Eventos - Sempre habilitado */}
            <button
              onClick={() => setIsEventosModalOpen(true)}
              className="group"
            >
              <div className="bg-card border-2 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95">
                <Calendar className="h-10 w-10 mb-3 mx-auto text-primary" />
                <p className="text-center font-semibold text-lg">Eventos</p>
                <p className="text-center text-xs text-muted-foreground mt-1">
                  Confira a agenda
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>

      <EventosPubModal
          open={isEventosModalOpen}
          onOpenChange={setIsEventosModalOpen}
      />

      <MudarLocalModal
        comandaId={comandaId}
        pontoAtualId={comandaAtualizada.pontoEntrega?.id}
        mesaAtualId={comandaAtualizada.mesa?.id}
        agregadosAtuais={comandaAtualizada.agregados}
        open={isLocalModalOpen}
        onOpenChange={setIsLocalModalOpen}
        onSuccess={async () => {
          try {
            const comandaNova = await getPublicComandaById(comandaId);
            if (comandaNova) {
              setComandaAtualizada(comandaNova);
            }
          } catch {
            window.location.reload();
          }
        }}
      />
    </div>
  );
}