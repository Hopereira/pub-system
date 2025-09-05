// Caminho: frontend/src/components/mesas/MapaMesasClient.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // NOVO: para redirecionamento
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'; // NOVO: para confirmação

import { Mesa } from '@/types/mesa';
import { getMesas } from '@/services/mesaService';
import { abrirComanda, getComandaAbertaPorMesa } from '@/services/comandaService'; // NOVO: serviço de comanda
import MesaCard from './MesaCard';

export default function MapaMesasClient() {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter(); // NOVO: hook de roteamento

  // --- NOVO: Estados para o diálogo de confirmação ---
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [mesaParaAbrir, setMesaParaAbrir] = useState<Mesa | null>(null);

  useEffect(() => {
    const fetchMesas = async () => {
      try {
        setIsLoading(true);
        const data = await getMesas();
        setMesas(data);
      } catch (err) {
        setError('Não foi possível carregar o mapa de mesas.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMesas();
  }, []);

  // --- ATUALIZADO: Lógica de clique na mesa ---
  const handleMesaClick = async (mesa: Mesa) => {
    if (mesa.status === 'LIVRE') {
      // Se a mesa está livre, preparamos para abrir
      setMesaParaAbrir(mesa);
      setIsConfirmOpen(true);
    } else {
      // Se está ocupada, buscamos a comanda e redirecionamos
      try {
        const comanda = await getComandaAbertaPorMesa(mesa.id);
        router.push(`/dashboard/comandas/${comanda.id}`);
      } catch (err) {
        setError(`Não foi possível encontrar a comanda para a mesa ${mesa.numero}.`);
      }
    }
  };

  // --- NOVO: Handler para confirmar a abertura da mesa ---
  const handleConfirmarAbertura = async () => {
    if (!mesaParaAbrir) return;

    try {
      await abrirComanda({ mesaId: mesaParaAbrir.id });

      // Atualiza o estado da mesa na UI para 'OCUPADA' em tempo real
      setMesas(currentMesas =>
        currentMesas.map(m =>
          m.id === mesaParaAbrir.id ? { ...m, status: 'OCUPADA' } : m,
        ),
      );
    } catch (err) {
      setError(`Erro ao abrir a mesa ${mesaParaAbrir.numero}.`);
    } finally {
      setIsConfirmOpen(false);
      setMesaParaAbrir(null);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {Array.from({ length: 12 }).map((_, index) => (
                <Skeleton key={index} className="h-24 w-full" />
            ))}
        </div>
      );
    }
    if (error) {
      return (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Erro!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }
    
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {mesas.map((mesa) => (
                <MesaCard key={mesa.id} mesa={mesa} onClick={handleMesaClick} />
            ))}
        </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Mapa de Mesas</h1>
          <p className="text-muted-foreground">
            Selecione uma mesa para iniciar ou continuar um atendimento.
          </p>
      </div>
      {renderContent()}

      {/* --- NOVO: Diálogo de confirmação de abertura de mesa --- */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Abrir Atendimento</AlertDialogTitle>
            <AlertDialogDescription>
              Você confirma a abertura da 
              <span className="font-bold"> Mesa {mesaParaAbrir?.numero}</span> no ambiente 
              <span className="font-bold"> {mesaParaAbrir?.ambiente.nome}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMesaParaAbrir(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmarAbertura}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}