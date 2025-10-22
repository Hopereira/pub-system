'use client';

import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Users, Music, Ticket } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EventoHeroProps {
  titulo: string;
  descricao?: string;
  urlImagem?: string;
  data?: string;
  horario?: string;
  local?: string;
  capacidade?: number;
  valorEntrada?: number;
  categoria?: string;
  onCTAClick?: () => void;
  ctaText?: string;
}

export function EventoHero({
  titulo,
  descricao,
  urlImagem,
  data,
  horario,
  local,
  capacidade,
  valorEntrada,
  categoria,
  onCTAClick,
  ctaText = 'Reservar Mesa',
}: EventoHeroProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  return (
    <div className="relative w-full overflow-hidden">
      {/* Hero Image com Overlay Gradiente */}
      <div className="relative w-full h-[60vh] min-h-[400px] max-h-[600px]">
        {urlImagem ? (
          <Image
            src={urlImagem}
            alt={titulo}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
        )}
        
        {/* Overlay Gradiente */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        
        {/* Badge de Categoria */}
        {categoria && (
          <div className="absolute top-6 left-6">
            <Badge className="text-sm px-3 py-1 bg-primary/90 backdrop-blur-sm">
              <Music className="h-3 w-3 mr-1" />
              {categoria}
            </Badge>
          </div>
        )}

        {/* Valor de Entrada em Destaque */}
        {valorEntrada && valorEntrada > 0 && (
          <div className="absolute top-6 right-6">
            <div className="bg-red-500 text-white px-4 py-2 rounded-full shadow-lg backdrop-blur-sm flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              <span className="font-bold">{formatPrice(valorEntrada)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Conteúdo Principal */}
      <div className="relative -mt-32 z-10">
        <div className="container max-w-4xl mx-auto px-4">
          {/* Card Flutuante com Info Principal */}
          <div className="bg-card rounded-2xl shadow-2xl border-2 border-border/50 backdrop-blur-sm overflow-hidden">
            <div className="p-6 md:p-8">
              {/* Título */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                {titulo}
              </h1>

              {/* Descrição */}
              {descricao && (
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  {descricao}
                </p>
              )}

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {data && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Data</p>
                      <p className="font-semibold">{data}</p>
                    </div>
                  </div>
                )}

                {horario && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Horário</p>
                      <p className="font-semibold">{horario}</p>
                    </div>
                  </div>
                )}

                {local && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Local</p>
                      <p className="font-semibold">{local}</p>
                    </div>
                  </div>
                )}

                {capacidade && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Capacidade</p>
                      <p className="font-semibold">{capacidade} pessoas</p>
                    </div>
                  </div>
                )}
              </div>

              {/* CTA Principal */}
              {onCTAClick && (
                <Button
                  onClick={onCTAClick}
                  size="lg"
                  className="w-full h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  {ctaText}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
