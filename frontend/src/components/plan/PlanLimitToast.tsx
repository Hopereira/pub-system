'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

const LIMIT_LABELS: Record<string, string> = {
  maxMesas: 'mesas',
  maxFuncionarios: 'funcionários',
  maxProdutos: 'produtos',
  maxAmbientes: 'ambientes',
  maxEventos: 'eventos',
  storageGB: 'armazenamento',
};

/**
 * Componente global que escuta o evento 'plan-limit-reached' emitido pelo interceptor
 * da API e exibe um toast de upgrade amigável.
 *
 * Deve ser montado uma única vez no layout principal (ex: ProtectedLayout).
 */
export function PlanLimitToast() {
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const label = LIMIT_LABELS[detail?.limitType] || detail?.limitType || 'recursos';
      const limit = detail?.limit ?? '?';
      const plano = detail?.plano ?? 'atual';

      toast.error(`Limite de ${label} atingido`, {
        description: `Você atingiu o limite de ${limit} ${label} do plano ${plano}. Faça upgrade para continuar.`,
        duration: 8000,
        action: {
          label: 'Ver planos',
          onClick: () => {
            window.location.href = '/dashboard/configuracoes/plano';
          },
        },
      });
    };

    window.addEventListener('plan-limit-reached', handler);
    return () => window.removeEventListener('plan-limit-reached', handler);
  }, []);

  return null;
}
