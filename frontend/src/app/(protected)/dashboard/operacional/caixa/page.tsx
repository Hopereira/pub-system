// Caminho: frontend/src/app/(protected)/dashboard/caixa/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Comanda } from '@/types/comanda';
import { searchComandas } from '@/services/comandaService';
import { useDebounce } from 'use-debounce'; // Precisaremos de instalar esta biblioteca
import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const CaixaPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Comanda[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // O "debounced" searchTerm espera 500ms antes de atualizar.
  // Isso evita fazer uma chamada à API a cada tecla digitada.
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);

  useEffect(() => {
    const buscar = async () => {
      if (debouncedSearchTerm) {
        setIsLoading(true);
        try {
          const data = await searchComandas(debouncedSearchTerm);
          setResults(data);
        } catch (error) {
          console.error("Erro na busca:", error);
          setResults([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults([]);
      }
    };
    buscar();
  }, [debouncedSearchTerm]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Terminal de Caixa</h1>
        <p className="text-muted-foreground">
          Busque por número da mesa ou nome/CPF do cliente para encontrar uma comanda.
        </p>
      </div>

      <Input
        type="search"
        placeholder="Digite o número da mesa ou nome do cliente..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="text-lg p-6"
      />

      <div className="mt-6">
        {isLoading && <p>Buscando...</p>}
        {!isLoading && results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((comanda) => (
              <Link href={`/dashboard/comandas/${comanda.id}`} key={comanda.id}>
                <Card className="hover:bg-muted/50 transition-colors">
                  <CardHeader>
                    <CardTitle>
                      {comanda.mesa ? `Mesa ${comanda.mesa.numero}` : comanda.cliente?.nome}
                    </CardTitle>
                    <CardDescription>
                      Status: {comanda.status}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
        {!isLoading && debouncedSearchTerm && results.length === 0 && (
          <p>Nenhuma comanda encontrada para "{debouncedSearchTerm}".</p>
        )}
      </div>
    </div>
  );
};

export default CaixaPage;