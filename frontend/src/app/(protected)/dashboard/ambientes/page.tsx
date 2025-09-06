// Caminho: frontend/src/app/(protected)/dashboard/ambientes/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { createAmbiente, deleteAmbiente, getAmbientes, updateAmbiente } from '@/services/ambienteService';
// ... (outros imports)
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea'; // Importamos o Textarea

// ATUALIZAMOS A DEFINIÇÃO DE TIPO
export interface AmbienteData {
  id: string;
  nome: string;
  descricao?: string | null; // Adicionamos a descrição
  productCount: number; 
  tableCount: number;
}

const AmbientesPage = () => {
  const [ambientes, setAmbientes] = useState<AmbienteData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  
  // ATUALIZAMOS O ESTADO DO FORMULÁRIO
  const [ambienteFormData, setAmbienteFormData] = useState({ 
    id: null as string | null, 
    nome: '', 
    descricao: '' 
  });

  // ... (carregarAmbientes continua igual)
  const carregarAmbientes = async () => {
    try {
      setIsLoading(true);
      const data = await getAmbientes();
      setAmbientes(data || []);
    } catch (err) {
      setError('Falha ao carregar os ambientes.');
      setAmbientes([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarAmbientes();
  }, []);


  const handleOpenNewDialog = () => {
    // Limpa o formulário para um novo ambiente
    setAmbienteFormData({ id: null, nome: '', descricao: '' });
    setIsFormDialogOpen(true);
  };
  
  const handleOpenEditDialog = (ambiente: AmbienteData) => {
    // Preenche o formulário com os dados do ambiente a ser editado
    setAmbienteFormData({ 
      id: ambiente.id, 
      nome: ambiente.nome,
      descricao: ambiente.descricao || '' // Garante que não seja null
    });
    setIsFormDialogOpen(true);
  };

  const handleFormSubmit = async () => {
    if (!ambienteFormData.nome) {
      toast.error('O nome do ambiente não pode ser vazio.');
      return;
    }
    try {
      // Prepara os dados a serem enviados, incluindo a descrição
      const payload = {
        nome: ambienteFormData.nome,
        descricao: ambienteFormData.descricao,
      };

      if (ambienteFormData.id) {
        await updateAmbiente(ambienteFormData.id, payload);
        toast.success('Ambiente atualizado com sucesso!');
      } else {
        await createAmbiente(payload);
        toast.success('Ambiente criado com sucesso!');
      }
      setIsFormDialogOpen(false);
      await carregarAmbientes();
    } catch (err) {
      toast.error(ambienteFormData.id ? 'Falha ao atualizar o ambiente.' : 'Falha ao criar o ambiente.');
    }
  };
  
  // ... (handleDelete e a lógica de renderização inicial continuam iguais)
  const handleDelete = async (id: string) => {
    try {
      await deleteAmbiente(id);
      toast.success("Ambiente apagado com sucesso!");
      await carregarAmbientes();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Falha ao apagar o ambiente. Ele pode estar em uso.";
      toast.error(errorMessage);
    }
  };

  if (isLoading && ambientes.length === 0) return <p>A carregar ambientes...</p>;
  if (error) return <p className="text-red-500">{error}</p>;


  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Gestão de Ambientes</h1>
        <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
          <DialogTrigger asChild><Button onClick={handleOpenNewDialog}>Adicionar Novo Ambiente</Button></DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{ambienteFormData.id ? 'Editar Ambiente' : 'Adicionar Novo Ambiente'}</DialogTitle>
              <DialogDescription>{ambienteFormData.id ? 'Altere os detalhes do ambiente.' : 'Preencha os detalhes do novo ambiente.'}</DialogDescription>
            </DialogHeader>
            {/* ATUALIZAMOS O FORMULÁRIO NO DIALOG */}
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Nome</Label>
                <Input id="name" value={ambienteFormData.nome} onChange={(e) => setAmbienteFormData({ ...ambienteFormData, nome: e.target.value })} className="col-span-3"/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="descricao" className="text-right">Descrição</Label>
                <Textarea id="descricao" value={ambienteFormData.descricao} onChange={(e) => setAmbienteFormData({ ...ambienteFormData, descricao: e.target.value })} className="col-span-3" placeholder="Opcional: Descreva a finalidade deste ambiente."/>
              </div>
            </div>
            <DialogFooter><Button type="submit" onClick={handleFormSubmit}>Salvar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="border rounded-md">
        <Table>
          <TableCaption>Uma lista dos seus ambientes cadastrados.</TableCaption>
          <TableHeader>
            <TableRow>
              {/* AJUSTAMOS A LARGURA DAS COLUNAS */}
              <TableHead className="w-[30%]">Nome</TableHead>
              <TableHead className="w-[40%]">Descrição</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ambientes.map((ambiente) => {
              const emUso = ambiente.productCount > 0 || ambiente.tableCount > 0;
              const usoDetalhes = [
                ambiente.productCount > 0 ? `${ambiente.productCount} produto(s)` : '',
                ambiente.tableCount > 0 ? `${ambiente.tableCount} mesa(s)` : ''
              ].filter(Boolean).join(', ');

              return (
                <TableRow key={ambiente.id}>
                  <TableCell className="font-medium">{ambiente.nome}</TableCell>
                  {/* ADICIONAMOS A CÉLULA DA DESCRIÇÃO */}
                  <TableCell className="text-sm text-muted-foreground">{ambiente.descricao || '-'}</TableCell>
                  <TableCell>
                    {emUso ? (
                      <Badge variant="destructive" title={usoDetalhes}>Em Uso</Badge>
                    ) : (
                      <Badge className="bg-green-600 hover:bg-green-700">Livre</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="mr-2" onClick={() => handleOpenEditDialog(ambiente)}>Editar</Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={emUso}>Apagar</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Tem a certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isto irá apagar permanentemente o ambiente "{ambiente.nome}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(ambiente.id)}>Continuar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AmbientesPage;