'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Pencil, Trash2, MapPin, ToggleLeft, ToggleRight } from 'lucide-react';

import { PontoEntrega } from '@/types/ponto-entrega';
import { AmbienteData, getAmbientes } from '@/services/ambienteService';
import { Mesa } from '@/types/mesa';
import { getMesas } from '@/services/mesaService';
import {
  getPontosEntrega,
  createPontoEntrega,
  updatePontoEntrega,
  toggleAtivoPontoEntrega,
  deletePontoEntrega,
} from '@/services/pontoEntregaService';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

const formSchema = z.object({
  nome: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  descricao: z.string().optional(),
  mesaProximaId: z.string().optional(),
  ambientePreparoId: z.string().min(1, { message: 'Por favor, selecione um ambiente de preparo.' }),
});

type FormValues = z.infer<typeof formSchema>;

const GestaoPontosEntregaPage = () => {
  const [pontos, setPontos] = useState<PontoEntrega[]>([]);
  const [ambientes, setAmbientes] = useState<AmbienteData[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPonto, setEditingPonto] = useState<PontoEntrega | null>(null);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pontoToDelete, setPontoToDelete] = useState<PontoEntrega | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      mesaProximaId: undefined,
      ambientePreparoId: undefined,
    },
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [pontosData, ambientesData, mesasData] = await Promise.all([
        getPontosEntrega(),
        getAmbientes(),
        getMesas(),
      ]);
      setPontos(pontosData || []);
      // Filtrar apenas ambientes de preparo
      const ambientesPreparo = ambientesData?.filter((amb) => amb.tipo === 'PREPARO') || [];
      setAmbientes(ambientesPreparo);
      setMesas(mesasData || []);
    } catch (err) {
      toast.error('Falha ao carregar dados da página.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenNewDialog = () => {
    setEditingPonto(null);
    form.reset({
      nome: '',
      descricao: '',
      mesaProximaId: undefined,
      ambientePreparoId: undefined,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditDialog = (ponto: PontoEntrega) => {
    setEditingPonto(ponto);
    form.reset({
      nome: ponto.nome,
      descricao: ponto.descricao || '',
      mesaProximaId: ponto.mesaProximaId || undefined,
      ambientePreparoId: ponto.ambientePreparoId,
    });
    setIsModalOpen(true);
  };

  const handleOpenDeleteDialog = (ponto: PontoEntrega) => {
    setPontoToDelete(ponto);
    setIsConfirmOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const payload = {
        ...values,
        // Remove campos vazios
        mesaProximaId: values.mesaProximaId || undefined,
        descricao: values.descricao || undefined,
      };

      if (editingPonto) {
        await updatePontoEntrega(editingPonto.id, payload);
        toast.success('Ponto de entrega atualizado com sucesso!');
      } else {
        await createPontoEntrega(payload);
        toast.success('Ponto de entrega criado com sucesso!');
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      const errorMessage =
        err.message ||
        (editingPonto
          ? 'Falha ao atualizar o ponto de entrega.'
          : 'Falha ao criar o ponto de entrega.');
      toast.error(errorMessage);
    }
  };

  const handleToggleAtivo = async (ponto: PontoEntrega) => {
    try {
      await toggleAtivoPontoEntrega(ponto.id);
      toast.success(`Ponto ${ponto.ativo ? 'desativado' : 'ativado'} com sucesso!`);
      await loadData();
    } catch (err) {
      toast.error('Falha ao alterar status do ponto de entrega.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!pontoToDelete) return;
    try {
      await deletePontoEntrega(pontoToDelete.id);
      toast.success('Ponto de entrega deletado com sucesso!');
      setIsConfirmOpen(false);
      setPontoToDelete(null);
      await loadData();
    } catch (err) {
      toast.error('Falha ao deletar o ponto de entrega.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MapPin className="w-8 h-8" />
            Pontos de Entrega
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os pontos de retirada de pedidos
          </p>
        </div>
        <Button onClick={handleOpenNewDialog}>
          <MapPin className="w-4 h-4 mr-2" />
          Novo Ponto
        </Button>
      </div>

      {pontos.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            Nenhum ponto de entrega cadastrado.
          </p>
          <Button onClick={handleOpenNewDialog} variant="outline" className="mt-4">
            Criar Primeiro Ponto
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Ambiente de Preparo</TableHead>
                <TableHead>Mesa Próxima</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pontos.map((ponto) => (
                <TableRow key={ponto.id}>
                  <TableCell className="font-medium">{ponto.nome}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {ponto.descricao || '-'}
                  </TableCell>
                  <TableCell>
                    {ponto.ambientePreparo?.nome || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {ponto.mesaProxima
                      ? `Mesa ${ponto.mesaProxima.numero}`
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {ponto.ativo ? (
                      <Badge variant="default">Ativo</Badge>
                    ) : (
                      <Badge variant="secondary">Inativo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleAtivo(ponto)}
                      title={ponto.ativo ? 'Desativar' : 'Ativar'}
                    >
                      {ponto.ativo ? (
                        <ToggleRight className="w-4 h-4" />
                      ) : (
                        <ToggleLeft className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEditDialog(ponto)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDeleteDialog(ponto)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal de Criar/Editar */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingPonto ? 'Editar Ponto de Entrega' : 'Novo Ponto de Entrega'}
            </DialogTitle>
            <DialogDescription>
              {editingPonto
                ? 'Atualize as informações do ponto de entrega.'
                : 'Crie um novo local para retirada de pedidos.'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Ponto *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Piscina Infantil - Lado Direito" {...field} />
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
                      <Textarea
                        placeholder="Informações adicionais sobre o local..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ambientePreparoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ambiente de Preparo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o ambiente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ambientes.map((ambiente) => (
                          <SelectItem key={ambiente.id} value={ambiente.id}>
                            {ambiente.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mesaProximaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mesa Próxima (Opcional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma mesa de referência" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma</SelectItem>
                        {mesas.map((mesa) => (
                          <SelectItem key={mesa.id} value={mesa.id}>
                            Mesa {mesa.numero} - {mesa.ambiente?.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingPonto ? 'Atualizar' : 'Criar'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* AlertDialog de Confirmação de Exclusão */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O ponto de entrega{' '}
              <strong>{pontoToDelete?.nome}</strong> será permanentemente removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPontoToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Deletar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GestaoPontosEntregaPage;
