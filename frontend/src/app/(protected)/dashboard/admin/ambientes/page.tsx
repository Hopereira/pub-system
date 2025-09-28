// Caminho: frontend/src/app/(protected)/dashboard/ambientes/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

import { createAmbiente, deleteAmbiente, getAmbientes, updateAmbiente } from '@/services/ambienteService';
import { AmbienteData } from '@/services/ambienteService';

import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

// Enum para o Tipo de Ambiente, para garantir consistência
const TipoAmbienteEnum = z.enum(['PREPARO', 'ATENDIMENTO']);

// Schema de validação com os novos campos
const formSchema = z.object({
  nome: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
  descricao: z.string().optional(),
  tipo: TipoAmbienteEnum,
  isPontoDeRetirada: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

const AmbientesPage = () => {
  const [ambientes, setAmbientes] = useState<AmbienteData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingAmbiente, setEditingAmbiente] = useState<AmbienteData | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      tipo: 'ATENDIMENTO',
      isPontoDeRetirada: false,
    },
  });

  // Observa o campo 'tipo' para a lógica condicional
  const tipoValue = form.watch('tipo');

  const carregarAmbientes = async () => {
    try {
      setIsLoading(true);
      const data = await getAmbientes();
      setAmbientes(data || []);
    } catch (err) {
      toast.error('Falha ao carregar os ambientes.');
      setAmbientes([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarAmbientes();
  }, []);

  const handleOpenNewDialog = () => {
    setEditingAmbiente(null);
    form.reset({ nome: '', descricao: '', tipo: 'ATENDIMENTO', isPontoDeRetirada: false });
    setIsFormDialogOpen(true);
  };
  
  const handleOpenEditDialog = (ambiente: AmbienteData) => {
    setEditingAmbiente(ambiente);
    form.reset({
      nome: ambiente.nome,
      descricao: ambiente.descricao || '',
      tipo: ambiente.tipo,
      isPontoDeRetirada: ambiente.isPontoDeRetirada,
    });
    setIsFormDialogOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const dataToSend = {
        ...values,
        isPontoDeRetirada: values.tipo === 'ATENDIMENTO' ? values.isPontoDeRetirada : false,
      };

      if (editingAmbiente) {
        await updateAmbiente(editingAmbiente.id, dataToSend);
        toast.success('Ambiente atualizado com sucesso!');
      } else {
        await createAmbiente(dataToSend);
        toast.success('Ambiente criado com sucesso!');
      }
      setIsFormDialogOpen(false);
      await carregarAmbientes();
    } catch (err) {
      toast.error(editingAmbiente ? 'Falha ao atualizar o ambiente.' : 'Falha ao criar o ambiente.');
    }
  };
  
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

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Gestão de Ambientes</h1>
        <Button onClick={handleOpenNewDialog}>Adicionar Novo Ambiente</Button>
      </div>
      
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingAmbiente ? 'Editar Ambiente' : 'Adicionar Novo Ambiente'}</DialogTitle>
            <DialogDescription>{editingAmbiente ? 'Altere os detalhes do ambiente.' : 'Preencha os detalhes do novo ambiente.'}</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Cozinha, Bar da Piscina" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Descreva a finalidade deste ambiente." className="resize-none" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Ambiente</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ATENDIMENTO">Atendimento (Salão, Varanda)</SelectItem>
                        <SelectItem value="PREPARO">Preparo (Cozinha, Bar)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {tipoValue === 'ATENDIMENTO' && (
                <FormField
                  control={form.control}
                  name="isPontoDeRetirada"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Ponto de Retirada</FormLabel>
                        <DialogDescription className="text-xs">
                          Marque se os clientes podem retirar pedidos neste ambiente.
                        </DialogDescription>
                      </div>
                      <FormControl>
                        {/* CORREÇÃO para o aviso do console */}
                        <Switch
                          checked={!!field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}

              <DialogFooter>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </Form>

        </DialogContent>
      </Dialog>
      
      <div className="border rounded-md">
        <Table>
          <TableCaption>Uma lista dos seus ambientes cadastrados.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Ponto de Retirada</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ambientes.map((ambiente) => {
              const emUso = (ambiente.productCount ?? 0) > 0 || (ambiente.tableCount ?? 0) > 0;
              const usoDetalhes = [
                (ambiente.productCount ?? 0) > 0 ? `${ambiente.productCount} produto(s)` : '',
                (ambiente.tableCount ?? 0) > 0 ? `${ambiente.tableCount} mesa(s)` : ''
              ].filter(Boolean).join(', ');

              return (
                <TableRow key={ambiente.id}>
                  <TableCell className="font-medium">{ambiente.nome}</TableCell>
                  <TableCell>
                    <Badge variant={ambiente.tipo === 'PREPARO' ? 'secondary' : 'default'}>
                      {ambiente.tipo === 'PREPARO' ? 'Preparo' : 'Atendimento'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {ambiente.isPontoDeRetirada ? (
                      <Badge className="bg-blue-600 hover:bg-blue-700">Sim</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
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