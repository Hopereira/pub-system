// Caminho: frontend/src/app/(protected)/ambientes/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { AmbienteData, createAmbiente, getAmbientes, updateAmbiente } from '@/services/ambienteService'; // 1. Importa updateAmbiente
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const AmbientesPage = () => {
  const [ambientes, setAmbientes] = useState<AmbienteData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para o diálogo (agora para criar e editar)
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [ambienteFormData, setAmbienteFormData] = useState<{ id: string | null; nome: string }>({ id: null, nome: '' });

  const carregarAmbientes = async () => {
    try {
      setIsLoading(true);
      const data = await getAmbientes();
      setAmbientes(data);
    } catch (err) {
      setError('Falha ao carregar os ambientes.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarAmbientes();
  }, []);

  // Abre o diálogo para criar um novo ambiente
  const handleOpenNewDialog = () => {
    setAmbienteFormData({ id: null, nome: '' });
    setIsDialogOpen(true);
  };
  
  // Abre o diálogo para editar um ambiente existente
  const handleOpenEditDialog = (ambiente: AmbienteData) => {
    setAmbienteFormData({ id: ambiente.id, nome: ambiente.nome });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!ambienteFormData.nome) {
      toast.error('O nome do ambiente não pode ser vazio.');
      return;
    }

    try {
      // Se tiver um ID, estamos a editar
      if (ambienteFormData.id) {
        await updateAmbiente(ambienteFormData.id, { nome: ambienteFormData.nome });
        toast.success('Ambiente atualizado com sucesso!');
      } 
      // Se não, estamos a criar
      else {
        await createAmbiente({ nome: ambienteFormData.nome });
        toast.success('Ambiente criado com sucesso!');
      }
      setIsDialogOpen(false);
      await carregarAmbientes();
    } catch (err) {
      toast.error(ambienteFormData.id ? 'Falha ao atualizar o ambiente.' : 'Falha ao criar o ambiente.');
    }
  };


  if (isLoading && ambientes.length === 0) return <p>A carregar ambientes...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Gestão de Ambientes</h1>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenNewDialog}>Adicionar Novo Ambiente</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              {/* O título do diálogo agora é dinâmico */}
              <DialogTitle>{ambienteFormData.id ? 'Editar Ambiente' : 'Adicionar Novo Ambiente'}</DialogTitle>
              <DialogDescription>
                {ambienteFormData.id ? 'Altere o nome do ambiente.' : 'Digite o nome do novo ambiente. Ex: Cozinha.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Nome</Label>
                <Input
                  id="name"
                  value={ambienteFormData.nome}
                  onChange={(e) => setAmbienteFormData({ ...ambienteFormData, nome: e.target.value })}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleSubmit}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
      
      <div className="border rounded-md">
        <Table>
          <TableCaption>Uma lista dos seus ambientes cadastrados.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80%]">Nome</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ambientes.map((ambiente) => (
              <TableRow key={ambiente.id}>
                <TableCell className="font-medium">{ambiente.nome}</TableCell>
                <TableCell className="text-right">
                  {/* O botão de editar agora chama a função para abrir o diálogo em modo de edição */}
                  <Button variant="outline" size="sm" className="mr-2" onClick={() => handleOpenEditDialog(ambiente)}>Editar</Button>
                  <Button variant="destructive" size="sm">Apagar</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AmbientesPage;