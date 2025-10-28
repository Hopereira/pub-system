'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getPublicComandaById } from '@/services/comandaService';
import { ComandaStatus } from '@/types/comanda';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Ban } from 'lucide-react';
import { logger } from '@/lib/logger';

interface ComandaGuardProps {
  comandaId: string;
  children: React.ReactNode;
  allowedStatuses?: ComandaStatus[];
  redirectOnInvalid?: boolean;
}

/**
 * Guard que verifica o status da comanda antes de permitir acesso
 * Bloqueia acesso se comanda estiver PAGA ou FECHADA
 */
export const ComandaGuard = ({
  comandaId,
  children,
  allowedStatuses = [ComandaStatus.ABERTA],
  redirectOnInvalid = false,
}: ComandaGuardProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [comandaStatus, setComandaStatus] = useState<ComandaStatus | null>(null);
  const router = useRouter();

  useEffect(() => {
    const verificarComanda = async () => {
      try {
        logger.log('🔒 Verificando status da comanda', {
          module: 'ComandaGuard',
          comandaId,
        });

        const comanda = await getPublicComandaById(comandaId);
        setComandaStatus(comanda.status);

        const statusValido = allowedStatuses.includes(comanda.status);
        setIsValid(statusValido);

        if (!statusValido) {
          logger.warn('⚠️ Acesso bloqueado - Comanda não está em status válido', {
            module: 'ComandaGuard',
            comandaId,
            status: comanda.status,
            allowedStatuses,
          });

          if (redirectOnInvalid) {
            // Redireciona para página de visualização da comanda
            router.push(`/acesso-cliente/${comandaId}`);
          }
        }
      } catch (error) {
        logger.error('❌ Erro ao verificar comanda', {
          module: 'ComandaGuard',
          error: error as Error,
        });
        setIsValid(false);
      } finally {
        setIsLoading(false);
      }
    };

    verificarComanda();
  }, [comandaId, allowedStatuses, redirectOnInvalid, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-lg">Verificando comanda...</div>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 p-4">
        <Card className="max-w-md w-full text-center p-6">
          <CardHeader>
            {comandaStatus === ComandaStatus.PAGA || comandaStatus === ComandaStatus.FECHADA ? (
              <>
                <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
                <CardTitle className="text-2xl mt-4">Comanda Finalizada</CardTitle>
              </>
            ) : (
              <>
                <Ban className="mx-auto h-16 w-16 text-red-500" />
                <CardTitle className="text-2xl mt-4">Acesso Não Permitido</CardTitle>
              </>
            )}
          </CardHeader>
          <CardContent>
            {comandaStatus === ComandaStatus.PAGA || comandaStatus === ComandaStatus.FECHADA ? (
              <>
                <p className="text-muted-foreground mb-4">
                  Sua comanda foi finalizada com sucesso. Agradecemos a sua visita!
                </p>
                <p className="text-sm text-muted-foreground">
                  Para fazer um novo pedido, escaneie o QR Code novamente.
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">
                Esta comanda não está disponível para pedidos no momento.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
