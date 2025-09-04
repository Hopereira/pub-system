// Caminho: frontend/src/components/mesas/MesaCard.tsx

'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mesa } from "@/types/mesa";
import { UtensilsCrossed, CheckCircle2 } from "lucide-react";
import clsx from 'clsx';

interface MesaCardProps {
    mesa: Mesa;
    onClick: (mesa: Mesa) => void;
}

export default function MesaCard({ mesa, onClick }: MesaCardProps) {
    const isLivre = mesa.status === 'LIVRE';

    // Define as classes de estilo com base no status da mesa
    const cardClasses = clsx(
        "cursor-pointer transition-all hover:shadow-lg", {
            "border-green-500 bg-green-50 hover:border-green-600": isLivre,
            "border-orange-500 bg-orange-50": !isLivre,
        }
    );

    const iconClasses = clsx({
        "text-green-600": isLivre,
        "text-orange-600": !isLivre,
    });

    return (
        <Card className={cardClasses} onClick={() => onClick(mesa)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    Mesa {mesa.numero}
                </CardTitle>
                {isLivre ? <CheckCircle2 className={iconClasses} /> : <UtensilsCrossed className={iconClasses}/>}
            </CardHeader>
            <CardContent>
                <div className="text-xs text-muted-foreground uppercase font-bold">
                    {mesa.status.replace('_', ' ')}
                </div>
            </CardContent>
        </Card>
    );
}