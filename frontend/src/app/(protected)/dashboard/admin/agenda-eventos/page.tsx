// frontend/src/app/(protected)/dashboard/admin/agenda-eventos/page.tsx
import { getAllEventos } from "@/services/eventoService"; // Precisaremos criar esta função no service
import AgendaEventosClientPage from "./AgendaEventosClientPage";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

// Esta página busca os dados iniciais no servidor.
export default async function AgendaEventosPage() {
  
  // NOTA: A função `getAllEventos` ainda não existe, teremos que a criar.
  // Por agora, vamos imaginar que ela funciona e retorna os eventos.
  // const eventos = await getAllEventos();
  const eventos = []; // Começaremos com uma lista vazia por enquanto.

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Agenda de Eventos</h1>
          <p className="text-muted-foreground">Crie e gira a programação do seu estabelecimento.</p>
        </div>
      </div>
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Agenda de Eventos</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      {/* O componente cliente receberá os dados e cuidará de toda a interatividade */}
      <AgendaEventosClientPage initialData={eventos} />
    </div>
  );
}