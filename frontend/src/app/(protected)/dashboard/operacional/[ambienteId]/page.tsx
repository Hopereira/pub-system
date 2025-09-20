import { OperacionalClientPage } from './OperacionalClientPage';

interface PaginaOperacionalProps {
  params: {
    ambienteId: string;
  };
}

export default async function PaginaOperacional({ params }: PaginaOperacionalProps) {
  const { ambienteId } = await params;
  return (
    <div className="flex flex-col h-full p-4 md:p-6 lg:p-8">
      <OperacionalClientPage ambienteId={ambienteId} />
    </div>
  );
}