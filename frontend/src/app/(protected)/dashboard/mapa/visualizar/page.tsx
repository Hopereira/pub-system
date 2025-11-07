'use client';

import { VisualizadorMapa } from '@/components/mapa/VisualizadorMapa';
import { RoleGuard } from '@/components/guards/RoleGuard';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getAmbientes, AmbienteData } from '@/services/ambienteService';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function VisualizarMapaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ambienteIdParam = searchParams.get('ambienteId');
  
  const [ambientes, setAmbientes] = useState<AmbienteData[]>([]);
  const [ambienteId, setAmbienteId] = useState<string>(ambienteIdParam || '');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const carregarAmbientes = async () => {
      try {
        const data = await getAmbientes();
        // Filtrar apenas ambientes de ATENDIMENTO (onde ficam as mesas)
        const ambientesAtendimento = data.filter(a => a.tipo === 'ATENDIMENTO');
        setAmbientes(ambientesAtendimento);
        
        // Se não tem ambiente selecionado, seleciona o primeiro
        if (!ambienteId && ambientesAtendimento.length > 0) {
          setAmbienteId(ambientesAtendimento[0].id);
        }
      } catch (error) {
        console.error('Erro ao carregar ambientes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    carregarAmbientes();
  }, []);

  // Atualizar URL quando mudar ambiente
  const handleAmbienteChange = (novoAmbienteId: string) => {
    setAmbienteId(novoAmbienteId);
    router.push(`/dashboard/mapa/visualizar?ambienteId=${novoAmbienteId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Carregando...</p>
      </div>
    );
  }

  if (ambientes.length === 0) {
    return (
      <RoleGuard allowedRoles={['ADMIN', 'GERENTE', 'GARCOM', 'CAIXA']}>
        <div className="container mx-auto p-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold">Mapa de Mesas</h1>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <p className="text-yellow-800 font-medium">
              Nenhum ambiente de atendimento encontrado.
            </p>
            <p className="text-yellow-600 text-sm mt-2">
              Peça ao administrador para criar ambientes de atendimento (Salão, Varanda, etc.)
            </p>
          </div>
        </div>
      </RoleGuard>
    );
  }

  const ambienteSelecionado = ambientes.find(a => a.id === ambienteId);

  return (
    <RoleGuard allowedRoles={['ADMIN', 'GERENTE', 'GARCOM', 'CAIXA']}>
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Mapa de Mesas</h1>
              <p className="text-muted-foreground">
                Visualize o layout das mesas do ambiente
              </p>
            </div>
          </div>

          {/* Seletor de Ambiente */}
          <Select value={ambienteId} onValueChange={handleAmbienteChange}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Selecione um ambiente" />
            </SelectTrigger>
            <SelectContent>
              {ambientes.map((ambiente) => (
                <SelectItem key={ambiente.id} value={ambiente.id}>
                  {ambiente.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Mapa Visual */}
        {ambienteId && ambienteSelecionado && (
          <VisualizadorMapa 
            ambienteId={ambienteId}
            ambienteNome={ambienteSelecionado.nome}
          />
        )}
      </div>
    </RoleGuard>
  );
}
