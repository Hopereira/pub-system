// Caminho: frontend/src/app/(protected)/dashboard/admin/mesas/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Pencil, Trash2 } from 'lucide-react';

import { Mesa } from '@/types/mesa';
import { AmbienteData, getAmbientes } from '@/services/ambienteService';
import { getMesas, createMesa, updateMesa, deleteMesa } from '@/services/mesaService';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const formSchema = z.object({
  numero: z.coerce.number().min(1, { message: 'O número da mesa é obrigatório.' }),
  ambienteId: z.string({ required_error: 'Por favor, selecione um ambiente.' }),
});
type FormValues = z.infer<typeof formSchema>;

const GestaoMesasPage = () => {
    // Este é o código completo da tabela de gestão que já tínhamos...
    const [mesas, setMesas] = useState<Mesa[]>([]);
    const [ambientes, setAmbientes] = useState<AmbienteData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMesa, setEditingMesa] = useState<Mesa | null>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { numero: undefined, ambienteId: undefined },
    });

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [mesasData, ambientesData] = await Promise.all([getMesas(), getAmbientes()]);
            setMesas(mesasData.sort((a, b) => a.numero - b.numero) || []);
            setAmbientes(ambientesData || []);
        } catch (err) {
            toast.error('Falha ao carregar dados da página.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleOpenNewDialog = () => {
        setEditingMesa(null);
        form.reset({ numero: undefined, ambienteId: undefined });
        setIsModalOpen(true);
    };
    
    const handleOpenEditDialog = (mesa: Mesa) => {
        setEditingMesa(mesa);
        form.reset({ numero: mesa.numero, ambienteId: mesa.ambiente.id });
        setIsModalOpen(true);
    };

    const onSubmit = async (values: FormValues) => {
        try {
            if (editingMesa) {
                await updateMesa(editingMesa.id, values);
                toast.success('Mesa atualizada com sucesso!');
            } else {
                await createMesa(values);
                toast.success('Mesa criada com sucesso!');
            }
            setIsModalOpen(false);
            await loadData();
        } catch (err) {
            toast.error(editingMesa ? 'Falha ao atualizar a mesa.' : 'Falha ao criar a mesa.');
        }
    };
    
    const handleDelete = async (id: string) => {
        try {
            await deleteMesa(id);
            toast.success("Mesa apagada com sucesso!");
            await loadData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Falha ao apagar a mesa.");
        }
    };

    if (isLoading) return <p className="p-4">Carregando...</p>;

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Gerenciamento de Mesas (Admin)</h1>
                <Button onClick={handleOpenNewDialog}>Adicionar Nova Mesa</Button>
            </div>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader><DialogTitle>{editingMesa ? 'Editar Mesa' : 'Adicionar Nova Mesa'}</DialogTitle></DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                            <FormField control={form.control} name="numero" render={({ field }) => ( <FormItem><FormLabel>Número da Mesa</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                            <FormField control={form.control} name="ambienteId" render={({ field }) => ( <FormItem><FormLabel>Ambiente</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione o ambiente" /></SelectTrigger></FormControl><SelectContent>{ambientes.map(ambiente => ( <SelectItem key={ambiente.id} value={ambiente.id}>{ambiente.nome}</SelectItem> ))}</SelectContent></Select><FormMessage /></FormItem> )}/>
                            <DialogFooter><Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? 'Salvando...' : 'Salvar'}</Button></DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
            <div className="border rounded-md">
                <Table>
                    <TableHeader><TableRow><TableHead>Número</TableHead><TableHead>Ambiente</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {mesas.map((mesa) => (
                            <TableRow key={mesa.id}>
                                <TableCell className="font-medium">{mesa.numero}</TableCell>
                                <TableCell>{mesa.ambiente.nome}</TableCell>
                                <TableCell>{mesa.status}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(mesa)}><Pencil className="h-4 w-4" /></Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon" disabled={mesa.status !== 'Livre'}><Trash2 className="h-4 w-4 text-red-500" /></Button></AlertDialogTrigger>
                                        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle><AlertDialogDescription>A ação de apagar a Mesa {mesa.numero} não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(mesa.id)}>Continuar</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
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
export default GestaoMesasPage;