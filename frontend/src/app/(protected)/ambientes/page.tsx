// Caminho: frontend/src/app/(protected)/ambientes/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { AmbienteData, createAmbiente, deleteAmbiente, getAmbientes, updateAmbiente } from '@/services/ambienteService';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const AmbientesPage = () => {
  const [ambientes, setAmbientes] = useState<AmbienteData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [ambienteFormData, setAmbienteFormData] = useState<{ id: string | null; nome: string }>({ id: null, nome: '' });

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
    setAmbienteFormData({ id: null, nome: '' });
    setIsFormDialogOpen(true);
  };
  
  const handleOpenEditDialog = (ambiente: AmbienteData) => {
    setAmbienteFormData({ id: ambiente.id, nome: ambiente.nome });
    setIsFormDialogOpen(true);
  };

  const handleFormSubmit = async () => {
    if (!ambienteFormData.nome) {
      toast.error('O nome do ambiente não pode ser vazio.');
      return;
    }
    try {
      if (ambienteFormData.id) {
        await updateAmbiente(ambienteFormData.id, { nome: ambienteFormData.nome });
        toast.success('Ambiente atualizado com sucesso!');
      } else {
        await createAmbiente({ nome: ambienteFormData.nome });
        toast.success('Ambiente criado com sucesso!');
      }
      setIsFormDialogOpen(false);
      await carregarAmbientes();
    } catch (err) {
      toast.error(ambienteFormData.id ? 'Falha ao atualizar o ambiente.' : 'Falha ao criar o ambiente.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAmbiente(id);
      toast.success("Ambiente apagado com sucesso!");
      await carregarAmbientes();
    } catch (err) {
      toast.error("Falha ao apagar o ambiente. Ele pode estar em uso.");
    }
  };

  if (isLoading && ambientes.length === 0) return <p>A carregar ambientes...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Gestão de Ambientes</h1>
        <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
          <DialogTrigger asChild><Button onClick={handleOpenNewDialog}>Adicionar Novo Ambiente</Button></DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{ambienteFormData.id ? 'Editar Ambiente' : 'Adicionar Novo Ambiente'}</DialogTitle>
              <DialogDescription>{ambienteFormData.id ? 'Altere o nome do ambiente.' : 'Digite o nome do novo ambiente. Ex: Cozinha.'}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="name" className="text-right">Nome</Label><Input id="name" value={ambienteFormData.nome} onChange={(e) => setAmbienteFormData({ ...ambienteFormData, nome: e.target.value })} className="col-span-3"/></div>
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
              <TableHead className="w-[80%]">Nome</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ambientes.map((ambiente) => (
              <TableRow key={ambiente.id}>
                <TableCell className="font-medium">{ambiente.nome}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" className="mr-2" onClick={() => handleOpenEditDialog(ambiente)}>Editar</Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">Apagar</Button>
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
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AmbientesPage;