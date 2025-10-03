'use client';

import { useState } from 'react';
import { Comanda } from '@/types/comanda';
import { PaginaEvento } from '@/types/pagina-evento';
import { Evento } from '@/types/evento';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BookOpen, Calendar, UtensilsCrossed } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getPublicEventos } from '@/services/eventoService';
import { toast } from 'sonner';

interface PortalClienteClientPageProps {
  comanda: Comanda;
  paginaAtiva: PaginaEvento | null;
}

export default function PortalClienteClientPage({ comanda, paginaAtiva }: PortalClienteClientPageProps) {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [isLoadingEventos, setIsLoadingEventos] = useState(false);

  // Verifica se a comanda já tem algum pedido feito.
  const temPedidos = comanda.pedidos && comanda.pedidos.length > 0;

  // Função para buscar os eventos da semana quando o modal for aberto.
  const handleOpenEventosModal = async () => {
    setIsLoadingEventos(true);
    try {
      const data = await getPublicEventos(); 
      setEventos(data);
    } catch (error) {
      toast.error('Não foi possível carregar os eventos.');
    } finally {
      setIsLoadingEventos(false);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen w-full bg-slate-900 text-white p-4">
      {/* Imagem de fundo do evento */}
      {paginaAtiva?.urlImagem && (
        <Image
          src={paginaAtiva.urlImagem}
          alt={paginaAtiva.titulo}
          fill
          className="object-cover z-0 opacity-20"
          priority
        />
      )}
      <div className="absolute inset-0 bg-black/50 z-10"></div>

      <div className="relative z-20 flex flex-col items-center text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          {paginaAtiva?.titulo || 'Bem-vindo(a)!'}
        </h1>
        <p className="mt-4 text-lg text-slate-300">
          O que você gostaria de fazer?
        </p>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
          {/* Botão Cardápio */}
          <Link href={`/cardapio/${comanda.id}`} passHref>
            <Card className="bg-slate-800/50 hover:bg-slate-700/70 transition-colors text-center p-6 flex flex-col items-center justify-center cursor-pointer">
              <UtensilsCrossed className="h-10 w-10 text-amber-400" />
              <p className="mt-4 font-semibold text-lg">Ver Cardápio</p>
            </Card>
          </Link>

          {/* Botão Meus Pedidos (com lógica condicional) */}
          <Link href={temPedidos ? `/acesso-cliente/${comanda.id}` : '#'} passHref
            onClick={(e) => {
              if (!temPedidos) {
                e.preventDefault();
                toast.info('Você ainda não fez nenhum pedido.');
              }
            }}
          >
            <Card className={`bg-slate-800/50 transition-colors text-center p-6 flex flex-col items-center justify-center ${temPedidos ? 'hover:bg-slate-700/70 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}>
              <BookOpen className="h-10 w-10 text-amber-400" />
              <p className="mt-4 font-semibold text-lg">Meus Pedidos</p>
            </Card>
          </Link>

          {/* Botão Eventos (com modal) */}
          <Dialog onOpenChange={(open) => open && handleOpenEventosModal()}>
            <DialogTrigger asChild>
              <Card className="bg-slate-800/50 hover:bg-slate-700/70 transition-colors text-center p-6 flex flex-col items-center justify-center cursor-pointer">
                <Calendar className="h-10 w-10 text-amber-400" />
                <p className="mt-4 font-semibold text-lg">Eventos do Pub</p>
              </Card>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-slate-900 text-white border-slate-700">
              <DialogHeader>
                <DialogTitle>Eventos da Semana</DialogTitle>
              </DialogHeader>
              <div className="max-h-[60vh] overflow-y-auto p-1">
                {isLoadingEventos ? <p>Carregando eventos...</p> : 
                  eventos.length > 0 ? (
                    eventos.map(evento => (
                      <div key={evento.id} className="mb-4 border-b border-slate-800 pb-4 last:border-b-0">
                        <h3 className="font-bold">{evento.titulo}</h3>
                        <p className="text-sm text-slate-400">{new Date(evento.dataEvento).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</p>
                        <p className="text-sm mt-2">{evento.descricao}</p>
                      </div>
                    ))
                  ) : <p>Nenhum evento programado para esta semana.</p>
                }
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}