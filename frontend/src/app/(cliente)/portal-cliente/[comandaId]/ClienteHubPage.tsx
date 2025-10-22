// Caminho: frontend/src/app/portal-cliente/[comandaId]/ClienteHubPage.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import EventosPubModal from '@/components/cliente/EventosPubModal'; 
import { Comanda } from '@/types/comanda';
import { cn } from '@/lib/utils'; 
import { Loader2, MapPin } from 'lucide-react';
import { MudarLocalModal } from '@/components/pontos-entrega/MudarLocalModal';

// ✅ MUDANÇA 1: O componente agora recebe a "comanda" como uma propriedade (prop).
interface ClienteHubPageProps {
  comanda: Comanda;
}

// O nome da função agora é ClienteHubPage
export default function ClienteHubPage({ comanda }: ClienteHubPageProps) {
   console.log('comanda.paginaEvento.urlImagem:', comanda.paginaEvento?.urlImagem);
  // ✅ MUDANÇA 2: REMOVEMOS a lógica 'useEffect', 'useState' de comanda e 'isLoading'.
  // A busca de dados já foi feita pelo "Gerente" (page.tsx).
  const [isEventosModalOpen, setIsEventosModalOpen] = useState(false);
  const [isLocalModalOpen, setIsLocalModalOpen] = useState(false);
  const [comandaAtualizada, setComandaAtualizada] = useState(comanda); 
  
  // O resto do seu código de lógica visual continua 100% igual e preservado.
  const comandaId = comanda.id;

  const nomeAmigavel = comanda.cliente?.nome 
    ? comanda.cliente.nome 
    : comanda.mesa?.numero 
        ? `Mesa ${comanda.mesa.numero}`
        : `Comanda ${comandaId.substring(0, 4)}`;

  const backgroundStyle = comanda.paginaEvento?.urlImagem 
    ? { backgroundImage: `url('${comanda.paginaEvento.urlImagem}')` }
    : {};

  const tituloPagina = comanda.paginaEvento?.titulo || "Bem-vindo ao Pub System";

  // O seu JSX original, 100% preservado.
  return (
    <div 
      className={cn(
        "relative min-h-screen bg-gray-100 dark:bg-gray-900 bg-cover bg-no-repeat bg-fixed bg-center",
        { "bg-cover bg-no-repeat bg-fixed bg-center": comanda.paginaEvento?.urlImagem } 
      )}
      style={backgroundStyle} 
    >
      {comanda.paginaEvento?.urlImagem && (
        <div className="absolute inset-0 bg-black opacity-40"></div>
      )}

      <div className="relative z-10 p-4 sm:p-6 space-y-8 text-white min-h-screen flex flex-col justify-center">
        <header className="text-center pt-8">
          <h1 className="text-5xl font-extrabold text-white drop-shadow-lg">
            {tituloPagina}
          </h1>
          <p className="text-xl font-medium text-gray-200 mt-2">
            Acedendo como: **{nomeAmigavel}**
          </p>
        </header>

        {/* Card de Localização */}
        <div className="max-w-2xl mx-auto w-full">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-2xl border-2 border-primary/20">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    Onde você está?
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {comandaAtualizada.pontoEntrega?.nome 
                      ? `📍 ${comandaAtualizada.pontoEntrega.nome}`
                      : 'Escolha onde você está para receber seus pedidos'}
                  </p>
                  {comandaAtualizada.pontoEntrega?.descricao && (
                    <p className="text-xs text-gray-500 italic">
                      {comandaAtualizada.pontoEntrega.descricao}
                    </p>
                  )}
                </div>
              </div>
              <Button
                onClick={() => setIsLocalModalOpen(true)}
                size="lg"
                className="whitespace-nowrap shadow-lg"
              >
                <MapPin className="w-4 h-4 mr-2" />
                {comandaAtualizada.pontoEntrega ? 'Mudar' : 'Escolher'}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full mt-8">
          <Button asChild className="h-20 text-xl shadow-xl bg-primary hover:bg-primary/90">
              <Link href={`/cardapio/${comandaId}`}>Cardápio</Link>
          </Button>
          <Button asChild variant="outline" className="h-20 text-xl shadow-xl bg-white text-gray-900 hover:bg-gray-100">
              <Link href={`/acesso-cliente/${comandaId}`}>Meus Pedidos</Link>
          </Button>
          <Button variant="secondary" className="h-20 text-xl shadow-xl bg-secondary hover:bg-secondary/90" onClick={() => setIsEventosModalOpen(true)}>
              Eventos do Pub
          </Button>
        </div>
      </div>

      <EventosPubModal
          open={isEventosModalOpen}
          onOpenChange={setIsEventosModalOpen}
      />

      <MudarLocalModal
        comandaId={comandaId}
        pontoAtualId={comandaAtualizada.pontoEntrega?.id}
        agregadosAtuais={comandaAtualizada.agregados}
        open={isLocalModalOpen}
        onOpenChange={setIsLocalModalOpen}
        onSuccess={() => {
          // Recarregar a página para pegar dados atualizados
          window.location.reload();
        }}
      />
    </div>
  );
}