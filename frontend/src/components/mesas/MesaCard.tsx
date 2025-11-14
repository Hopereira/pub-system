// Caminho: frontend/src/components/mesas/MesaCard.tsx

'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mesa } from "@/types/mesa";
import { UtensilsCrossed, CheckCircle2, User, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import clsx from 'clsx';

interface MesaCardProps {
    mesa: Mesa;
    onClick: (mesa: Mesa) => void;
}

export default function MesaCard({ mesa, onClick }: MesaCardProps) {
    const isLivre = mesa.status === 'LIVRE';
    const isOcupada = mesa.status === 'OCUPADA';
    const isReservada = mesa.status === 'RESERVADA';

    // Define as classes de estilo com base no status da mesa
    const cardClasses = clsx(
        "cursor-pointer transition-all hover:shadow-lg", {
            "border-green-500 bg-green-50 hover:border-green-600": isLivre,
            "border-red-500 bg-red-50 hover:border-red-600": isOcupada,
            "border-yellow-500 bg-yellow-50 hover:border-yellow-600": isReservada,
        }
    );

    const iconClasses = clsx({
        "text-green-600": isLivre,
        "text-red-600": isOcupada,
        "text-yellow-600": isReservada,
    });

    return (
        <Card className={cardClasses} onClick={() => onClick(mesa)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    Mesa {mesa.numero}
                </CardTitle>
                {isLivre ? (
                    <CheckCircle2 className={iconClasses} />
                ) : (
                    <UtensilsCrossed className={iconClasses}/>
                )}
            </CardHeader>
            <CardContent className="space-y-2">
                {/* Status Badge */}
                <Badge 
                    variant={isLivre ? 'default' : isOcupada ? 'destructive' : 'secondary'}
                    className={clsx('text-xs font-bold', {
                        'bg-green-600': isLivre,
                        'bg-red-600': isOcupada,
                        'bg-yellow-600': isReservada,
                    })}
                >
                    {mesa.status}
                </Badge>

                {/* Informações da Comanda (se ocupada) */}
                {isOcupada && mesa.comanda && (
                    <div className="space-y-1 pt-2 border-t">
                        {/* Cliente */}
                        {mesa.comanda.cliente && (
                            <div className="flex items-center gap-1 text-xs">
                                <User className="h-3 w-3 text-muted-foreground" />
                                <span className="font-medium truncate">
                                    {mesa.comanda.cliente.nome}
                                </span>
                            </div>
                        )}
                        
                        {/* Tempo desde abertura */}
                        {mesa.comanda.criadoEm && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>
                                    {calcularTempoDecorrido(mesa.comanda.criadoEm)}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Mesa Reservada */}
                {isReservada && (
                    <div className="text-xs text-muted-foreground pt-2 border-t">
                        Aguardando cliente
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// Helper para calcular tempo decorrido
function calcularTempoDecorrido(criadoEm: string): string {
    const agora = new Date();
    const criacao = new Date(criadoEm);
    const diffMs = agora.getTime() - criacao.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
        return `${diffMins}min`;
    }
    
    const horas = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${horas}h ${mins}min`;
}