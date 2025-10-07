'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import EventosPubModal from '@/components/cliente/EventosPubModal'; 
import { getPublicPaginaEventoAtiva } from '@/services/paginaEventoService'; 
import { PaginaEvento } from '@/types/pagina-evento'; 
// Supondo a existência de um serviço para buscar detalhes da comanda:
import { getComandaDetails } from '@/services/comandaService'; 
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils'; 

// Tipagem simulada para os detalhes da comanda (deve ser definido em '@/types/comanda')
interface ComandaDetails {
    nomeCliente: string | null;
    numeroMesa: number | null;
    // ... outros detalhes
}

export default function ClienteHubPage({ params }: { params: { comandaId: string } }) {
  const { comandaId } = params;
  
  const [isEventosModalOpen, setIsEventosModalOpen] = useState(false); 
  const [paginaData, setPaginaData] = useState<PaginaEvento | null>(null);
  const [nomeAmigavel, setNomeAmigavel] = useState<string>(comandaId); // Estado para o nome/mesa
  const [isLoading, setIsLoading] = useState(true);

  // Efeito para carregar os dados da página de eventos (fundo) e os detalhes da comanda
  useEffect(() => {
    const fetchDadosIniciais = async () => {
      setIsLoading(true);
      
      // A. Busca a imagem de fundo e título da página ativa
      const pagina = await getPublicPaginaEventoAtiva();
      setPaginaData(pagina);

      // B. Busca a informação amigável da comanda
      try {
        // Presume que getComandaDetails(comandaId) retorna { nomeCliente, numeroMesa }
        const detalhes: ComandaDetails = await getComandaDetails(comandaId); 
        
        // Prioriza Nome do Cliente ou Número da Mesa
        const apelido = detalhes.nomeCliente 
            ? detalhes.nomeCliente 
            : detalhes.numeroMesa 
                ? `Mesa ${detalhes.numeroMesa}`
                : `Comanda ${comandaId.substring(0, 4)}`; // Fallback para ID truncado
        
        setNomeAmigavel(apelido);
      } catch (e) {
        // Em caso de erro na busca, mantém o ID da comanda
        setNomeAmigavel(`Comanda ${comandaId.substring(0, 4)}`); 
      }

      setIsLoading(false);
    };

    fetchDadosIniciais();
  }, [comandaId]); 

  const cardapioUrl = `/cardapio/${comandaId}`;
  const pedidosUrl = `/acesso-cliente/${comandaId}`; 

  // Lógica para aplicar a imagem de fundo
  const backgroundStyle = paginaData?.urlImagem 
    ? { backgroundImage: `url('${paginaData.urlImagem}')` }
    : {};

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3">Preparando o seu acesso...</p>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "relative min-h-screen bg-gray-100 dark:bg-gray-900",
        // CORREÇÃO IMAGEM: Garante que a imagem cobre a área, não se repete e é centralizada
        { 
          "bg-cover bg-no-repeat bg-fixed bg-center": paginaData?.urlImagem 
        } 
      )}
      style={backgroundStyle} 
    >
      {/* Overlay para melhorar a legibilidade do texto */}
      {paginaData?.urlImagem && (
        <div className="absolute inset-0 bg-black opacity-40"></div>
      )}

      <div className="relative z-10 p-4 sm:p-6 space-y-8 text-white min-h-screen flex flex-col justify-center">
        <header className="text-center pt-8">
          <h1 className="text-5xl font-extrabold text-white drop-shadow-lg">
            {paginaData?.titulo || "Bem-vindo ao Pub System"}
          </h1>
          {/* EXIBIÇÃO AMIGÁVEL: Usa o nome/mesa buscado */}
          <p className="text-xl font-medium text-gray-200 mt-2">
            Acedendo como: **{nomeAmigavel}**
          </p>
        </header>

        {/* Layout de Navegação com 3 Botões */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full mt-12">
          
          {/* Botão Cardápio */}
          <Button asChild className="h-20 text-xl shadow-xl bg-primary hover:bg-primary/90">
              <Link href={cardapioUrl}>Cardápio</Link>
          </Button>

          {/* Botão Meus Pedidos */}
          <Button asChild variant="outline" className="h-20 text-xl shadow-xl bg-white text-gray-900 hover:bg-gray-100">
              <Link href={pedidosUrl}>Meus Pedidos</Link>
          </Button>

          {/* Botão Eventos do Pub */}
          <Button 
              variant="secondary" 
              className="h-20 text-xl shadow-xl bg-secondary hover:bg-secondary/90"
              onClick={() => setIsEventosModalOpen(true)}
          >
              Eventos do Pub
          </Button>
        </div>
      </div>

      {/* Componente Modal de Eventos */}
      <EventosPubModal
          open={isEventosModalOpen}
          onOpenChange={setIsEventosModalOpen}
      />
    </div>
  );
}