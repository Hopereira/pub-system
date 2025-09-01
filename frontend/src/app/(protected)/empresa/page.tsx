// Caminho: frontend/src/app/(protected)/empresa/page.tsx
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createOrUpdateEmpresa, getEmpresa } from "@/services/empresaService";
import React, { useEffect, useState } from "react";

const EmpresaPage = () => {
  const [id, setId] = useState<string | undefined>(undefined);
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [endereco, setEndereco] = useState('');
  const [telefone, setTelefone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const carregarDados = async () => {
      const data = await getEmpresa();
      if (data) {
        setId(data.id);
        setNomeFantasia(data.nomeFantasia);
        setRazaoSocial(data.razaoSocial);
        setCnpj(data.cnpj);
        setEndereco(data.endereco);
        setTelefone(data.telefone);
      }
    };
    carregarDados();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    const dadosDoFormulario = { id, nomeFantasia, razaoSocial, cnpj, endereco, telefone };

    try {
      const empresaSalva = await createOrUpdateEmpresa(dadosDoFormulario);
      setId(empresaSalva.id);
      toast.success("Sucesso!", {
        description: "Os dados da empresa foram salvos com sucesso.",
      });
    } catch (error: any) {
      console.error("Erro ao salvar empresa:", error);
      // Extrai a mensagem de erro específica do backend, se existir
      const errorMessage = error.response?.data?.message || "Não foi possível salvar os dados da empresa.";
      toast.error("Erro", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações da Empresa</CardTitle>
        <CardDescription>
          Atualize as informações principais do seu estabelecimento. Estes dados serão utilizados em relatórios e notas.
        </CardDescription>
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
              {/* MUDANÇA 1: O campo CNPJ agora é desabilitado se já houver um 'id' */}
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
          <Button type="submit" disabled={isLoading}>
            {/* MUDANÇA 2: O texto do botão agora muda com base na existência do 'id' */}
            {isLoading ? 'Salvando...' : (id ? 'Salvar Alterações' : 'Cadastrar Empresa')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default EmpresaPage;