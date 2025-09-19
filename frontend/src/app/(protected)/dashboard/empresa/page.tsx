// Caminho: frontend/src/app/(protected)/dashboard/empresa/page.tsx
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createOrUpdateEmpresa, getEmpresa } from "@/services/empresaService";
import React, { useEffect, useState } from "react";

// NOVO: Componente para o estado de carregamento, para uma melhor UX.
const LoadingState = () => (
  <Card>
    <CardHeader>
      <CardTitle>Configurações da Empresa</CardTitle>
      <CardDescription>
        Carregando informações do seu estabelecimento...
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="grid gap-6">
        <div className="h-10 w-full bg-slate-200 animate-pulse rounded-md" />
        <div className="h-10 w-full bg-slate-200 animate-pulse rounded-md" />
        <div className="h-10 w-full bg-slate-200 animate-pulse rounded-md" />
        <div className="h-10 w-full bg-slate-200 animate-pulse rounded-md" />
        <div className="h-10 w-full bg-slate-200 animate-pulse rounded-md" />
      </div>
    </CardContent>
    <CardFooter className="border-t px-6 py-4">
      <Button disabled>Carregando...</Button>
    </CardFooter>
  </Card>
);


const EmpresaPage = () => {
  const [id, setId] = useState<string | undefined>(undefined);
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [endereco, setEndereco] = useState('');
  const [telefone, setTelefone] = useState('');

  // NOVO: Estado para controlar o carregamento inicial da página.
  const [isPageLoading, setIsPageLoading] = useState(true);
  // NOVO: Estado para controlar o loading do botão de submit.
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const data = await getEmpresa();
        if (data) {
          setId(data.id);
          setNomeFantasia(data.nomeFantasia);
          setRazaoSocial(data.razaoSocial);
          setCnpj(data.cnpj);
          setEndereco(data.endereco);
          setTelefone(data.telefone);
        }
      } catch (error) {
        // Se der 404 (empresa não existe), o catch já trata o caso e os campos ficam vazios.
        console.error("Nenhuma empresa encontrada ou erro ao buscar dados.", error);
      } finally {
        // NOVO: Finaliza o estado de carregamento da página.
        setIsPageLoading(false);
      }
    };
    carregarDados();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    const dadosDoFormulario = { id, nomeFantasia, razaoSocial, cnpj, endereco, telefone };

    try {
      const empresaSalva = await createOrUpdateEmpresa(dadosDoFormulario);
      setId(empresaSalva.id);
      toast.success("Sucesso!", {
        description: "Os dados da empresa foram salvos com sucesso.",
      });
    } catch (error: any) {
      console.error("Erro ao salvar empresa:", error);
      const errorMessage = error.response?.data?.message || "Não foi possível salvar os dados da empresa.";
      toast.error("Erro", {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // NOVO: Lógica de renderização condicional para o estado de carregamento.
  if (isPageLoading) {
    return <LoadingState />;
  }

  return (
    <Card>
      <CardHeader>
        {/* NOVO: O título e a descrição agora mudam com base na existência de um 'id' */}
        {id ? (
          <>
            <CardTitle>Configurações da Empresa</CardTitle>
            <CardDescription>
              Atualize as informações principais do seu estabelecimento. Estes dados serão utilizados em relatórios e notas.
            </CardDescription>
          </>
        ) : (
          <>
            <CardTitle>Bem-vindo ao Pub System!</CardTitle>
            <CardDescription>
              Este é o primeiro passo. Por favor, cadastre as informações do seu estabelecimento para começar a usar o sistema.
            </CardDescription>
          </>
        )}
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
              <Label htmlFor="nomeFantasia" className="md:text-right">Nome Fantasia</Label>
              <Input id="nomeFantasia" placeholder="Ex: Pub do Rock" className="md:col-span-3" value={nomeFantasia} onChange={(e) => setNomeFantasia(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
              <Label htmlFor="razaoSocial" className="md:text-right">Razão Social</Label>
              <Input id="razaoSocial" placeholder="Ex: Pereira & Cia Ltda" className="md:col-span-3" value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
              <Label htmlFor="cnpj" className="md:text-right">CNPJ</Label>
              <Input 
                id="cnpj" 
                placeholder="00.000.000/0001-00" 
                className="md:col-span-3" 
                value={cnpj} 
                onChange={(e) => setCnpj(e.target.value)}
                disabled={!!id} 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
              <Label htmlFor="endereco" className="md:text-right">Endereço</Label>
              <Input id="endereco" placeholder="Rua das Cervejas, 123" className="md:col-span-3" value={endereco} onChange={(e) => setEndereco(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
              <Label htmlFor="telefone" className="md:text-right">Telefone</Label>
              <Input id="telefone" type="tel" placeholder="(21) 98765-4321" className="md:col-span-3" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : (id ? 'Salvar Alterações' : 'Cadastrar Empresa')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default EmpresaPage;