// Caminho: frontend/src/app/(protected)/dashboard/operacional/[ambienteId]/page.tsx

import { OperacionalClientPage } from './OperacionalClientPage'; // 1. Importamos o nosso novo componente

export default function PaginaOperacional({ params }: { params: { ambienteId: string } }) {
  const { ambienteId } = params;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold leading-6 text-gray-900 dark:text-white">
            Painel Operacional
          </h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Acompanhe os pedidos em tempo real para o ambiente selecionado.
          </p>
          <p className="mt-2 text-xs text-gray-500">
            ID do Ambiente: {ambienteId}
          </p>
        </div>
      </div>

      {/* 2. Renderizamos o componente de cliente, passando o ambienteId para ele */}
      <OperacionalClientPage ambienteId={ambienteId} />
    </div>
  );
}