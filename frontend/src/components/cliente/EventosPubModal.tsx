'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getPublicEventos } from "@/services/eventoService";
import { Evento } from "@/types/evento";
import { Loader2, Calendar, DollarSign, Info } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EventosPubModalProps {
    open: boolean;
    onOpenChange: (open: (open: boolean) => boolean) => void;
}

/**
 * Modal que exibe a lista de eventos ativos para o cliente.
 */
export default function EventosPubModal({ open, onOpenChange }: EventosPubModalProps) {
    const [eventos, setEventos] = useState<Evento[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Carrega os eventos sempre que o modal é aberto
    useEffect(() => {
        if (open) {
            fetchEventosPublicos();
        }
    }, [open]);

    const fetchEventosPublicos = async () => {
        setIsLoading(true);
        try {
            // Chama a função que usa GET /eventos/publicos
            const data = await getPublicEventos(); 
            setEventos(data);
        } catch (error) {
            console.error('Erro ao carregar eventos públicos:', error);
            toast.error('Não foi possível carregar a agenda de eventos.');
            setEventos([]); 
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Agenda da Semana</DialogTitle>
                    <DialogDescription>
                        Confira os eventos programados para os próximos dias no pub!
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 pt-2">
                    {/* Visualização de Loading */}
                    {isLoading && (
                        <div className="flex justify-center items-center h-32">
                            <Loader2 className="h-6 w-6 animate-spin mr-2" />
                            <p>Carregando eventos...</p>
                        </div>
                    )}

                    {/* Estado Vazio */}
                    {!isLoading && eventos && eventos.length === 0 && (
                        <div className="text-center p-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <Info className="h-6 w-6 text-gray-500 mx-auto mb-2" />
                            <p className="text-muted-foreground">Nenhum evento ativo programado no momento.</p>
                        </div>
                    )}

                    {/* Exibição da Lista de Eventos */}
                    {!isLoading && eventos && eventos.length > 0 && (
                        eventos.map((evento) => (
                            <div 
                                key={evento.id} 
                                className="border rounded-lg overflow-hidden shadow-sm dark:bg-gray-900"
                            >
                                {/* Imagem de Destaque */}
                                {evento.urlImagem && (
                                    <img 
                                        src={evento.urlImagem} 
                                        alt={evento.titulo} 
                                        className="w-full h-40 object-cover" 
                                    />
                                )}
                                
                                <div className="p-4 space-y-3">
                                    <h3 className="text-xl font-bold">{evento.titulo}</h3>
                                    <p className="text-sm text-muted-foreground">{evento.descricao}</p>
                                    
                                    {/* Data e Valor */}
                                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                        <div className="flex items-center">
                                            <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                                            <span>
                                                {format(new Date(evento.dataEvento), "PPP 'às' HH:mm", { locale: ptBR })}
                                            </span>
                                        </div>
                                        <div className="flex items-center">
                                            <DollarSign className="h-4 w-4 mr-2 flex-shrink-0" />
                                            <span className="font-medium">
                                                {evento.valor > 0 
                                                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(evento.valor)
                                                    : 'Entrada Gratuita'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}